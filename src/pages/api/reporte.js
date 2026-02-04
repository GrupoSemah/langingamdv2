import axios from 'axios';
import https from 'https';
import * as XLSX from 'xlsx';

export const prerender = false;

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

function getCustomFieldValue(customFields, fieldId) {
  if (!customFields || !fieldId) return '';
  const field = customFields.find(f => f.field_id === fieldId);
  if (!field || !field.values || !field.values[0]) return '';
  const value = field.values[0];
  let result = '';
  if (value.enum_id && value.value) {
    result = value.value;
  } else {
    result = value.value || '';
  }
  // Transformar valores "none" o similares a "Desconocido"
  if (typeof result === 'string' && (result.toLowerCase() === 'none' || result.toLowerCase() === 'ninguno' || result.toLowerCase() === 'razon no definida')) {
    return 'Desconocido';
  }
  return result;
}

function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

async function fetchAllLeads(kommoSubdomain, accessToken, fromTimestamp, toTimestamp) {
  let allLeads = [];
  let page = 1;
  const limit = 250;
  let hasMore = true;

  while (hasMore) {
    const params = { 
      page, 
      limit, 
      with: 'contacts',
      'filter[created_at][from]': fromTimestamp,
      'filter[created_at][to]': toTimestamp
    };
    
    const response = await axios.get(
      `https://${kommoSubdomain}.kommo.com/api/v4/leads`,
      {
        params,
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        httpsAgent,
        timeout: 30000
      }
    );
    const leads = response.data?._embedded?.leads || [];
    allLeads = allLeads.concat(leads);
    hasMore = leads.length === limit;
    if (hasMore) {
      page++;
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  return allLeads;
}

async function fetchContactDetails(kommoSubdomain, accessToken, contactId) {
  try {
    const response = await axios.get(
      `https://${kommoSubdomain}.kommo.com/api/v4/contacts/${contactId}`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        httpsAgent,
        timeout: 10000
      }
    );
    return response.data;
  } catch {
    return null;
  }
}

async function fetchNextTaskForLead(kommoSubdomain, accessToken, leadId) {
  try {
    const response = await axios.get(
      `https://${kommoSubdomain}.kommo.com/api/v4/tasks`,
      {
        params: {
          'filter[entity_id]': leadId,
          'filter[entity_type]': 'leads',
          'filter[is_completed]': 0,
          'order[complete_till]': 'asc',
          'limit': 1
        },
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        httpsAgent,
        timeout: 10000
      }
    );
    const tasks = response.data?._embedded?.tasks || [];
    if (tasks.length > 0) {
      return tasks[0].complete_till;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchCustomFields(kommoSubdomain, accessToken) {
  const [leadsRes, contactsRes, pipelinesRes, lossReasonsRes] = await Promise.all([
    axios.get(`https://${kommoSubdomain}.kommo.com/api/v4/leads/custom_fields`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }, httpsAgent, timeout: 15000
    }),
    axios.get(`https://${kommoSubdomain}.kommo.com/api/v4/contacts/custom_fields`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }, httpsAgent, timeout: 15000
    }),
    axios.get(`https://${kommoSubdomain}.kommo.com/api/v4/leads/pipelines`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }, httpsAgent, timeout: 15000
    }),
    axios.get(`https://${kommoSubdomain}.kommo.com/api/v4/leads/loss_reasons`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }, httpsAgent, timeout: 15000
    }).catch(() => ({ data: { _embedded: { loss_reasons: [] } } }))
  ]);

  return {
    leadFields: leadsRes.data?._embedded?.custom_fields || [],
    contactFields: contactsRes.data?._embedded?.custom_fields || [],
    pipelines: pipelinesRes.data?._embedded?.pipelines || [],
    lossReasons: lossReasonsRes.data?._embedded?.loss_reasons || []
  };
}

