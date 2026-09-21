import https from 'https';
import {
  kommoRequest,
  isCircuitOpen,
  getCircuitRetryAfterMs,
  KommoBlockedError,
  KommoRateLimitError
} from '../../lib/kommo/governor.js';

export const prerender = false;

// Configurar axios para aceptar certificados auto-firmados
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// --- Rate limiting in-memory (por IP, ventana fija) ---
// Mismo patrón que src/pages/api/reporte.js. El bucket del governor protege a
// Kommo (nunca deja pasar más de 3 req/s), pero sin límite propio por IP un
// flood de envíos al formulario puede dejar muchas requests HTTP colgadas hasta
// 30s esperando token del bucket (self-DoS del propio proceso Node, no de Kommo).
// LIMITACIÓN CONOCIDA: este store vive en memoria del proceso, no se comparte
// entre múltiples instancias/workers. Aceptable porque el adapter es
// @astrojs/node (single-instance detrás de nginx).
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // ventana de 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 10; // máx 10 envíos de formulario por IP por minuto
const rateLimitStore = new Map(); // clientIp -> { count, windowStart }

function getClientIp(request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

function isRateLimited(clientIp) {
  const now = Date.now();

  // Limpieza perezosa de entradas expiradas para evitar crecimiento ilimitado del Map
  if (rateLimitStore.size > 500) {
    for (const [ip, entry] of rateLimitStore.entries()) {
      if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitStore.delete(ip);
      }
    }
  }

  const entry = rateLimitStore.get(clientIp);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(clientIp, { count: 1, windowStart: now });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

function getSucursalEnumId(sucursal) {
  const sucursalMap = {
    'VH': 670624,
    'RA': 670626,
    'AL': 670628,
    'SA': 670630,
    'M8': 670632,
    'CL': 670634,
    'CO': 670636,
    'GO': 670636,
    'DA': 670638,
    'CE': 670640,
    'HM': 670642,
    'TM': 670644
  };
  
  return sucursalMap[sucursal] || 670624;
}

export async function POST({ request }) {
  // Asegurar que siempre devolvemos JSON
  const headers = { 'Content-Type': 'application/json' };
  
  // Wrapper de seguridad para capturar errores
  try {
    console.log('=== INICIO API CONTACT AMD ===');
    
    // Validación temprana de request
    if (!request) {
      throw new Error('Request object is undefined');
    }

    // Rate limiting propio por IP, antes de tocar env vars o parsear el body.
    // Ver comentario junto a isRateLimited() más arriba para el motivo.
    const clientIp = getClientIp(request);
    if (isRateLimited(clientIp)) {
      console.warn('Rate limit excedido para IP:', clientIp);
      return new Response(JSON.stringify({
        success: false,
        error: 'Demasiadas solicitudes. Por favor intenta nuevamente en unos minutos.'
      }), {
        status: 429,
        headers
      });
    }

    console.log('Environment:', {
      nodeEnv: import.meta.env.NODE_ENV,
      platform: typeof process !== 'undefined' ? process.platform : 'unknown'
    });
    
    const requiredEnvVars = [
      'KOMMO_SUBDOMAIN',
      'KOMMO_ACCESS_TOKEN',
      'KOMMO_PIPELINE_ID',
      'KOMMO_STATUS_ID',
      'KOMMO_USER_ID',
      'KOMMO_EMAIL_FIELD_ID',
      'KOMMO_PHONE_FIELD_ID',
      'KOMMO_SUCURSAL_FIELD_ID',
      'KOMMO_FUENTE_LEAD_ID',
      'KOMMO_FUENTE_LEAD_ENUM_ID'
    ];

    console.log('Verificando variables de entorno...');
    const envStatus = {};
    requiredEnvVars.forEach(varName => {
      envStatus[varName] = {
        exists: !!import.meta.env[varName],
        length: import.meta.env[varName] ? import.meta.env[varName].length : 0
      };
    });
    console.log('Estado de variables:', envStatus);
    
    const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
    
    if (missingVars.length > 0) {
      // Detalle completo solo en logs del servidor, nunca en la respuesta al cliente
      console.error('Variables de entorno faltantes:', missingVars);
      console.error('Estado detallado de variables:', envStatus);
      return new Response(JSON.stringify({
        success: false,
        error: 'Configuración del servidor incompleta'
      }), {
        status: 500,
        headers
      });
    }

    console.log('Parseando datos del formulario...');
    const formData = await request.json();
    console.log('Datos recibidos:', {
      nombre: formData.nombre ? 'OK' : 'MISSING',
      telefono: formData.telefono ? 'OK' : 'MISSING',
      email: formData.email ? 'OK' : 'MISSING',
      empresa: formData.empresa ? 'OK' : 'OPTIONAL',
      sucursal: formData.sucursal ? 'OK' : 'MISSING'
    });
    
    // Primero crear o buscar el contacto
    const contactData = {
      name: formData.nombre,
      custom_fields_values: [
        {
          field_id: parseInt(import.meta.env.KOMMO_EMAIL_FIELD_ID),
          values: [{ value: formData.email }]
        },
        {
          field_id: parseInt(import.meta.env.KOMMO_PHONE_FIELD_ID),
          values: [{ value: formData.telefono }]
        }
      ]
    };

    // Crear el lead con el contacto vinculado
    const leadData = [{
      name: `Landing Page - ${formData.nombre}${formData.empresa ? ` (${formData.empresa})` : ''}`,
      price: 0,
      status_id: parseInt(import.meta.env.KOMMO_STATUS_ID),
      pipeline_id: parseInt(import.meta.env.KOMMO_PIPELINE_ID),
      responsible_user_id: parseInt(import.meta.env.KOMMO_USER_ID),
      created_by: parseInt(import.meta.env.KOMMO_USER_ID),
      custom_fields_values: [
        {
          field_id: parseInt(import.meta.env.KOMMO_SUCURSAL_FIELD_ID),
          values: [{ enum_id: getSucursalEnumId(formData.sucursal) }]
        },
        {
          field_id: parseInt(import.meta.env.KOMMO_FUENTE_LEAD_ID),
          values: [{ enum_id: parseInt(import.meta.env.KOMMO_FUENTE_LEAD_ENUM_ID) }]
        }
      ],
      _embedded: {
        tags: [{
          name: 'Formulario Web'
        }],
        contacts: [contactData],
        ...(formData.empresa ? {
          companies: [{
            name: formData.empresa
          }]
        } : {})
      }
    }];

    const kommoUrl = `https://${import.meta.env.KOMMO_SUBDOMAIN}.kommo.com/api/v4/leads/complex`;
    console.log('Enviando a Kommo:', {
      url: kommoUrl,
      dataSize: JSON.stringify(leadData).length,
      hasAuth: !!import.meta.env.KOMMO_ACCESS_TOKEN
    });

    // Chequeo temprano del circuit breaker: si Kommo esta bloqueado, no
    // intentamos la request y respondemos de inmediato sin filtrar detalles internos.
    if (isCircuitOpen()) {
      const retryAfterMs = getCircuitRetryAfterMs();
      console.error('Circuit breaker de Kommo abierto, request rechazada sin llegar a Kommo.', {
        retryAfterMs
      });
      return new Response(JSON.stringify({
        success: false,
        error: 'El servicio de Kommo esta temporalmente no disponible. Por favor intenta nuevamente en unos minutos.'
      }), {
        status: 503,
        headers
      });
    }

    const response = await kommoRequest({
      method: 'post',
      url: kommoUrl,
      data: leadData,
      headers: {
        'Authorization': `Bearer ${import.meta.env.KOMMO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      httpsAgent: httpsAgent,
      timeout: 10000
    });

    console.log('Respuesta de Kommo:', {
      status: response.status,
      statusText: response.statusText,
      dataKeys: Object.keys(response.data || {})
    });

    let leadId = null;
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      leadId = response.data[0].id;
    } else if (response.data && response.data._embedded && response.data._embedded.leads) {
      leadId = response.data._embedded.leads[0].id;
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      leadId: leadId,
      message: 'Lead creado exitosamente en Kommo'
    }), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('=== ERROR EN API CONTACT AMD ===');
    console.error('Error completo:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });

    // Errores del governor de Kommo: respuesta clara sin filtrar detalles internos al cliente
    if (error instanceof KommoBlockedError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'El servicio de Kommo esta temporalmente no disponible. Por favor intenta nuevamente en unos minutos.'
      }), {
        status: 503,
        headers
      });
    }

    if (error instanceof KommoRateLimitError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'El servicio esta recibiendo demasiadas solicitudes en este momento. Por favor intenta nuevamente en unos segundos.'
      }), {
        status: 429,
        headers
      });
    }

    // Fallback genérico para cualquier otro error no contemplado arriba (ej. error
    // de DNS, timeout, o una llamada a Kommo que en el futuro no pase por
    // kommoRequest()). NUNCA se expone al cliente error.message ni error.response.data
    // crudos — solo se loguea server-side para diagnóstico.
    console.error('Error no contemplado en las ramas anteriores:', {
      name: error.name,
      code: error.code,
      hasResponse: !!error.response,
      hasRequest: !!error.request
    });

    return new Response(JSON.stringify({
      success: false,
      error: 'Error al enviar el formulario. Por favor intenta nuevamente.',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers
    });
  }
}
