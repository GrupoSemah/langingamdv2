import { defineMiddleware } from 'astro:middleware';

// NOTA: El landing usa multiples integraciones de terceros (Mapbox con web workers
// via blob:, Google Tag Manager, Google Ads, Microsoft Clarity, Pipedrive, reCAPTCHA).
// Imponer un Content-Security-Policy estricto rompe esas integraciones (worker blob,
// scripts.clarity.ms, google.com/ccm, etc.) y un COEP/X-Frame-Options bloquea el iframe
// del formulario. Por eso aqui NO se fuerza CSP/COEP/XFO: solo cabeceras seguras que no
// afectan funcionalidad. Asi el sitio funciona como siempre y el iframe del form carga.
// Un CSP completo y bien probado queda como deuda tecnica a abordar por separado.

// NOTA: se usa async/await en lugar de .then() porque, con .then(), TypeScript
// infiere el retorno como `Promise<void | Response>` (por la sobrecarga generica
// de Promise#then) y eso no es asignable al tipo `MiddlewareHandler` de Astro
// (`Promise<Response> | Response | Promise<void> | void`). Con async/await el
// retorno queda inequivocamente tipado como `Promise<Response>`, sin cambiar
// el comportamiento funcional del middleware.
export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
});
