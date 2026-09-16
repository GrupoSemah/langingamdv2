// Puente de eventos entre los triggers de WhatsApp (botón flotante, CTA de cotización) y el
// modal de captura de teléfono (WhatsAppPhoneModal.tsx). Único punto de verdad del nombre del
// evento y del shape del detail, para que ningún componente lo declare por su cuenta y diverja.

export type WhatsAppLeadSource = 'float_button' | 'quote_cta';

export const WHATSAPP_MODAL_OPEN_EVENT = 'amd:open-whatsapp-modal';

export interface WhatsAppModalOpenDetail {
	whatsappUrl: string;
	source: WhatsAppLeadSource;
}

export interface OpenWhatsAppModalParams {
	whatsappUrl: string;
	source: WhatsAppLeadSource;
}

/**
 * Notifica al modal de captura de teléfono vía CustomEvent para que se abra. NO abre ninguna
 * ventana/pestaña acá — eso quedaría prematuro (el usuario todavía no completó el teléfono) y
 * generaba una pestaña en blanco confusa. La navegación real a WhatsApp ocurre recién en el
 * click del botón "Continuar a WhatsApp" dentro del modal (ver WhatsAppPhoneModal.tsx), que es
 * en sí mismo un gesto de usuario genuino y por lo tanto no dispara el bloqueador de pop-ups
 * aunque llame a `window.open` antes de su propio `await`.
 */
export function openWhatsAppModal({ whatsappUrl, source }: OpenWhatsAppModalParams): void {
	const detail: WhatsAppModalOpenDetail = { whatsappUrl, source };
	document.dispatchEvent(new CustomEvent<WhatsAppModalOpenDetail>(WHATSAPP_MODAL_OPEN_EVENT, { detail }));
}
