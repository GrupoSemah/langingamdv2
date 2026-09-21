import ExcelJS from 'exceljs';
import crypto from 'node:crypto';
import { kommoRequest, isCircuitOpen, getCircuitRetryAfterMs, KommoBlockedError, KommoRateLimitError } from '../../lib/kommo/governor.js';

export const prerender = false;

// --- Rate limiting in-memory (por IP, ventana fija) ---
// LIMITACIÓN CONOCIDA: este store vive en memoria del proceso. Si la app corre en
// múltiples instancias/procesos (ej. varios workers de Node o edge functions),
// el límite no se comparte entre ellas. Aceptable aquí porque el adapter es
// @astrojs/node (single-instance detrás de nginx). Si se escala a multi-instancia,
// migrar a un store compartido (ej. Redis/Upstash).
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // ventana de 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 5; // máx 5 solicitudes de reporte por IP por minuto
const rateLimitStore = new Map(); // clientIp -> { count, windowStart }

// --- Single-flight lock: solo UN reporte puede generarse a la vez (memoria del proceso) ---
let reportInProgress = false;

// --- Cache LRU simple de reportes ya generados, por rango de fechas exacto ---
const REPORT_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos
const REPORT_CACHE_MAX_ENTRIES = 3;
/** @type {Map<string, { buffer: ExcelJS.Buffer, filename: string, expiresAt: number }>} */
const reportCache = new Map(); // key `${from}|${to}` -> { buffer, filename, expiresAt }

// --- Deadline global del handler ---
const GLOBAL_DEADLINE_MS = 240 * 1000; // 240s

/**
 * Error interno usado para abortar el handler cuando se supera el deadline global.
 * No se expone tal cual al cliente — se traduce a un mensaje claro en el catch.
 */
class ReportDeadlineExceededError extends Error {
  constructor() {
    super('DEADLINE_EXCEEDED');
    this.name = 'ReportDeadlineExceededError';
  }
}

/**
 * Lanza ReportDeadlineExceededError si ya se superó el deadline global del handler.
 * Se llama entre fases y dentro de loops de paginación largos para poder abortar
 * a mitad de camino en vez de solo al final.
 * @param {number} startedAt - timestamp (ms) de inicio del handler
 * @param {number} deadlineMs - deadline en ms desde startedAt
 */
function assertDeadline(startedAt, deadlineMs) {
  if (Date.now() - startedAt > deadlineMs) {
    throw new ReportDeadlineExceededError();
  }
}

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

// Comparación timing-safe del secreto para evitar ataques de timing.
// Maneja longitudes distintas sin lanzar excepción y sin dar una salida rápida
// que filtre información por timing.
function isValidSecret(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string' || expected.length === 0) {
    return false;
  }
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) {
    // Igual se hace una comparación timing-safe (contra sí mismo) para no
    // devolver antes por longitud y reducir la señal de timing disponible.
    crypto.timingSafeEqual(expectedBuf, expectedBuf);
    return false;
  }
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

/**
 * Busca un reporte cacheado vigente para la clave dada. Aplica TTL y refresca
 * la posición en el Map para semántica LRU (más reciente al final).
 * @param {string} key
 * @returns {{ buffer: ExcelJS.Buffer, filename: string, expiresAt: number } | null}
 */
function getCachedReport(key) {
  const entry = reportCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    reportCache.delete(key);
    return null;
  }
  reportCache.delete(key);
  reportCache.set(key, entry);
  return entry;
}

/**
 * Guarda un reporte en el cache, descartando la entrada más vieja si ya se
 * alcanzó el máximo de entradas (LRU simple basado en orden de inserción del Map).
 * @param {string} key
 * @param {{ buffer: ExcelJS.Buffer, filename: string, expiresAt: number }} entry
 */
