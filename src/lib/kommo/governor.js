// src/lib/kommo/governor.js
//
// Governor de llamadas salientes a Kommo CRM.
//
// Motivo: Kommo bloqueó la IP del servidor por exceso de requests (limite oficial
// documentado: 7 req/s). Este modulo centraliza TODO el trafico saliente hacia Kommo
// para garantizar que nunca se vuelva a superar el limite y que, ante señales de
// bloqueo (401/403), se deje de insistir inmediatamente en vez de empeorar el bloqueo.
//
// Componentes (todos singleton a nivel de modulo, viven en memoria del proceso):
//   1. Token bucket: 3 req/s sostenido, burst maximo 3. Encola (espera) en vez de
//      rechazar, hasta un timeout maximo de 30s.
//   2. Retry con backoff exponencial + full jitter ante 429 / 5xx / error de red.
//   3. Bloqueo inmediato (cero reintentos) ante 401/403 — son señal de baneo activo.
//   4. Circuit breaker (closed -> open -> half-open) que evita pegarle a Kommo
//      mientras se sabe que la cuenta/IP esta bloqueada.
//
// Todo el trafico del proyecto hacia Kommo DEBE pasar por `kommoRequest`.

import axios from 'axios';

/**
 * @typedef {import('axios').AxiosRequestConfig} AxiosRequestConfig
 * @typedef {import('axios').AxiosResponse} AxiosResponse
 */

// ---------------------------------------------------------------------------
// Errores custom
// ---------------------------------------------------------------------------

/**
 * Se lanza cuando el circuit breaker esta abierto (Kommo bloqueado, no se
 * intenta la request real) o cuando Kommo responde 401/403 (señal de baneo).
 */
export class KommoBlockedError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = 'KommoBlockedError';
  }
}

/**
 * Se lanza cuando se agotan los reintentos configurados (429 / 5xx / error de
 * red) sin obtener una respuesta exitosa, o cuando el token bucket no logra
 * asignar budget dentro del tiempo maximo de espera.
 */
export class KommoRateLimitError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = 'KommoRateLimitError';
  }
}

// ---------------------------------------------------------------------------
// Configuracion (constantes de diseño, no tocar sin coordinar arquitectura)
// ---------------------------------------------------------------------------

/** Capacidad maxima del bucket (burst). */
const BUCKET_CAPACITY = 3;
/** Tasa de refill del bucket, en tokens por segundo. */
const REFILL_RATE_PER_SEC = 3;
/** Tiempo maximo que una request puede esperar budget del bucket antes de abortar. */
const MAX_BUCKET_WAIT_MS = 30000;

/** Cantidad maxima de reintentos ante 429 / 5xx / error de red. */
const MAX_RETRIES = 3;
/** Base del backoff exponencial (ms): 1000 -> 2000 -> 4000. */
const BASE_BACKOFF_MS = 1000;
/** Tope maximo de espera si Kommo manda header Retry-After. */
const MAX_RETRY_AFTER_MS = 30000;

/** Cooldown inicial del circuit breaker al abrirse desde estado closed. */
const BASE_BREAKER_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos
/** Tope maximo de cooldown del circuit breaker (duplica en cada probe fallido). */
const MAX_BREAKER_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutos

// Alerta temprana de saturacion (solo consola por ahora, sin canal externo
// todavia — se conecta mas adelante). Objetivo: avisar ANTES de que Kommo
// responda 429/403, en base a señales de que nos estamos acercando al limite
// real documentado (7 req/s), aunque nuestro bucket interno sea mas conservador.

/** Espera (ms) por token que se considera señal de saturacion sostenida. */
const SATURATION_WAIT_THRESHOLD_MS = 300;
/** Cantidad de requests encoladas simultaneamente que se considera señal de saturacion. */
const SATURATION_QUEUE_THRESHOLD = 2;
/** Throttle minimo entre warnings de "acercandose al limite" (evita spam en saturacion sostenida). */
const APPROACHING_LIMIT_WARN_THROTTLE_MS = 30000;

// ---------------------------------------------------------------------------
// Estado del token bucket (singleton de modulo)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} BucketState
 * @property {number} tokens - Tokens disponibles actualmente (puede ser fraccional).
 * @property {number} lastRefill - Timestamp (ms) del ultimo refill aplicado.
 */

/** @type {BucketState} */
const bucketState = {
  tokens: BUCKET_CAPACITY,
  lastRefill: Date.now(),
};

