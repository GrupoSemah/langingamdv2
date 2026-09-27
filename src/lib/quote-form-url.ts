// Construcción pura de la URL del iframe del form de cotización.
//
// Se extrae de CotizacionModal.astro (en vez de dejarla inline en el script
// del componente) para poder testearla sin DOM, siguiendo el mismo patrón que
// whatsapp-intent.ts: lógica pura y testeable separada del glue code que la
// conecta al DOM real.

export interface BuildQuoteFormUrlParams {
  /** URL base del form standalone (PUBLIC_FORM_URL). */
  formUrl: string;
  lang: string;
  mode: 'quote' | 'whatsapp';
  /** Parámetros de atribución (utm_*, gclid, etc.) ya resueltos por attribution.ts. */
  attributionParams: URLSearchParams;
}

/**
 * Construye la URL final del iframe agregando `lang`, `mode` y todos los
 * parámetros de atribución sobre `formUrl`. Lanza si `formUrl` no es una URL
 * válida — el caller (CotizacionModal.astro) ya maneja ese caso con un
 * try/catch para no cargar el iframe con una URL rota.
 */
export function buildQuoteFormUrl({ formUrl, lang, mode, attributionParams }: BuildQuoteFormUrlParams): string {
  const url = new URL(formUrl);
  url.searchParams.set('lang', lang);
  url.searchParams.set('mode', mode);

  for (const [key, value] of attributionParams) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}