function setCachedReport(key, entry) {
  if (reportCache.size >= REPORT_CACHE_MAX_ENTRIES) {
    const oldestKey = reportCache.keys().next().value;
    reportCache.delete(oldestKey);
  }
  reportCache.set(key, entry);
}

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
  // Usar zona horaria de Panamá (UTC-5)
  const options = { timeZone: 'America/Panama' };
  const day = String(date.toLocaleString('en-US', { ...options, day: '2-digit' })).padStart(2, '0');
  const month = String(date.toLocaleString('en-US', { ...options, month: '2-digit' })).padStart(2, '0');
  const year = date.toLocaleString('en-US', { ...options, year: 'numeric' });
  const hours = String(date.toLocaleString('en-US', { ...options, hour: '2-digit', hour12: false })).padStart(2, '0');
  const minutes = String(date.toLocaleString('en-US', { ...options, minute: '2-digit' })).padStart(2, '0');
  const seconds = String(date.toLocaleString('en-US', { ...options, second: '2-digit' })).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  // Usar zona horaria de Panamá (UTC-5)
  const options = { timeZone: 'America/Panama' };
  const day = String(date.toLocaleString('en-US', { ...options, day: '2-digit' })).padStart(2, '0');
  const month = String(date.toLocaleString('en-US', { ...options, month: '2-digit' })).padStart(2, '0');
  const year = date.toLocaleString('en-US', { ...options, year: 'numeric' });
  return `${year}-${month}-${day}`;
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  // Usar zona horaria de Panamá (UTC-5)
  const options = { timeZone: 'America/Panama' };
  const hours = String(date.toLocaleString('en-US', { ...options, hour: '2-digit', hour12: false })).padStart(2, '0');
  const minutes = String(date.toLocaleString('en-US', { ...options, minute: '2-digit' })).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Trae todos los leads del rango de fechas, paginando de a 250. El pacing entre
 * páginas (rate limit, reintentos, circuit breaker) lo maneja `kommoRequest`
 * internamente — no se agregan sleeps manuales acá.
 * @param {string} kommoSubdomain
 * @param {string} accessToken
 * @param {number} fromTimestamp
 * @param {number} toTimestamp
 * @param {number} startedAt
 * @returns {Promise<Array<object>>}
 */
async function fetchAllLeads(kommoSubdomain, accessToken, fromTimestamp, toTimestamp, startedAt) {
  let allLeads = [];
  let page = 1;
  const limit = 250;
  let hasMore = true;

  while (hasMore) {
    assertDeadline(startedAt, GLOBAL_DEADLINE_MS);

    const params = {
      page,
      limit,
      with: 'contacts',
      'filter[created_at][from]': fromTimestamp,
      'filter[created_at][to]': toTimestamp
    };

    const response = await kommoRequest({
      method: 'get',
      url: `https://${kommoSubdomain}.kommo.com/api/v4/leads`,
      params,
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      timeout: 30000
    });
    const leads = response.data?._embedded?.leads || [];
    allLeads = allLeads.concat(leads);
    hasMore = leads.length === limit;
    if (hasMore) page++;
  }
  return allLeads;
}

/**
 * Trae un contacto individual. Sin catch propio: si `kommoRequest` lanza
 * (bloqueo, rate limit agotado, u otro error), se propaga al caller —
 * ya no se silencia como columnas vacías.
 * @param {string} kommoSubdomain
 * @param {string} accessToken
 * @param {number} contactId
 * @returns {Promise<object>}
 */
async function fetchContactDetails(kommoSubdomain, accessToken, contactId) {
  const response = await kommoRequest({
    method: 'get',
    url: `https://${kommoSubdomain}.kommo.com/api/v4/contacts/${contactId}`,
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    timeout: 10000
  });
  return response.data;
}

/**
 * Trae los contactos de una lista de IDs en lotes de 250 usando el filtro de
 * array de Kommo (`filter[id][]=...`), en vez de una request por contacto.
 *
 * NOTA DE VERIFICACIÓN: no se pudo probar en vivo contra la cuenta de Kommo
 * desde este entorno (sin acceso de red/credenciales acá). `filter[id][]` es
 * la sintaxis documentada por Kommo/amoCRM para filtrar por múltiples IDs, así
 * que se implementa como camino primario. Como red de seguridad en runtime, si
 * la respuesta no trae contactos o trae IDs fuera del chunk pedido (señal de
 * que el filtro fue ignorado por el servidor), se hace fallback automático a
 * fetch individual por contacto para ese chunk, con un `console.warn` explícito.
 * Recomendado confirmar en staging con datos reales antes de confiar 100% en
 * el camino batch.
 *
 * @param {string} kommoSubdomain
 * @param {string} accessToken
 * @param {number[]} contactIds
 * @param {number} startedAt
 * @returns {Promise<Map<number, object>>}
 */