/** Cantidad de requests actualmente esperando budget del token bucket (señal de encolamiento). */
let waitingForTokenCount = 0;

/** Timestamp (ms) del ultimo warning de saturacion (bucket) emitido — para throttle. */
let lastSaturationWarnAt = 0;

/** Timestamp (ms) del ultimo warning por 429 emitido — para throttle (independiente del anterior). */
let last429WarnAt = 0;

/**
 * Loguea (throttleado a 1 vez cada APPROACHING_LIMIT_WARN_THROTTLE_MS) un
 * warning cuando se detectan señales de saturacion del token bucket antes de
 * que Kommo llegue a responder 429/403: espera prolongada por token, o
 * varias requests encoladas al mismo tiempo esperando budget.
 * @param {number} waitedMs - Ms que la request actual lleva esperando budget.
 * @returns {void}
 */
function maybeWarnBucketSaturation(waitedMs) {
  const saturatedByWait = waitedMs > SATURATION_WAIT_THRESHOLD_MS;
  const saturatedByQueue = waitingForTokenCount >= SATURATION_QUEUE_THRESHOLD;
  if (!saturatedByWait && !saturatedByQueue) return;

  const now = Date.now();
  if (now - lastSaturationWarnAt < APPROACHING_LIMIT_WARN_THROTTLE_MS) return;
  lastSaturationWarnAt = now;

  console.warn(
    `[kommo-governor] Acercandose al limite de rate de Kommo: esperaMs=${Math.round(waitedMs)} requestsEncoladas=${waitingForTokenCount} timestamp=${new Date(now).toISOString()}`,
  );
}

/**
 * Loguea (throttleado a 1 vez cada APPROACHING_LIMIT_WARN_THROTTLE_MS) un
 * warning cuando Kommo responde 429, antes de agotar los reintentos. Es la
 * señal mas directa de que se esta cerca del limite real de Kommo (no solo
 * saturacion interna del bucket).
 * @param {string} requestUrl
 * @returns {void}
 */
function maybeWarn429(requestUrl) {
  const now = Date.now();
  if (now - last429WarnAt < APPROACHING_LIMIT_WARN_THROTTLE_MS) return;
  last429WarnAt = now;

  console.warn(
    `[kommo-governor] Acercandose al limite de rate de Kommo: Kommo respondio 429 url=${requestUrl} timestamp=${new Date(now).toISOString()}`,
  );
}

/**
 * Recarga el bucket segun el tiempo transcurrido desde el ultimo refill.
 * @returns {void}
 */
function refillBucket() {
  const now = Date.now();
  const elapsedSec = (now - bucketState.lastRefill) / 1000;
  if (elapsedSec <= 0) return;
  bucketState.tokens = Math.min(
    BUCKET_CAPACITY,
    bucketState.tokens + elapsedSec * REFILL_RATE_PER_SEC,
  );
  bucketState.lastRefill = now;
}

/**
 * Espera hasta que haya al menos 1 token disponible en el bucket y lo consume.
 * Si no se logra budget dentro de MAX_BUCKET_WAIT_MS, aborta con KommoRateLimitError.
 * @returns {Promise<void>}
 * @throws {KommoRateLimitError} Si se agota el tiempo maximo de espera.
 */
async function acquireToken() {
  const startedAt = Date.now();
  // True mientras esta request esta contabilizada en waitingForTokenCount
  // (solo se cuenta a partir de la primera vez que no hay token disponible).
  let countedAsWaiting = false;
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      refillBucket();
      if (bucketState.tokens >= 1) {
        bucketState.tokens -= 1;
        maybeWarnBucketSaturation(Date.now() - startedAt);
        return;
      }

      if (!countedAsWaiting) {
        waitingForTokenCount += 1;
        countedAsWaiting = true;
      }
      // Señal de saturacion por encolamiento: se evalua ya durante la espera,
      // no solo al conseguir el token, para detectar picos sostenidos.
      maybeWarnBucketSaturation(Date.now() - startedAt);

      const elapsed = Date.now() - startedAt;
      if (elapsed >= MAX_BUCKET_WAIT_MS) {
        console.error(
          `[kommo-governor] Timeout esperando budget del token bucket (${MAX_BUCKET_WAIT_MS}ms). Abortando request.`,
        );
        throw new KommoRateLimitError(
          `Kommo governor: timeout de ${MAX_BUCKET_WAIT_MS}ms esperando budget del rate limiter.`,
        );
      }
      const tokensNeeded = 1 - bucketState.tokens;
      const msUntilNextToken = Math.max(25, (tokensNeeded / REFILL_RATE_PER_SEC) * 1000);
      const waitMs = Math.min(msUntilNextToken, MAX_BUCKET_WAIT_MS - elapsed);
      await sleep(waitMs);
    }
  } finally {
    if (countedAsWaiting) {
      waitingForTokenCount -= 1;
    }
  }
}

