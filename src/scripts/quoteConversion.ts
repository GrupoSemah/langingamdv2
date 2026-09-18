// Lógica compartida de conversión de Google Ads para el flujo de cotización ("DU- Contacto Form").
//
// Camino principal: CotizacionModal.astro dispara la conversión en el postMessage
// 'amd-lead-submitted' que emite el iframe del form (Kommo) al enviarse con éxito. Ese es el
// disparo real de "envío exitoso" y no depende de document.referrer (que Layout.astro restringe
// con Referrer-Policy: strict-origin-when-cross-origin, por lo que nunca llega el hostname propio
// a la página de gracias).
//
// Red de seguridad: las páginas de gracias (gracias-cotizacion.astro / en/thank-you-quote.astro)
// disparan la MISMA conversión solo si el modal no la disparó recientemente, para cubrir cualquier
// otro camino legítimo hacia esas rutas sin duplicar el conteo.
//
// Deduplicación: sessionStorage guarda un timestamp cuando el modal dispara. La página de gracias
// lo consume (lee y borra) al cargar; si la marca existe y está dentro de la ventana, no vuelve a
// disparar.

const CONVERSION_SEND_TO = 'AW-976110472/cotizacion_completada';
const DEDUPE_STORAGE_KEY = 'amd_conv_fired';
const DEDUPE_WINDOW_MS = 60_000;

interface GtagWindow extends Window {
	gtag?: (...args: unknown[]) => void;
}

/**
 * Dispara el evento de conversión y espera su confirmación antes de invocar `onDone`.
 * Patrón oficial de Google Ads (medir y luego navegar): usa `event_callback` para saber
 * cuándo el beacon salió, con un `setTimeout` de red de seguridad por si el callback nunca
 * llega (ad-blockers, gtag lento, etc.). Nunca lanza — un gtag roto/stubbeado no debe
 * bloquear el flujo (cierre de modal + redirección) que depende de `onDone`.
 */
function fireConversion(onDone: () => void): void {
	const win = window as GtagWindow;
	let done = false;

	// `viaTimeout` distingue si `finish` se resolvió por el `event_callback` real de gtag
	// o por el timeout de red de seguridad. El snippet inline de gtag (Layout.astro) define
	// `window.gtag` de forma síncrona sin importar si el script externo gtag/js cargó — un
	// ad-blocker típico deja `gtag` como función válida (solo hace `dataLayer.push`), por lo
	// que la llamada NUNCA lanza excepción y el `event_callback` simplemente no llega nunca.
	// Sin este log, ese caso (el más común en producción) queda invisible.
	const finish = (viaTimeout: boolean): void => {
		if (done) return;
		done = true;
		if (viaTimeout) {
			try {
				console.error(
					'[quoteConversion] event_callback de gtag no respondió dentro de 1s (posible ad-blocker o gtag.js bloqueado) — se continúa el flujo igual'
				);
			} catch {
				// un console.error roto (webview parcheado) no debe bloquear el redirect
			}
		}
		onDone();
	};

	try {
		if (typeof win.gtag === 'function') {
			win.gtag('event', 'conversion', {
				send_to: CONVERSION_SEND_TO,
				event_callback: () => finish(false),
			});
			setTimeout(() => finish(true), 1000);
			return;
		}
		console.error('[quoteConversion] window.gtag no está disponible — conversión no reportada a Google Ads');
	} catch (err) {
		console.error('[quoteConversion] gtag lanzó una excepción', err);
	}

	finish(false);
}

function markFiredForDedupe(): void {
	try {
		sessionStorage.setItem(DEDUPE_STORAGE_KEY, String(Date.now()));
	} catch {
		// sessionStorage no disponible (modo privado, cookies bloqueadas, etc.) — no bloquea el disparo.
	}
}

/**
 * Consume la marca de dedupe: la lee y la borra en la misma operación para que no quede
 * arrastrada entre visitas. Devuelve true si el modal disparó la conversión dentro de la ventana.
 */
function consumeRecentDedupeMark(): boolean {
	try {
		const rawTimestamp = sessionStorage.getItem(DEDUPE_STORAGE_KEY);
		sessionStorage.removeItem(DEDUPE_STORAGE_KEY);

		if (!rawTimestamp) return false;

		const firedAt = Number(rawTimestamp);
		return !Number.isNaN(firedAt) && Date.now() - firedAt < DEDUPE_WINDOW_MS;
	} catch {
		// Sin sessionStorage no hay forma de saber si el modal ya disparó — se asume que no.
		return false;
	}
}

/**
 * Camino principal: se llama desde CotizacionModal.astro al recibir el postMessage
 * 'amd-lead-submitted'. Marca el dedupe de inmediato (el envío ya fue confirmado por el
 * form) y solo invoca `onDone` (cierre de modal + redirección) cuando el beacon de
 * conversión salió o venció el timeout de red de seguridad — así la navegación no cancela
 * el pixel.
 */
export function fireQuoteConversionFromModal(onDone: () => void): void {
	markFiredForDedupe();
	fireConversion(onDone);
}

/**
 * Red de seguridad: se llama desde las páginas de gracias. Dispara la conversión solo si
 * el modal no la disparó ya en los últimos DEDUPE_WINDOW_MS. No redirige, así que no
 * necesita esperar la confirmación del beacon de forma síncrona con nada más.
 */
export function fireQuoteConversionFallback(): void {
	if (consumeRecentDedupeMark()) {
		if (import.meta.env.DEV) {
			console.log('Conversión omitida en página de gracias — ya disparada por el modal');
		}
		return;
	}

	fireConversion(() => {
		if (import.meta.env.DEV) {
			console.log('Conversión registrada en página de gracias — acceso sin paso previo por el modal');
		}
	});
}