async function fetchContactsBatch(kommoSubdomain, accessToken, contactIds, startedAt) {
  const contactsMap = new Map();
  if (contactIds.length === 0) return contactsMap;

  const CHUNK_SIZE = 250;
  const chunks = [];
  for (let i = 0; i < contactIds.length; i += CHUNK_SIZE) {
    chunks.push(contactIds.slice(i, i + CHUNK_SIZE));
  }

  for (const chunk of chunks) {
    assertDeadline(startedAt, GLOBAL_DEADLINE_MS);

    const response = await kommoRequest({
      method: 'get',
      url: `https://${kommoSubdomain}.kommo.com/api/v4/contacts`,
      params: {
        'filter[id][]': chunk,
        limit: CHUNK_SIZE
      },
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      timeout: 30000
    });

    const contacts = response.data?._embedded?.contacts || [];
    const requestedIds = new Set(chunk);
    // El filtro "funcionó" si vino vacío (podría ser legítimo si los contactos
    // ya no existen) O si TODOS los IDs devueltos pertenecen al chunk pedido.
    // Si vino algún ID fuera del chunk, el filtro fue ignorado por el servidor.
    const filterIgnored = contacts.some(c => !requestedIds.has(c.id));

    if (contacts.length === 0 || filterIgnored) {
      console.warn(
        `[reporte] filter[id][] no se comportó como se esperaba para un chunk de ${chunk.length} contactos ` +
        `(${contacts.length === 0 ? 'respuesta vacía' : 'IDs devueltos fuera del chunk pedido'}). ` +
        `Usando fallback de fetch individual por contacto.`
      );
      for (const id of chunk) {
        assertDeadline(startedAt, GLOBAL_DEADLINE_MS);
        const contactDetails = await fetchContactDetails(kommoSubdomain, accessToken, id);
        if (contactDetails) contactsMap.set(id, contactDetails);
      }
    } else {
      for (const contact of contacts) {
        contactsMap.set(contact.id, contact);
      }
    }
  }

  return contactsMap;
}

/**
 * Arma el Map<contactId, contactDetails> para todos los contactos principales
 * de la lista de leads, deduplicando IDs antes de pedirlos.
 * @param {string} kommoSubdomain
 * @param {string} accessToken
 * @param {Array<object>} leads
 * @param {number} startedAt
 * @returns {Promise<Map<number, object>>}
 */
async function buildContactsMap(kommoSubdomain, accessToken, leads, startedAt) {
  const contactIds = new Set();
  for (const lead of leads) {
    const mainContact = lead._embedded?.contacts?.[0];
    if (mainContact) contactIds.add(mainContact.id);
  }
  return fetchContactsBatch(kommoSubdomain, accessToken, Array.from(contactIds), startedAt);
}

/**
 * Trae la próxima tarea pendiente de un lead individual. Sin catch propio:
 * un error se propaga al caller en vez de silenciarse.
 * @param {string} kommoSubdomain
 * @param {string} accessToken
 * @param {number} leadId
 * @returns {Promise<object | null>}
 */
async function fetchNextTaskForLead(kommoSubdomain, accessToken, leadId) {
  const response = await kommoRequest({
    method: 'get',
    url: `https://${kommoSubdomain}.kommo.com/api/v4/tasks`,
    params: {
      'filter[entity_id]': leadId,
      'filter[entity_type]': 'leads',
      'filter[is_completed]': 0,
      'order[complete_till]': 'asc',
      'limit': 1
    },
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    timeout: 10000
  });
  const tasks = response.data?._embedded?.tasks || [];
  return tasks.length > 0 ? tasks[0] : null;
}

const TASKS_PAGE_LIMIT = 250;
const TASKS_MAX_PAGES = 40; // cap defensivo para evitar loop infinito ante una respuesta anómala

/**
 * Trae, en lote paginado, todas las tareas pendientes de tipo "leads" y arma
 * un Map<leadId, task> quedándose con la de `complete_till` más próxima por lead.
 * @param {string} kommoSubdomain
 * @param {string} accessToken
 * @param {number} startedAt
 * @returns {Promise<Map<number, object>>}
 */
async function fetchTasksForLeadsBatch(kommoSubdomain, accessToken, startedAt) {
  const tasksMap = new Map();
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    if (page > TASKS_MAX_PAGES) {
      console.warn(`[reporte] fetchTasksForLeadsBatch alcanzó el cap de ${TASKS_MAX_PAGES} páginas — puede haber tareas no incluidas en el reporte.`);
      break;
    }
    assertDeadline(startedAt, GLOBAL_DEADLINE_MS);

    const response = await kommoRequest({
      method: 'get',
      url: `https://${kommoSubdomain}.kommo.com/api/v4/tasks`,
      params: {
        page,
        limit: TASKS_PAGE_LIMIT,
        'filter[entity_type]': 'leads',
        'filter[is_completed]': 0
      },
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      timeout: 30000
    });

    const tasks = response.data?._embedded?.tasks || [];
    for (const task of tasks) {
      if (task.entity_type !== 'leads') continue;
      const existing = tasksMap.get(task.entity_id);
      if (!existing || task.complete_till < existing.complete_till) {
        tasksMap.set(task.entity_id, task);
      }
    }

    hasMore = tasks.length === TASKS_PAGE_LIMIT;
    if (hasMore) page++;
  }

  return tasksMap;
}