// IDs de campos custom de Kommo (obtenidos de /api/kommo-fields)
const LEAD_FIELDS = {
  FECHA_HORA_CONTACTO_INBOUND: 799852,
  CANAL_COMERCIAL: 799854,
  CANAL_DEL_LEAD: 799856,
  MENSAJE_INICIAL: 799858,
  APLICA_LEAD: 799860,
  TIENE_EXPERIENCIA: 799862,
  QUE_VA_A_GUARDAR: 799864,
  MOTIVACION: 799866,
  INTENCION_COMPRA: 799868,
  SUCURSAL_ELEGIDA_CLIENTE: 799870,
  SUCURSAL_OFRECIDA: 802710,
  ESTADO_DEL_LEAD: 799882,
  VISITO: 799884,
  NECESITAS: 799888,
  QUE_HARA_CON_BIENES: 801235,
  NOMBRE_COMPLETO: 801237
};

// Status IDs del pipeline
const STATUS = {
  GANADO: 142,
  PERDIDO: 143
};

function getStatusName(pipelines, statusId) {
  for (const pipeline of pipelines) {
    const status = pipeline._embedded?.statuses?.find(s => s.id === statusId);
    if (status) return status.name;
  }
  return '';
}

function getLossReasonName(lossReasons, lossReasonId) {
  if (!lossReasonId) return 'Desconocido';
  const reason = lossReasons.find(r => r.id === lossReasonId);
  const name = reason?.name || '';
  if (!name || name.toLowerCase() === 'none' || name.toLowerCase() === 'razon no definida') {
    return 'Desconocido';
  }
  return name;
}

