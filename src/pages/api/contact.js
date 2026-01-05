import axios from 'axios';
import https from 'https';

export const prerender = false;

// Configurar axios para aceptar certificados auto-firmados
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

function getSucursalEnumId(sucursal) {
  const sucursalMap = {
    'VH': 670624,
    'RA': 670626,
    'AL': 670628,
    'SA': 670630,
    'M8': 670632,
    'CO': 670634,
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
      console.error('Variables de entorno faltantes:', missingVars);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Configuración del servidor incompleta',
        missingVars: missingVars,
        envStatus: envStatus
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
    
    const response = await axios.post(
      kommoUrl,
      leadData,
      {
        headers: {
          'Authorization': `Bearer ${import.meta.env.KOMMO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        httpsAgent: httpsAgent,
        timeout: 10000
      }
    );
    
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
    
    let errorMessage = 'Error al enviar el formulario';
    let errorDetails = {
      type: 'unknown',
      message: error.message
    };
    
    if (error.response) {
      console.error('Error de respuesta HTTP:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      errorMessage = `Error ${error.response.status}: ${error.response.statusText}`;
      errorDetails = {
        type: 'http_response',
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      };
    } else if (error.request) {
      console.error('Error de request:', error.request);
      errorMessage = 'Error de conexión con Kommo';
      errorDetails = {
        type: 'network',
        message: 'No se pudo conectar con Kommo'
      };
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Error de DNS - no se pudo resolver el dominio';
      errorDetails = {
        type: 'dns',
        message: error.message
      };
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Timeout - la solicitud tardó demasiado';
      errorDetails = {
        type: 'timeout',
        message: error.message
      };
    }
    
    console.error('Enviando respuesta de error:', { errorMessage, errorDetails });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers
    });
  }
}
