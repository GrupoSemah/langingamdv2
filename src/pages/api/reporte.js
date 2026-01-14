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
  if (value.enum_id && value.value) return value.value;
  return value.value || '';
}

function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('es-PA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('es-PA', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' });
}

async function fetchAllLeads(kommoSubdomain, accessToken) {
  let allLeads = [];
  let page = 1;
  const limit = 250;
  let hasMore = true;

  while (hasMore) {
    const response = await axios.get(
      `https://${kommoSubdomain}.kommo.com/api/v4/leads`,
      {
        params: { page, limit, with: 'contacts' },
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

async function fetchCustomFields(kommoSubdomain, accessToken) {
  const [leadsRes, contactsRes, pipelinesRes] = await Promise.all([
    axios.get(`https://${kommoSubdomain}.kommo.com/api/v4/leads/custom_fields`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }, httpsAgent, timeout: 15000
    }),
    axios.get(`https://${kommoSubdomain}.kommo.com/api/v4/contacts/custom_fields`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }, httpsAgent, timeout: 15000
    }),
    axios.get(`https://${kommoSubdomain}.kommo.com/api/v4/leads/pipelines`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }, httpsAgent, timeout: 15000
    })
  ]);

  return {
    leadFields: leadsRes.data?._embedded?.custom_fields || [],
    contactFields: contactsRes.data?._embedded?.custom_fields || [],
    pipelines: pipelinesRes.data?._embedded?.pipelines || []
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
  SUCURSAL_OFRECIDA: 799870,
  ESTADO_DEL_LEAD: 799882,
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

    console.log('Obteniendo pipelines...');
    const { pipelines } = await fetchCustomFields(kommoSubdomain, accessToken);

    console.log('Obteniendo todos los leads...');
    const leads = await fetchAllLeads(kommoSubdomain, accessToken);
    console.log(`Total leads: ${leads.length}`);

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
        'Sucursal ofrecida': getCustomFieldValue(cf, LEAD_FIELDS.SUCURSAL_OFRECIDA),
        'Nombre con el que el lead inbound fue registrado en site link': getCustomFieldValue(cf, LEAD_FIELDS.NOMBRE_COMPLETO) || contactName,
        'Estatus del lead': getCustomFieldValue(cf, LEAD_FIELDS.ESTADO_DEL_LEAD) || statusName,
        'Razones que el lead dio luego de no alquilar': '', // Campo no existe en Kommo
        'Motivo de la pérdida': getCustomFieldValue(cf, LEAD_FIELDS.QUE_HARA_CON_BIENES),
        'Estado final': estadoFinal,
        'Fecha de seguimiento': '' // Campo no existe en Kommo
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
