import { defineMiddleware } from 'astro:middleware';

// NOTA: El landing usa multiples integraciones de terceros (Mapbox con web workers
// via blob:, Google Tag Manager, Google Ads, Microsoft Clarity, Pipedrive, reCAPTCHA).
// Imponer un Content-Security-Policy estricto rompe esas integraciones (worker blob,
// scripts.clarity.ms, google.com/ccm, etc.) y un COEP/X-Frame-Options bloquea el iframe
// del formulario. Por eso aqui NO se fuerza CSP/COEP/XFO: solo cabeceras seguras que no
// afectan funcionalidad. Asi el sitio funciona como siempre y el iframe del form carga.
// Un CSP completo y bien probado queda como deuda tecnica a abordar por separado.

export const onRequest = defineMiddleware((_context, next) => {
  return next().then((response) => {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
  });
});