/**
 * Arma el Map<leadId, task> de próxima tarea pendiente por lead. Usa el camino
 * batch paginado si hay volumen (>100 leads); si no, fetch individual por lead
 * (no hay volumen que justifique el batching).
 * @param {string} kommoSubdomain
 * @param {string} accessToken
 * @param {Array<object>} leads
 * @param {number} startedAt
 * @returns {Promise<Map<number, object>>}
 */
async function buildTasksMap(kommoSubdomain, accessToken, leads, startedAt) {
  if (leads.length > 100) {
    return fetchTasksForLeadsBatch(kommoSubdomain, accessToken, startedAt);
  }

  const tasksMap = new Map();
  for (const lead of leads) {
    assertDeadline(startedAt, GLOBAL_DEADLINE_MS);
    const task = await fetchNextTaskForLead(kommoSubdomain, accessToken, lead.id);
    if (task) tasksMap.set(lead.id, task);
  }
  return tasksMap;
}

async function fetchCustomFields(kommoSubdomain, accessToken) {
  const authHeaders = { 'Authorization': `Bearer ${accessToken}` };

  const [leadsRes, contactsRes, pipelinesRes, lossReasonsRes] = await Promise.all([
    kommoRequest({
      method: 'get',
      url: `https://${kommoSubdomain}.kommo.com/api/v4/leads/custom_fields`,
      headers: authHeaders,
      timeout: 15000
    }),
    kommoRequest({
      method: 'get',
      url: `https://${kommoSubdomain}.kommo.com/api/v4/contacts/custom_fields`,
      headers: authHeaders,
      timeout: 15000
    }),
    kommoRequest({
      method: 'get',
      url: `https://${kommoSubdomain}.kommo.com/api/v4/leads/pipelines`,
      headers: authHeaders,
      timeout: 15000
    }),
    kommoRequest({
      method: 'get',
      url: `https://${kommoSubdomain}.kommo.com/api/v4/leads/loss_reasons`,
      headers: authHeaders,
      timeout: 15000
    }).catch((err) => {
      // Bloqueo o rate limit agotado: esto NO es un fallo aceptable de degradar
      // silenciosamente, debe abortar el reporte entero igual que cualquier otra falla dura.
      if (err instanceof KommoBlockedError || err instanceof KommoRateLimitError) throw err;
      // Cualquier otro error en este endpoint puntual (ej. 404) sí se degrada
      // con lista vacía — loss reasons es un dato accesorio, no crítico.
      return { data: { _embedded: { loss_reasons: [] } } };
    })
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
  // Campo 'Lleva Descuento' de Kommo — Sí=lleva, No=no lleva
  LLEVA_DESCUENTO: 814716,
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

// Columnas del reporte en orden
const COLUMNS = [
  'Fecha y hora de contacto',
  'Medio que uso el lead para encontrarnos',
  'Canal que uso el lead para contactarnos',
  'Aplica descuento',
  'Qué buscaba?',
  'Nombre del contacto inbound',
  'Información de contacto del lead inbound',
  'Correo',
  'Mensaje del contacto inbound',
  'Lead aplica como lead o no?',
  'Fecha de la 1era atención (en call center)',
  'Hora de la 1era atención (en call center)',
  'Tiene experiencia con el servicio?',
  'Qué va a guardar?',
  'Por qué el lead necesita guardar esas cosas en un depósito?',
  'Intención de Compra',
  'Sucursal Ofrecida',
  'Sucursal Elegida por Cliente',
  'Nombre con el que el lead inbound fue registrado en site link',
  'Estatus del lead',
  '¿Qué hará con sus bienes?',
  'Motivo de la pérdida',
  'Visitó?',
  'Estado final',
  'Fecha de seguimiento'
];

/**
 * Construye la fila del reporte para un lead. Función SÍNCRONA: solo lee de
 * los Maps de contactos/tareas ya armados en batch, sin I/O propio.
 * @param {object} lead
 * @param {Map<number, object>} contactsMap
 * @param {Map<number, object>} tasksMap
 * @param {Array<object>} pipelines
 * @param {Array<object>} lossReasons
 * @returns {Record<string, string>}
 */
function processLead(lead, contactsMap, tasksMap, pipelines, lossReasons) {
  let contactName = '';
  let contactPhone = '';
  let contactEmail = '';

  const mainContact = lead._embedded?.contacts?.[0];
  if (mainContact) {
    const contactDetails = contactsMap.get(mainContact.id);
    if (contactDetails) {
      contactName = contactDetails.name || '';
      const phoneField = contactDetails.custom_fields_values?.find(f => f.field_code === 'PHONE');
      const emailField = contactDetails.custom_fields_values?.find(f => f.field_code === 'EMAIL');
      contactPhone = phoneField?.values?.[0]?.value || '';
      contactEmail = emailField?.values?.[0]?.value || '';
    }
  }

  const task = tasksMap.get(lead.id);
  const nextTaskDate = task ? task.complete_till : null;

  const cf = lead.custom_fields_values || [];
  const statusName = getStatusName(pipelines, lead.status_id);
  const fechaHoraInbound = getCustomFieldValue(cf, LEAD_FIELDS.FECHA_HORA_CONTACTO_INBOUND);

  // Determinar estado final basado en status_id
  let estadoFinal = '';
  if (lead.status_id === STATUS.GANADO) estadoFinal = 'Ganado';
  else if (lead.status_id === STATUS.PERDIDO) estadoFinal = 'Perdido';

  return {
    'Fecha y hora de contacto': formatTimestamp(lead.created_at),
    'Medio que uso el lead para encontrarnos': getCustomFieldValue(cf, LEAD_FIELDS.CANAL_COMERCIAL),
    'Canal que uso el lead para contactarnos': getCustomFieldValue(cf, LEAD_FIELDS.CANAL_DEL_LEAD),
    'Aplica descuento': getCustomFieldValue(cf, LEAD_FIELDS.LLEVA_DESCUENTO),
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
  };
}

export async function GET({ request }) {
  const headers = { 'Content-Type': 'application/json' };
  const handlerStartedAt = Date.now();
  let lockAcquired = false;

  try {
    const url = new URL(request.url);
    const clientIp = getClientIp(request);

    if (isRateLimited(clientIp)) {
      return new Response(JSON.stringify({ success: false, error: 'Demasiadas solicitudes. Intente más tarde.' }), { status: 429, headers });
    }

    const secret = url.searchParams.get('secret');

    if (!isValidSecret(secret, import.meta.env.REPORTE_SECRET)) {
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

    // Convertir fechas a timestamps Unix (inicio del día from, fin del día to).
    // Se fija explícitamente el offset -05:00 de Panamá (sin horario de verano)
    // para que el rango sea correcto sin importar la zona horaria del servidor
    // donde corra el proceso de Node (Dokploy puede no estar en America/Panama).
    const fromTimestamp = Math.floor(new Date(`${fromDate}T00:00:00-05:00`).getTime() / 1000);
    const toTimestamp = Math.floor(new Date(`${toDate}T23:59:59-05:00`).getTime() / 1000);

    // Validar que las fechas sean válidas y el rango sea coherente
    if (isNaN(fromTimestamp) || isNaN(toTimestamp)) {
      return new Response(JSON.stringify({ success: false, error: 'Fechas inválidas' }), { status: 400, headers });
    }
    if (fromTimestamp > toTimestamp) {
      return new Response(JSON.stringify({ success: false, error: 'La fecha de inicio debe ser anterior a la fecha de fin' }), { status: 400, headers });
    }
    const MAX_RANGE_SECONDS = 365 * 24 * 60 * 60; // 365 días en segundos — viable gracias al batching
    if (toTimestamp - fromTimestamp > MAX_RANGE_SECONDS) {
      return new Response(JSON.stringify({ success: false, error: 'Rango máximo: 365 días' }), { status: 400, headers });
    }

    // Cache hit: servir directo, SIN tocar Kommo ni el single-flight lock.
    const cacheKey = `${fromDate}|${toDate}`;
    const cached = getCachedReport(cacheKey);
    if (cached) {
      console.log(`[reporte] Cache hit para rango ${cacheKey}`);
      return new Response(cached.buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${cached.filename}"`
        }
      });
    }

    // Circuit breaker: si Kommo está bloqueando o el breaker sigue abierto tras
    // un fallo previo, no insistir — abortar antes de cualquier llamada a Kommo.
    if (isCircuitOpen()) {
      const retryAfterMs = getCircuitRetryAfterMs();
      const responseHeaders = { ...headers };
      if (retryAfterMs) {
        responseHeaders['Retry-After'] = String(Math.ceil(retryAfterMs / 1000));
      }
      return new Response(JSON.stringify({
        success: false,
        error: 'Kommo temporalmente no disponible, reintentá en unos minutos',
        ...(retryAfterMs ? { retryAfterMs } : {})
      }), { status: 503, headers: responseHeaders });
    }

    // Single-flight: solo un reporte generándose a la vez en todo el proceso.
    if (reportInProgress) {
      return new Response(JSON.stringify({ success: false, error: 'Ya hay un reporte generándose, esperá a que termine' }), { status: 429, headers });
    }
    reportInProgress = true;
    lockAcquired = true;

    console.log(`Filtro de fechas: ${fromDate} (${fromTimestamp}) - ${toDate} (${toTimestamp})`);

    console.log('Obteniendo pipelines y loss reasons...');
    const { pipelines, lossReasons } = await fetchCustomFields(kommoSubdomain, accessToken);
    console.log('Loss reasons encontradas:', lossReasons.length);
    assertDeadline(handlerStartedAt, GLOBAL_DEADLINE_MS);

    console.log('Obteniendo leads en el rango de fechas...');
    const leads = await fetchAllLeads(kommoSubdomain, accessToken, fromTimestamp, toTimestamp, handlerStartedAt);
    console.log(`Total leads: ${leads.length}`);
    assertDeadline(handlerStartedAt, GLOBAL_DEADLINE_MS);

    // Ordenar leads por fecha de creación (ascendente)
    leads.sort((a, b) => a.created_at - b.created_at);
    console.log('Leads ordenados por fecha de creación (ascendente)');

    console.log('Obteniendo detalles de contactos en lote...');
    const contactsMap = await buildContactsMap(kommoSubdomain, accessToken, leads, handlerStartedAt);
    console.log(`Contactos resueltos: ${contactsMap.size}`);
    assertDeadline(handlerStartedAt, GLOBAL_DEADLINE_MS);

    console.log('Obteniendo próximas tareas pendientes...');
    const tasksMap = await buildTasksMap(kommoSubdomain, accessToken, leads, handlerStartedAt);
    console.log(`Tareas resueltas: ${tasksMap.size}`);
    assertDeadline(handlerStartedAt, GLOBAL_DEADLINE_MS);

    // processLead es síncrono: solo lee de los Maps ya armados, sin I/O adicional.
    const rows = leads.map(lead => processLead(lead, contactsMap, tasksMap, pipelines, lossReasons));

    // Generar Excel con exceljs
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leads');

    // Definir columnas con encabezados
    worksheet.columns = COLUMNS.map(col => ({
      header: col,
      key: col,
      width: 25
    }));

    // Agregar filas de datos
    for (const row of rows) {
      worksheet.addRow(row);
    }

    // Escribir a buffer en memoria
    const excelBuffer = await workbook.xlsx.writeBuffer();
    const today = new Date().toISOString().split('T')[0];
    const filename = `Reporte Kommo ${today}.xlsx`;

    setCachedReport(cacheKey, {
      buffer: excelBuffer,
      filename,
      expiresAt: Date.now() + REPORT_CACHE_TTL_MS
    });

    return new Response(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    if (error instanceof KommoBlockedError) {
      console.error('[reporte] Kommo bloqueó las solicitudes (circuito abierto o 401/403), abortando reporte:', error.message);
      return new Response(JSON.stringify({ success: false, error: 'Kommo bloqueó las solicitudes, reintentá más tarde' }), { status: 503, headers });
    }
    if (error instanceof KommoRateLimitError) {
      console.error('[reporte] Rate limit de Kommo agotado tras reintentos, abortando reporte:', error.message);
      return new Response(JSON.stringify({ success: false, error: 'Kommo está limitando las solicitudes, reintentá más tarde' }), { status: 503, headers });
    }
    if (error instanceof ReportDeadlineExceededError) {
      console.error('[reporte] Deadline global de 240s excedido, abortando reporte.');
      return new Response(JSON.stringify({ success: false, error: 'El reporte tardó demasiado en generarse, probá con un rango de fechas más chico' }), { status: 504, headers });
    }
    // Loggear detalle completo internamente — NUNCA exponer al cliente
    console.error('Error generando reporte:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno al generar el reporte'
    }), { status: 500, headers });
  } finally {
    if (lockAcquired) reportInProgress = false;
  }
}
