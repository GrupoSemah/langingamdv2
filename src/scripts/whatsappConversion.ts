// Lógica compartida de disparo de conversión de Google Ads para los CTAs de WhatsApp
// (botón flotante global y CTA de la sección de cotización). Un único punto de verdad
// evita que el patrón de validación/disparo se duplique y diverja entre componentes.

/**
 * Formato esperado de la etiqueta de conversión de Google Ads: "AW-XXXXXXXXX/XXXXXXXXXXX".
 * Se valida antes de disparar el evento para no enviar datos malformados a gtag.
 */
const CONVERSION_LABEL_PATTERN = /^AW-\d+\/[\w-]+$/;

interface GtagWindow extends Window {
	gtag?: (...args: unknown[]) => void;
}

/**
 * Dispara el evento de conversión de Google Ads si la etiqueta es válida y gtag está disponible.
 * Nunca lanza ni bloquea la navegación — si algo falla o falta configuración, simplemente no dispara.
 */
export function fireWhatsAppConversion(rawLabel: string | undefined | null): void {
	const label = rawLabel?.trim() ?? '';

	if (!label || !CONVERSION_LABEL_PATTERN.test(label)) {
		// Sin etiqueta configurada aún, o con formato inválido: no se dispara nada.
		return;
	}

	const win = window as GtagWindow;

	if (typeof win.gtag === 'function') {
		win.gtag('event', 'conversion', { send_to: label });
	}
}

/**
 * Registra el listener de conversión en un enlace/botón de WhatsApp (data-conversion-label).
 * Idempotente vía dataset flag: evita doble registro si el nodo persiste entre navegaciones
 * de Astro View Transitions y este binder se vuelve a invocar en 'astro:page-load'.
 */
export function bindWhatsAppConversion(element: HTMLElement | null): void {
	if (!element || element.dataset.conversionBound === 'true') {
		return;
	}

	element.dataset.conversionBound = 'true';

	element.addEventListener('click', () => {
		fireWhatsAppConversion(element.dataset.conversionLabel);
		// Sin preventDefault: el navegador siempre continúa hacia WhatsApp (target="_blank").
	});
}
