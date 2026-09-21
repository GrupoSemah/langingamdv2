import https from 'https';
import {
  kommoRequest,
  isCircuitOpen,
  getCircuitRetryAfterMs,
  KommoBlockedError,
  KommoRateLimitError
} from '../../lib/kommo/governor.js';

export const prerender = false;

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

export async function GET({ request }) {
  const headers = { 'Content-Type': 'application/json' };

  try {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');

    if (secret !== import.meta.env.REPORTE_SECRET) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No autorizado'
      }), { status: 401, headers });
    }

    const kommoSubdomain = import.meta.env.KOMMO_SUBDOMAIN;
    const accessToken = import.meta.env.KOMMO_ACCESS_TOKEN;

    // Si el circuit breaker esta abierto (Kommo bloqueado), no se hace ninguna
    // de las 3 llamadas: se corta antes para no empeorar el bloqueo.
    if (isCircuitOpen()) {
      const retryAfterMs = getCircuitRetryAfterMs();
      return new Response(JSON.stringify({
        success: false,
        error: `Kommo esta temporalmente bloqueado. Reintentar en ~${Math.ceil(retryAfterMs / 1000)}s.`
      }), { status: 503, headers });
    }

    const requestHeaders = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    // Las 3 llamadas pueden seguir siendo simultaneas: el governor las pacea
    // internamente con el token bucket de 3 req/s, asi que Promise.all sigue
    // siendo valido y mas simple que serializarlas manualmente aca.
    const [leadsFieldsResponse, contactsFieldsResponse, pipelinesResponse] = await Promise.all([
      // Obtener custom fields de leads
      kommoRequest({
        url: `https://${kommoSubdomain}.kommo.com/api/v4/leads/custom_fields`,
        headers: requestHeaders,
        httpsAgent,
        timeout: 15000
      }),
      // Obtener custom fields de contactos
      kommoRequest({
        url: `https://${kommoSubdomain}.kommo.com/api/v4/contacts/custom_fields`,
        headers: requestHeaders,
        httpsAgent,
        timeout: 15000
      }),
      // Obtener pipelines y statuses
      kommoRequest({
        url: `https://${kommoSubdomain}.kommo.com/api/v4/leads/pipelines`,
        headers: requestHeaders,
        httpsAgent,
        timeout: 15000
      })
    ]);

    return new Response(JSON.stringify({
      success: true,
      leadFields: leadsFieldsResponse.data?._embedded?.custom_fields || [],
      contactFields: contactsFieldsResponse.data?._embedded?.custom_fields || [],
      pipelines: pipelinesResponse.data?._embedded?.pipelines || []
    }), { status: 200, headers });

  } catch (error) {
    // Errores del governor: se mapean a una respuesta clara sin filtrar
    // detalles internos (status HTTP de Kommo, headers, etc.).
    if (error instanceof KommoBlockedError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Kommo esta bloqueado temporalmente. Intenta nuevamente mas tarde.'
      }), { status: 503, headers });
    }

    if (error instanceof KommoRateLimitError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Se alcanzo el limite de solicitudes a Kommo. Intenta nuevamente en unos segundos.'
      }), { status: 429, headers });
    }

    // Error no contemplado por el governor (KommoBlockedError/KommoRateLimitError):
    // se loguea completo server-side, pero nunca se expone message/data crudos al
    // cliente. Rama defensiva: hoy es inalcanzable porque toda llamada a Kommo pasa
    // por kommoRequest(), que siempre envuelve el error antes de propagarlo.
    console.error('Error obteniendo campos de Kommo:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error al obtener los campos de Kommo. Por favor intenta nuevamente.'
    }), { status: 500, headers });
  }
}