// ---------------------------------------------------------------------------
// Estado del circuit breaker (singleton de modulo)
// ---------------------------------------------------------------------------

/**
 * @typedef {'closed'|'open'|'half-open'} BreakerMode
 */

/**
 * @typedef {Object} BreakerState
 * @property {BreakerMode} mode - Estado actual del breaker.
 * @property {number|null} openedAt - Timestamp (ms) en que se abrio el breaker.
 * @property {number} cooldownMs - Cooldown vigente antes de pasar a half-open.
 * @property {boolean} halfOpenProbeReserved - True si ya hay una probe en curso.
 */

/** @type {BreakerState} */
const breakerState = {
  mode: 'closed',
  openedAt: null,
  cooldownMs: BASE_BREAKER_COOLDOWN_MS,
  halfOpenProbeReserved: false,
};

/** Contador de agotamientos de reintentos por 429 consecutivos (se resetea en cada exito). */
let consecutive429Exhaustions = 0;

/**
 * Sincroniza el estado del breaker con el paso del tiempo: si esta open y ya
 * paso el cooldown, transiciona a half-open (sin reservar todavia la probe).
 * @returns {void}
 */
function syncBreakerState() {
  if (breakerState.mode !== 'open' || breakerState.openedAt == null) return;
  const elapsed = Date.now() - breakerState.openedAt;
  if (elapsed >= breakerState.cooldownMs) {
    breakerState.mode = 'half-open';
    console.warn(
      '[kommo-governor] Circuit breaker paso a HALF-OPEN. Se permitira una unica request de prueba.',
    );
  }
}

/**
 * Determina si esta request puede pasar y si, en caso de estar en half-open,
 * es la request "de prueba" reservada.
 * @returns {{ blocked: boolean, isProbe: boolean }}
 */
function acquireBreakerGate() {
  syncBreakerState();

  if (breakerState.mode === 'closed') {
    return { blocked: false, isProbe: false };
  }

  if (breakerState.mode === 'open') {
    return { blocked: true, isProbe: false };
  }

  // half-open: solo una request de prueba puede pasar por vez.
  if (breakerState.halfOpenProbeReserved) {
    return { blocked: true, isProbe: false };
  }
  breakerState.halfOpenProbeReserved = true;
  return { blocked: false, isProbe: true };
}

/**
 * Abre (o reabre) el circuit breaker.
 * @param {string} reason - Motivo, para logging/diagnostico.
 * @param {{ wasProbe?: boolean }} [options]
 * @returns {void}
 */
function openBreaker(reason, options = {}) {
  const wasProbe = options.wasProbe === true;
  let newCooldownMs;

  if (wasProbe) {
    // La probe de half-open fallo: duplicar el cooldown anterior (cap 30 min).
    newCooldownMs = Math.min(breakerState.cooldownMs * 2, MAX_BREAKER_COOLDOWN_MS);
  } else if (breakerState.mode !== 'open') {
    // Apertura "fresca" desde closed (o half-open sin marcar como probe): cooldown base.
    newCooldownMs = BASE_BREAKER_COOLDOWN_MS;
  } else {
    // Ya estaba open (no deberia ocurrir normalmente porque open bloquea antes
    // de llegar aca), se mantiene el cooldown vigente por seguridad.
    newCooldownMs = breakerState.cooldownMs;
  }

  breakerState.mode = 'open';
  breakerState.openedAt = Date.now();
  breakerState.cooldownMs = newCooldownMs;
  breakerState.halfOpenProbeReserved = false;

  console.error(
    `[kommo-governor] Circuit breaker ABIERTO. razon="${reason}" cooldownMs=${newCooldownMs} wasProbe=${wasProbe}`,
  );
}

/**
 * Cierra el circuit breaker (la probe de half-open tuvo exito) y resetea el
 * cooldown a su valor base para la proxima vez que se abra.
 * @returns {void}
 */
