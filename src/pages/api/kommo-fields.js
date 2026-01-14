import axios from 'axios';
import https from 'https';

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

    // Obtener custom fields de leads
    const leadsFieldsResponse = await axios.get(
      `https://${kommoSubdomain}.kommo.com/api/v4/leads/custom_fields`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        httpsAgent,
        timeout: 15000
      }
    );

    // Obtener custom fields de contactos
    const contactsFieldsResponse = await axios.get(
      `https://${kommoSubdomain}.kommo.com/api/v4/contacts/custom_fields`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        httpsAgent,
        timeout: 15000
      }
    );

    // Obtener pipelines y statuses
    const pipelinesResponse = await axios.get(
      `https://${kommoSubdomain}.kommo.com/api/v4/leads/pipelines`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        httpsAgent,
        timeout: 15000
      }
    );

    return new Response(JSON.stringify({ 
      success: true,
      leadFields: leadsFieldsResponse.data?._embedded?.custom_fields || [],
      contactFields: contactsFieldsResponse.data?._embedded?.custom_fields || [],
      pipelines: pipelinesResponse.data?._embedded?.pipelines || []
    }), { status: 200, headers });

  } catch (error) {
    console.error('Error obteniendo campos de Kommo:', error.message);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      details: error.response?.data || null
    }), { status: 500, headers });
  }
}
