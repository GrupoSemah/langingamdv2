// Resolución de la intención con la que se abrió el modal de cotización
// (`amd:open-modal`). El mismo modal ahora se reusa para botones de WhatsApp:
// según `detail.mode`, el postMessage 'amd-lead-submitted' navega a la página
// de gracias (comportamiento original) o a wa.me (nuevo).
//
// Funciones puras, sin dependencias del DOM, para poder testear el contrato
// del evento de forma aislada.

export interface ModalIntent {
  mode: 'quote' | 'whatsapp';
  whatsappUrl?: string;
}

/**
 * Verifica que `url` sea una URL de WhatsApp válida y segura (HTTPS +
 * hostname wa.me o api.whatsapp.com). Defensa anti-open-redirect: el valor
 * llega desde `CustomEvent.detail`, disparado por otro script del sitio, y
 * nunca debe usarse para navegar a un destino arbitrario.
 */
export function isValidWhatsAppUrl(url: string): boolean {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  return (
    parsed.protocol === 'https:' &&
    (parsed.hostname === 'wa.me' || parsed.hostname === 'api.whatsapp.com')
  );
}

/**
 * Resuelve la intención de apertura del modal a partir de `event.detail`.
 * No confía en la forma de `detail` (puede venir de cualquier script que
 * dispare el evento) — cualquier valor faltante, con forma inválida, o con
 * `mode: 'whatsapp'` pero sin una `whatsappUrl` válida, degrada siempre a
 * `{ mode: 'quote' }` (comportamiento retrocompatible: conversión + redirect
 * a /gracias-cotizacion). Nunca se deja pasar un intent de whatsapp roto.
 */
export function resolveIntent(detail: unknown): ModalIntent {
  if (typeof detail !== 'object' || detail === null) {
    return { mode: 'quote' };
  }

  const record = detail as Record<string, unknown>;

  if (record.mode !== 'whatsapp') {
    return { mode: 'quote' };
  }

  const whatsappUrl = record.whatsappUrl;
  if (typeof whatsappUrl !== 'string' || !isValidWhatsAppUrl(whatsappUrl)) {
    return { mode: 'quote' };
  }

  return { mode: 'whatsapp', whatsappUrl };
}