function closeBreaker() {
  breakerState.mode = 'closed';
  breakerState.openedAt = null;
  breakerState.cooldownMs = BASE_BREAKER_COOLDOWN_MS;
  breakerState.halfOpenProbeReserved = false;
  consecutive429Exhaustions = 0;
  console.warn('[kommo-governor] Circuit breaker CERRADO (probe de half-open exitosa).');
}

/**
 * Indica si el circuit breaker esta actualmente abierto (bloqueando trafico).
 * Sincroniza primero el estado por si ya paso el cooldown y corresponde
 * pasar a half-open.
 * @returns {boolean}
 */
export function isCircuitOpen() {
  syncBreakerState();
  return breakerState.mode === 'open';
}

/**
 * Milisegundos restantes hasta que el circuit breaker pueda pasar a half-open.
 * Devuelve 0 si el breaker no esta abierto (closed o half-open).
 * @returns {number}
 */
export function getCircuitRetryAfterMs() {
  syncBreakerState();
  if (breakerState.mode !== 'open' || breakerState.openedAt == null) return 0;
  const elapsed = Date.now() - breakerState.openedAt;
  return Math.max(0, breakerState.cooldownMs - elapsed);
}

// ---------------------------------------------------------------------------
// Helpers de retry/backoff
// ---------------------------------------------------------------------------

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

/**
 * Parsea el header Retry-After (segundos o fecha HTTP) a milisegundos.
 * @param {string|undefined} headerValue
 * @returns {number|null}
 */
function parseRetryAfterMs(headerValue) {
  if (!headerValue) return null;
  const asSeconds = Number(headerValue);
  if (!Number.isNaN(asSeconds)) {
    return asSeconds * 1000;
  }
  const asDate = Date.parse(headerValue);
  if (!Number.isNaN(asDate)) {
    return Math.max(0, asDate - Date.now());
  }
  return null;
}

/**
 * Calcula el tiempo de espera antes del proximo reintento: respeta
 * Retry-After si viene presente (cap 30s), si no usa backoff exponencial
 * (1s/2s/4s) con full jitter (random entre 0 y el valor de backoff).
 * @param {number} retryIndex - 0 para el primer reintento, 1 para el segundo, 2 para el tercero.
 * @param {string|undefined} retryAfterHeader
 * @returns {number}
 */
function computeBackoffMs(retryIndex, retryAfterHeader) {
  const retryAfterMs = parseRetryAfterMs(retryAfterHeader);
  if (retryAfterMs != null) {
    return Math.min(retryAfterMs, MAX_RETRY_AFTER_MS);
  }
  const baseDelayMs = BASE_BACKOFF_MS * 2 ** retryIndex; // 1000, 2000, 4000
  return Math.random() * baseDelayMs; // full jitter: [0, baseDelayMs)
}

/**
 * Determina si un error de axios corresponde a un error de red (sin respuesta
 * del servidor: timeout, conexion rechazada/reseteada, DNS, etc.).
 * @param {unknown} err
 * @returns {boolean}
 */
function isNetworkError(err) {
  if (typeof err !== 'object' || err === null) return false;
  const axiosErr = /** @type {{ response?: unknown }} */ (err);
  return axiosErr.response === undefined;
}

/**
 * Extrae el status HTTP de un error de axios, si existe.
 * @param {unknown} err
 * @returns {number|undefined}
 */
function getErrorStatus(err) {
  if (typeof err !== 'object' || err === null) return undefined;
  const axiosErr = /** @type {{ response?: { status?: number } }} */ (err);
  return axiosErr.response?.status;
}

/**
 * Extrae el header Retry-After de la respuesta de un error de axios, si existe.
 * @param {unknown} err
 * @returns {string|undefined}
 */
function getRetryAfterHeader(err) {
  if (typeof err !== 'object' || err === null) return undefined;
  const axiosErr = /** @type {{ response?: { headers?: Record<string, string> } }} */ (err);
  return axiosErr.response?.headers?.['retry-after'];
}

/**
 * Se llama tras cada request exitosa (2xx) para resetear contadores de riesgo.
 * @returns {void}
 */
function onRequestSuccess() {
  consecutive429Exhaustions = 0;
}

// ---------------------------------------------------------------------------
// API principal
// ---------------------------------------------------------------------------

