// Captura y recuperación de atribución de Google Ads (gclid/gbraid/wbraid +
// utm_*) desde la URL de entrada del visitante. El objetivo es poder
// conciliar leads de Kommo contra conversiones de Ads: guardamos el último
// click válido en localStorage y otro módulo (fuera de este archivo) lo lee
// para adjuntarlo al modal de cotización cuando se envía el lead.
//
// Funciones puras respecto del entorno externo (solo tocan `window.location`
// y `window.localStorage`), pensadas para poder testearse mockeando ambos.

/** Clave estable bajo la que se persiste la atribución capturada. */
const STORAGE_KEY = "amd_attribution";

/**
 * Ventana de vigencia de la atribución. 90 días es el tope de ventana de
 * conversión que usamos para conciliar contra Google Ads — pasado ese
 * tiempo, el dato ya no es útil para atribuir un lead a un click.
 */
const EXPIRATION_MS = 90 * 24 * 60 * 60 * 1000;

/** Click IDs que dispara Google Ads (Search/PMax vía gclid, App vía gbraid/wbraid). */
const CLICK_ID_KEYS = ["gclid", "gbraid", "wbraid"] as const;

/** Parámetros UTM estándar que acompañan a una campaña. */
const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

/** IDs numéricos de campaña/grupo/anuncio (ValueTrack de Google Ads). */
const AD_ID_KEYS = ["campaignid", "adgroupid", "adid"] as const;

/** Claves aceptadas desde la URL. `gclientid` NUNCA viene de la URL, solo de la cookie _ga. */
const ATTRIBUTION_KEYS = [
  ...CLICK_ID_KEYS,
  ...UTM_KEYS,
  ...AD_ID_KEYS,
] as const;

const GA_CLIENT_ID_KEY = "gclientid";

/** Claves que se guardan y se propagan al iframe del form. */
const STORED_KEYS = [...ATTRIBUTION_KEYS, GA_CLIENT_ID_KEY] as const;

type AttributionKey = (typeof STORED_KEYS)[number];

const AD_ID_PATTERN = /^\d{1,20}$/;

/** client_id de GA4: dos bloques numéricos separados por punto. */
const GA_CLIENT_ID_PATTERN = /^\d{1,20}\.\d{1,20}$/;

/** Cookie `_ga` de GA4: GA1.x.AAAA.BBBB, con client_id = AAAA.BBBB. */
const GA_COOKIE_PATTERN = /^GA\d+\.\d+\.(\d{1,20}\.\d{1,20})$/;

const CONTROL_CHARS_PATTERN = /[\u0000-\u001f\u007f]/;

/** Tope defensivo del valor codificado de la cookie (el límite del navegador es ~4096 bytes). */
const COOKIE_MAX_LENGTH = 2000;

/** Tolerancia de reloj: un capturedAt más allá de esto en el futuro se considera manipulado. */
const CLOCK_SKEW_MS = 5 * 60 * 1000;

/** Clave y valor con que CookieConsent.astro guarda la aceptación (rechazo: 'essential-only'). */
const CONSENT_KEY = "cookie-consent";
const CONSENT_ACCEPTED = "accepted";

/**
 * Formato real de un gclid/gbraid/wbraid: alfanumérico + guiones/underscore,
 * sin límite de longitud documentado por Google pero acotado a 200
 * caracteres como cota defensiva razonable.
 */
const CLICK_ID_PATTERN = /^[A-Za-z0-9_-]{1,200}$/;

/** Cota defensiva de longitud para utm_* (no hay un formato fijo esperado). */
const UTM_MAX_LENGTH = 150;

interface StoredAttribution {
  capturedAt: number;
  params: Partial<Record<AttributionKey, string>>;
}

function isInKeys(keys: readonly string[], key: string): boolean {
  return keys.includes(key);
}

/** Valida el valor crudo de un parámetro de atribución según su tipo. */
function isValidAttributionValue(key: AttributionKey, value: string): boolean {
  if (isInKeys(CLICK_ID_KEYS, key)) {
    return CLICK_ID_PATTERN.test(value);
  }

  if (isInKeys(AD_ID_KEYS, key)) {
    return AD_ID_PATTERN.test(value);
  }

  if (key === GA_CLIENT_ID_KEY) {
    return GA_CLIENT_ID_PATTERN.test(value);
  }

  return (
    value.length >= 1 &&
    value.length <= UTM_MAX_LENGTH &&
    !CONTROL_CHARS_PATTERN.test(value)
  );
}

/** Lee una cookie por nombre; null si no existe o `document` no está disponible. */
function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  try {
    for (const part of document.cookie.split("; ")) {
      const idx = part.indexOf("=");
      if (idx > 0 && part.slice(0, idx) === name) {
        return part.slice(idx + 1);
      }
    }
  } catch {
    // Cookies bloqueadas: se trata como ausente.
  }

  return null;
}

function writeCookie(value: string, maxAgeSeconds: number): void {
  if (typeof document === "undefined") {
    return;
  }

  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${STORAGE_KEY}=${value}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
  } catch {
    // Cookies bloqueadas: la atribución sigue en localStorage.
  }
}

/** Persiste el registro en localStorage y en cookie (90 días), cada uno de forma tolerante a fallos. */
function persistRecord(record: StoredAttribution): void {
  const serialized = JSON.stringify(record);

  try {
    getSafeLocalStorage()?.setItem(STORAGE_KEY, serialized);
  } catch {
    // localStorage no disponible (modo privado, cuota excedida, etc.) —
    // no romper el flujo de la página por perder la atribución.
  }

  const encoded = encodeURIComponent(serialized);
  if (encoded.length <= COOKIE_MAX_LENGTH) {
    writeCookie(encoded, EXPIRATION_MS / 1000);
  } else {
    // Demasiado grande: se borra la anterior para no dejar una cookie obsoleta.
    writeCookie("", 0);
  }
}

