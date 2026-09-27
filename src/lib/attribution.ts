// Captura y recuperación de atribución de Google Ads (gclid/gbraid/wbraid +
// utm_*) desde la URL de entrada del visitante. El objetivo es poder
// conciliar leads de Kommo contra conversiones de Ads: guardamos el último
// click válido en localStorage y otro módulo (fuera de este archivo) lo lee
// para adjuntarlo al modal de cotización cuando se envía el lead.
//
// Funciones puras respecto del entorno externo (solo tocan `window.location`
// y `window.localStorage`), pensadas para poder testearse mockeando ambos.

/** Clave estable bajo la que se persiste la atribución capturada. */
const STORAGE_KEY = 'amd_attribution';

/**
 * Ventana de vigencia de la atribución. 90 días es el tope de ventana de
 * conversión que usamos para conciliar contra Google Ads — pasado ese
 * tiempo, el dato ya no es útil para atribuir un lead a un click.
 */
const EXPIRATION_MS = 90 * 24 * 60 * 60 * 1000;

/** Click IDs que dispara Google Ads (Search/PMax vía gclid, App vía gbraid/wbraid). */
const CLICK_ID_KEYS = ['gclid', 'gbraid', 'wbraid'] as const;

/** Parámetros UTM estándar que acompañan a una campaña. */
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'] as const;

const ATTRIBUTION_KEYS = [...CLICK_ID_KEYS, ...UTM_KEYS] as const;

type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];

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

function isClickIdKey(key: AttributionKey): key is (typeof CLICK_ID_KEYS)[number] {
  return (CLICK_ID_KEYS as readonly string[]).includes(key);
}

/** Valida el valor crudo de un parámetro de atribución según su tipo. */
function isValidAttributionValue(key: AttributionKey, value: string): boolean {
  if (isClickIdKey(key)) {
    return CLICK_ID_PATTERN.test(value);
  }

  return value.length >= 1 && value.length <= UTM_MAX_LENGTH;
}

/**
 * Accede a `window.localStorage` de forma defensiva. En Safari con
 * navegación privada (o con cookies/almacenamiento bloqueado), incluso leer
 * la propiedad `localStorage` puede lanzar — no solo llamar a sus métodos.
 */
function getSafeLocalStorage(): Storage | null {
  if (typeof window === 'undefined') {
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
 * atribución válido (gclid/gbraid/wbraid/utm_*), reemplaza por completo lo
 * que hubiera guardado antes (semántica de "último click"). Si la URL
 * actual no trae ningún parámetro válido, no toca el storage existente —
 * así no se pierde la atribución de un click anterior solo porque el
 * visitante navegó a otra página del sitio.
 */
export function captureAttributionFromUrl(): void {
  if (typeof window === 'undefined') {
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

  const storage = getSafeLocalStorage();
  if (!storage) {
    return;
  }

  const record: StoredAttribution = {
    capturedAt: Date.now(),
    params: validParams,
  };

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // localStorage no disponible (modo privado, cuota excedida, etc.) —
    // no romper el flujo de la página por perder la atribución.
  }
}

function isStoredAttribution(value: unknown): value is StoredAttribution {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.capturedAt === 'number' && typeof record.params === 'object' && record.params !== null;
}

/**
 * Devuelve la atribución vigente guardada por `captureAttributionFromUrl`.
 * Si no hay nada guardado, el dato está corrupto, o pasaron más de 90 días
 * desde la captura, devuelve un `URLSearchParams` vacío (y limpia el dato
 * vencido en el caso de expiración).
 */
export function getAttributionParams(): URLSearchParams {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return new URLSearchParams();
  }

  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return new URLSearchParams();
  }

  if (raw === null) {
    return new URLSearchParams();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new URLSearchParams();
  }

  if (!isStoredAttribution(parsed)) {
    return new URLSearchParams();
  }

  const age = Date.now() - parsed.capturedAt;
  if (age > EXPIRATION_MS) {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      // Si no se puede limpiar el dato vencido, igual lo tratamos como
      // ausente para quien llama.
    }
    return new URLSearchParams();
  }

  const result = new URLSearchParams();
  for (const key of ATTRIBUTION_KEYS) {
    const value = parsed.params[key];
    if (typeof value === 'string') {
      result.set(key, value);
    }
  }

  return result;
}