/**
 * Ejecuta una request hacia Kommo aplicando, en este orden: circuit breaker,
 * token bucket (rate limiting) y retry con backoff. Es el UNICO punto por el
 * que debe pasar todo el trafico saliente hacia Kommo en este proyecto.
 *
 * @param {AxiosRequestConfig} config - Config de request de axios (url, method, data, etc.).
 * @returns {Promise<AxiosResponse>} La response de axios ante un resultado exitoso.
 * @throws {KommoBlockedError} Si el breaker esta abierto, o Kommo responde 401/403.
 * @throws {KommoRateLimitError} Si se agotan los reintentos, o se agota el timeout del bucket.
 */
export async function kommoRequest(config) {
  const requestUrl = config?.url ?? 'unknown-url';
  const gate = acquireBreakerGate();

  if (gate.blocked) {
    const retryAfterMs = getCircuitRetryAfterMs();
    console.error(
      `[kommo-governor] Circuit breaker abierto, request rechazada sin llegar a Kommo. url=${requestUrl} retryAfterMs=${retryAfterMs}`,
    );
    throw new KommoBlockedError(
      `Kommo esta bloqueado (circuit breaker abierto). Reintentar en ~${Math.ceil(retryAfterMs / 1000)}s. url=${requestUrl}`,
    );
  }

  // Camino de la request de prueba en half-open: una unica llamada, sin
  // reintentos. Exito cierra el breaker; cualquier falla lo reabre duplicando
  // el cooldown.
  if (gate.isProbe) {
    console.warn(`[kommo-governor] Ejecutando request de prueba (half-open). url=${requestUrl}`);
    await acquireToken();
    try {
      const response = await axios.request(config);
      onRequestSuccess();
      closeBreaker();
      return response;
    } catch (err) {
      const status = getErrorStatus(err);
      openBreaker(`Probe de half-open fallo (status=${status ?? 'network-error'})`, {
        wasProbe: true,
      });
      throw new KommoBlockedError(
        `Kommo sigue bloqueado: la request de prueba fallo (status=${status ?? 'network-error'}). url=${requestUrl}`,
      );
    }
  }

  // Camino normal (breaker closed): rate limiting + retry con backoff.
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await acquireToken();
    try {
      const response = await axios.request(config);
      onRequestSuccess();
      return response;
    } catch (err) {
      const status = getErrorStatus(err);

      // 429 es la señal mas directa de cercania al limite real de Kommo:
      // se avisa apenas ocurre, sin esperar a que se agoten los reintentos.
      if (status === 429) {
        maybeWarn429(requestUrl);
      }

      // 401/403: señal de bloqueo activo. Cero reintentos, abrir breaker ya.
      if (status === 401 || status === 403) {
        openBreaker(`HTTP ${status} recibido de Kommo`, { wasProbe: false });
        console.error(
          `[kommo-governor] Bloqueo detectado (status=${status}). Abortando sin reintentar. url=${requestUrl}`,
        );
        throw new KommoBlockedError(
          `Kommo devolvio ${status} — posible baneo activo. Circuit breaker abierto. url=${requestUrl}`,
        );
      }

      const network = isNetworkError(err);
      const retryable = status === 429 || (typeof status === 'number' && status >= 500 && status < 600) || network;

      if (!retryable || attempt >= MAX_RETRIES) {
        if (status === 429) {
          consecutive429Exhaustions += 1;
          console.error(
            `[kommo-governor] Se agotaron los reintentos ante 429. consecutiveExhaustions=${consecutive429Exhaustions}/3 url=${requestUrl}`,
          );
          if (consecutive429Exhaustions >= 3) {
            openBreaker('3 agotamientos de reintentos por 429 consecutivos', { wasProbe: false });
          }
        } else {
          console.error(
            `[kommo-governor] Se agotaron los reintentos ante error no recuperable. status=${status ?? 'network-error'} url=${requestUrl}`,
          );
        }
        throw new KommoRateLimitError(
          `Kommo request fallo tras ${attempt} reintento(s) (status=${status ?? 'network-error'}). url=${requestUrl}`,
        );
      }

      attempt += 1;
      const retryAfterHeader = getRetryAfterHeader(err);
      const waitMs = computeBackoffMs(attempt - 1, retryAfterHeader);
      console.warn(
        `[kommo-governor] Reintentando request (intento ${attempt}/${MAX_RETRIES}) en ~${Math.round(waitMs)}ms. status=${status ?? 'network-error'} url=${requestUrl}`,
      );
      await sleep(waitMs);
    }
  }
}