export async function GET({ request }) {
  const headers = { 'Content-Type': 'application/json' };

  try {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');

    if (secret !== import.meta.env.REPORTE_SECRET) {
      return new Response(JSON.stringify({ success: false, error: 'No autorizado' }), { status: 401, headers });
    }

    const kommoSubdomain = import.meta.env.KOMMO_SUBDOMAIN;
    const accessToken = import.meta.env.KOMMO_ACCESS_TOKEN;

    // Obtener parámetros de fecha
    const fromDate = url.searchParams.get('from');
    const toDate = url.searchParams.get('to');
    
    if (!fromDate || !toDate) {
      return new Response(JSON.stringify({ success: false, error: 'Parámetros de fecha requeridos (from, to)' }), { status: 400, headers });
    }
    
    // Convertir fechas a timestamps Unix (inicio del día from, fin del día to)
    const fromTimestamp = Math.floor(new Date(fromDate + 'T00:00:00').getTime() / 1000);
    const toTimestamp = Math.floor(new Date(toDate + 'T23:59:59').getTime() / 1000);
    
    console.log(`Filtro de fechas: ${fromDate} (${fromTimestamp}) - ${toDate} (${toTimestamp})`);

    console.log('Obteniendo pipelines y loss reasons...');
    const { pipelines, lossReasons } = await fetchCustomFields(kommoSubdomain, accessToken);
    console.log('Loss reasons encontradas:', lossReasons.length);

    console.log('Obteniendo leads en el rango de fechas...');
    const leads = await fetchAllLeads(kommoSubdomain, accessToken, fromTimestamp, toTimestamp);
    console.log(`Total leads: ${leads.length}`);

    // Ordenar leads por fecha de creación (ascendente)
    leads.sort((a, b) => a.created_at - b.created_at);
    console.log('Leads ordenados por fecha de creación (ascendente)');

    const rows = [];

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      let contactName = '';
      let contactPhone = '';
      let contactEmail = '';

      const mainContact = lead._embedded?.contacts?.[0];
      if (mainContact) {
        const contactDetails = await fetchContactDetails(kommoSubdomain, accessToken, mainContact.id);
        if (contactDetails) {
          contactName = contactDetails.name || '';
          const phoneField = contactDetails.custom_fields_values?.find(f => f.field_code === 'PHONE');
          const emailField = contactDetails.custom_fields_values?.find(f => f.field_code === 'EMAIL');
          contactPhone = phoneField?.values?.[0]?.value || '';
          contactEmail = emailField?.values?.[0]?.value || '';
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const nextTaskDate = await fetchNextTaskForLead(kommoSubdomain, accessToken, lead.id);
      await new Promise(resolve => setTimeout(resolve, 100));

      const cf = lead.custom_fields_values || [];
      const statusName = getStatusName(pipelines, lead.status_id);
      const fechaHoraInbound = getCustomFieldValue(cf, LEAD_FIELDS.FECHA_HORA_CONTACTO_INBOUND);
      
      // Determinar estado final basado en status_id
      let estadoFinal = '';
      if (lead.status_id === STATUS.GANADO) estadoFinal = 'Ganado';
      else if (lead.status_id === STATUS.PERDIDO) estadoFinal = 'Perdido';

      rows.push({
        'Fecha y hora de contacto': formatTimestamp(lead.created_at),
        'Medio que uso el lead para encontrarnos': getCustomFieldValue(cf, LEAD_FIELDS.CANAL_COMERCIAL),
        'Canal que uso el lead para contactarnos': getCustomFieldValue(cf, LEAD_FIELDS.CANAL_DEL_LEAD),
        'Qué buscaba?': getCustomFieldValue(cf, LEAD_FIELDS.NECESITAS),
        'Nombre del contacto inbound': getCustomFieldValue(cf, LEAD_FIELDS.NOMBRE_COMPLETO) || contactName,
        'Información de contacto del lead inbound': contactPhone,
        'Correo': contactEmail,
        'Mensaje del contacto inbound': getCustomFieldValue(cf, LEAD_FIELDS.MENSAJE_INICIAL),
        'Lead aplica como lead o no?': getCustomFieldValue(cf, LEAD_FIELDS.APLICA_LEAD),
        'Fecha de la 1era atención (en call center)': fechaHoraInbound ? formatDate(fechaHoraInbound) : '',
        'Hora de la 1era atención (en call center)': fechaHoraInbound ? formatTime(fechaHoraInbound) : '',
        'Tiene experiencia con el servicio?': getCustomFieldValue(cf, LEAD_FIELDS.TIENE_EXPERIENCIA),
        'Qué va a guardar?': getCustomFieldValue(cf, LEAD_FIELDS.QUE_VA_A_GUARDAR),
        'Por qué el lead necesita guardar esas cosas en un depósito?': getCustomFieldValue(cf, LEAD_FIELDS.MOTIVACION),
        'Intención de Compra': getCustomFieldValue(cf, LEAD_FIELDS.INTENCION_COMPRA),
        'Sucursal Ofrecida': getCustomFieldValue(cf, LEAD_FIELDS.SUCURSAL_OFRECIDA),
        'Sucursal Elegida por Cliente': getCustomFieldValue(cf, LEAD_FIELDS.SUCURSAL_ELEGIDA_CLIENTE),
        'Nombre con el que el lead inbound fue registrado en site link': getCustomFieldValue(cf, LEAD_FIELDS.NOMBRE_COMPLETO) || contactName,
        'Estatus del lead': getCustomFieldValue(cf, LEAD_FIELDS.ESTADO_DEL_LEAD) || statusName,
        '¿Qué hará con sus bienes?': getCustomFieldValue(cf, LEAD_FIELDS.QUE_HARA_CON_BIENES),
        'Motivo de la pérdida': getLossReasonName(lossReasons, lead.loss_reason_id),
        'Visitó?': getCustomFieldValue(cf, LEAD_FIELDS.VISITO),
        'Estado final': estadoFinal,
        'Fecha de seguimiento': nextTaskDate ? formatTimestamp(nextTaskDate) : ''
      });

      if ((i + 1) % 50 === 0) console.log(`Procesados ${i + 1}/${leads.length} leads`);
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const today = new Date().toISOString().split('T')[0];
    const filename = `Reporte Kommo ${today}.xlsx`;

    return new Response(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Error generando reporte:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }), { status: 500, headers });
  }
}
