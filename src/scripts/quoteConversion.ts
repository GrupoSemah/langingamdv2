// Lógica compartida de conversión de Google Ads para el flujo de cotización, vía GTM.
//
// Camino único: CotizacionModal.astro llama a `fireLeadSubmittedConversion` al recibir
// el postMessage 'amd-lead-submitted' que emite el iframe del form (Kommo) al enviarse
// con éxito. Esa llamada empuja un evento custom al `dataLayer`; GTM escucha ese evento
// con un disparador de "Evento personalizado" y es GTM (no este código) quien dispara la
// conversión real de Google Ads con la etiqueta configurada ahí — así el administrador de
// Ads controla la etiqueta sin necesidad de un deploy de este repo.
//
// Ya no existe una red de seguridad en las páginas de gracias: el disparador de GTM para
// este flujo deja de ser "Vista de una página" y pasa a ser este evento custom, así que un
// fallback ahí duplicaría conversiones sin aportar nada.
//
// Deduplicación: en vez de una ventana de tiempo, se dedupea por `leadId` — sessionStorage
// guarda los últimos IDs ya enviados. Esto cubre el caso real de que el iframe reintente el
// postMessage (ej. el usuario no ve el cambio de página al instante y el form reintenta):
// un mismo leadId nunca vuelve a empujar el evento al dataLayer.

export type QuoteConversionMode = 'quote' | 'whatsapp';

interface DataLayerWindow extends Window {
  dataLayer?: unknown[];
}

const DEDUPE_STORAGE_KEY = 'amd_lead_ids_fired';
const DEDUPE_MAX_ENTRIES = 20;

/** Tiempo que se le pide a GTM esperar antes de considerar el tag disparado (lado GTM). */
export const EVENT_CALLBACK_TIMEOUT_MS = 2000;

/**
 * Red de seguridad del lado de este script: si `eventCallback` nunca llega (ad-blocker,
 * GTM no cargó, contenedor mal configurado), la navegación no puede quedar bloqueada
 * esperando para siempre. Se da un margen sobre `EVENT_CALLBACK_TIMEOUT_MS` para no pisar
 * al propio timeout de GTM en el camino feliz.
 */
export const NETWORK_SAFETY_TIMEOUT_MS = 2500;

/**
 * Lee la lista de leadId ya enviados desde sessionStorage. Devuelve [] ante cualquier
 * problema (modo privado, JSON corrupto, sessionStorage no disponible) — un fallo de
 * storage nunca debe bloquear el flujo de conversión.
 */
function readFiredLeadIds(): number[] {
  try {
    const raw = sessionStorage.getItem(DEDUPE_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((id): id is number => typeof id === 'number');
  } catch {
    return [];
  }
}

/** Guarda `leadId` en la lista de dedupe, conservando solo los últimos DEDUPE_MAX_ENTRIES. */
function markLeadIdAsFired(leadId: number): void {
  try {
    const ids = readFiredLeadIds();
    ids.push(leadId);
    const trimmed = ids.slice(-DEDUPE_MAX_ENTRIES);
    sessionStorage.setItem(DEDUPE_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Sin sessionStorage no hay dedupe posible — no bloquea el disparo del evento.
  }
}

/**
 * Empuja el evento `amd_lead_submitted` al dataLayer. `lead_id` va como string (convención
 * habitual de GTM/GA4 para IDs) y se omite por completo cuando no hay leadId disponible, en
 * vez de mandar `null`, para no ensuciar variables de GTM con un valor sin sentido.
 *
 * `onDone` se invoca una sola vez: cuando `eventCallback` confirma que GTM procesó el
 * evento, o cuando vence `NETWORK_SAFETY_TIMEOUT_MS` — lo que ocurra primero.
 */
function pushLeadSubmittedEvent(leadId: number | null, mode: QuoteConversionMode, onDone: () => void): void {
  const win = window as DataLayerWindow;
  win.dataLayer = win.dataLayer ?? [];

  let done = false;
  const finish = (): void => {
    if (done) return;
    done = true;
    onDone();
  };

  win.dataLayer.push({
    event: 'amd_lead_submitted',
    lead_id: leadId !== null ? String(leadId) : undefined,
    lead_mode: mode,
    eventCallback: finish,
    eventTimeout: EVENT_CALLBACK_TIMEOUT_MS,
  });

  setTimeout(finish, NETWORK_SAFETY_TIMEOUT_MS);
}

/**
 * Punto de entrada desde CotizacionModal.astro al recibir el postMessage
 * 'amd-lead-submitted' confirmado. Dedupe por `leadId`: si ese lead ya disparó el evento
 * (reintento del iframe), no se vuelve a empujar al dataLayer pero igual se llama a
 * `onDone` para no bloquear la navegación. Sin `leadId` (iframe viejo cacheado que todavía
 * no manda el campo) no hay identidad para dedupear — se deja pasar el push igual: es
 * preferible arriesgarse a contar de más en ese caso raro que perder la conversión.
 */
export function fireLeadSubmittedConversion(
  leadId: number | null,
  mode: QuoteConversionMode,
  onDone: () => void
): void {
  if (leadId !== null && readFiredLeadIds().includes(leadId)) {
    onDone();
    return;
  }

  if (leadId !== null) {
    markLeadIdAsFired(leadId);
  }

  pushLeadSubmittedEvent(leadId, mode, onDone);
}