/**
 * Accede a `window.localStorage` de forma defensiva. En Safari con
 * navegación privada (o con cookies/almacenamiento bloqueado), incluso leer
 * la propiedad `localStorage` puede lanzar — no solo llamar a sus métodos.
 */
function getSafeLocalStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Lee `window.location.search` y, si trae al menos un parámetro de
 * atribución válido (gclid/gbraid/wbraid/utm_*, ids de campaña), reemplaza por completo lo
 * que hubiera guardado antes (semántica de "último click"). Si la URL
 * actual no trae ningún parámetro válido, no toca el storage existente —
 * así no se pierde la atribución de un click anterior solo porque el
 * visitante navegó a otra página del sitio.
 */
export function captureAttributionFromUrl(): void {
  if (typeof window === "undefined") {
    return;
  }

  let search: string;
  try {
    search = window.location.search;
  } catch {
    return;
  }

  const searchParams = new URLSearchParams(search);
  const validParams: Partial<Record<AttributionKey, string>> = {};

  for (const key of ATTRIBUTION_KEYS) {
    const raw = searchParams.get(key);
    if (raw !== null && isValidAttributionValue(key, raw)) {
      validParams[key] = raw;
    }
  }

  if (Object.keys(validParams).length === 0) {
    return;
  }

  persistRecord({ capturedAt: Date.now(), params: validParams });
}

/** El consentimiento de analítica solo existe si el visitante pulsó "Aceptar". */
function hasAnalyticsConsent(): boolean {
  try {
    return getSafeLocalStorage()?.getItem(CONSENT_KEY) === CONSENT_ACCEPTED;
  } catch {
    return false;
  }
}

/** Reconstruye el registro solo con claves y valores válidos; null si capturedAt es inválido. */
function sanitizeRecord(value: unknown): StoredAttribution | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const { capturedAt, params } = record;
  if (
    typeof capturedAt !== "number" ||
    !Number.isFinite(capturedAt) ||
    capturedAt > Date.now() + CLOCK_SKEW_MS ||
    typeof params !== "object" ||
    params === null
  ) {
    return null;
  }

  const clean: Partial<Record<AttributionKey, string>> = {};
  for (const key of STORED_KEYS) {
    const raw = (params as Record<string, unknown>)[key];
    if (typeof raw === "string" && isValidAttributionValue(key, raw)) {
      clean[key] = raw;
    }
  }

  return { capturedAt, params: clean };
}

function parseRecord(raw: string | null): StoredAttribution | null {
  if (raw === null) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return sanitizeRecord(parsed);
  } catch {
    return null;
  }
}

/** Lee el registro vigente: primero localStorage, si no hay cae a la cookie y re-hidrata localStorage. */
function readRecord(): StoredAttribution | null {
  const storage = getSafeLocalStorage();

  let fromStorage: StoredAttribution | null = null;
  let storageRaw: string | null = null;
  try {
    storageRaw = storage?.getItem(STORAGE_KEY) ?? null;
    fromStorage = parseRecord(storageRaw);
  } catch {
    // getItem lanzó: se intenta con la cookie.
  }

  const cookieRaw = readCookie(STORAGE_KEY);
  let record = fromStorage;
  if (!record && cookieRaw !== null) {
    try {
      record = parseRecord(decodeURIComponent(cookieRaw));
    } catch {
      record = null;
    }
    if (record) {
      try {
        storage?.setItem(STORAGE_KEY, JSON.stringify(record));
      } catch {
        // Sin localStorage: se sirve igual desde la cookie.
      }
    }
  }

  const expired = record !== null && Date.now() - record.capturedAt > EXPIRATION_MS;
  const discarded = record === null && (storageRaw !== null || cookieRaw !== null);
  if (expired || discarded) {
    try {
      storage?.removeItem(STORAGE_KEY);
    } catch {
      // Si no se puede limpiar el dato vencido, igual lo tratamos como ausente.
    }
    writeCookie("", 0);
    return null;
  }

  return record;
}

/**
 * Lee la cookie `_ga` de GA4 y fusiona el client_id (`gclientid`) en el
 * registro vigente. Se llama de nuevo antes de armar el iframe porque la
 * cookie puede crearse después del primer page-load.
 */
export function captureGaClientId(): void {
  if (!hasAnalyticsConsent()) {
    return;
  }

  const match = GA_COOKIE_PATTERN.exec(readCookie("_ga") ?? "");
  if (!match) {
    return;
  }

  const record = readRecord() ?? { capturedAt: Date.now(), params: {} };
  if (record.params.gclientid === match[1]) {
    return;
  }

  persistRecord({
    capturedAt: record.capturedAt,
    params: { ...record.params, gclientid: match[1] },
  });
}

/**
 * Devuelve la atribución vigente guardada por `captureAttributionFromUrl`
 * (localStorage, con cookie como respaldo). Si no hay nada, el dato está
 * corrupto o pasaron más de 90 días, devuelve un `URLSearchParams` vacío.
 * Cada valor se revalida al leer; los inválidos se descartan.
 */
export function getAttributionParams(): URLSearchParams {
  const result = new URLSearchParams();
  const record = readRecord();
  if (!record) {
    return result;
  }

  const analytics = hasAnalyticsConsent();
  for (const key of STORED_KEYS) {
    if (key === GA_CLIENT_ID_KEY && !analytics) {
      continue;
    }
    const value = record.params[key];
    if (typeof value === "string" && isValidAttributionValue(key, value)) {
      result.set(key, value);
    }
  }

  return result;
}
