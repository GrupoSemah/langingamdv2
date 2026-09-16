import type { APIRoute } from 'astro';
import { z } from 'zod';

export const prerender = false;

// ─── Proxy delgado hacia form-almacenajes ─────────────────────────────────────
// Este endpoint NO contiene lógica de Kommo. Solo valida el request del cliente,
// aplica controles de abuso (origin/rate-limit/tamaño) y reenvía el payload al
// servicio interno de form-almacenajes (POST /api/internal/whatsapp-capture),
// que es quien resuelve búsqueda/dedupe/creación real del lead. Centralizado ahí
// porque este repo no tiene normalización de teléfono internacional y duplicar
// esa lógica arriesga que la clave de matching (teléfono normalizado) diverja
// silenciosamente entre los dos repos.
//
// Contrato de respuesta al cliente: SIEMPRE 202 si el request del cliente está
// bien formado, pasó el rate limit y el Origin matchea — sin importar si el
// downstream responde, tarda, o directamente no existe todavía. El modal que
// consume este endpoint (WhatsAppPhoneModal.tsx) lo llama fire-and-forget con
// timeout de 1500ms y jamás bloquea la navegación del usuario a WhatsApp.

// ─── Config ────────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = new Set([
  'https://almacenajes-minidepositos.com',
  'https://www.almacenajes-minidepositos.com',
  'http://localhost:4321',
]);

const DOWNSTREAM_TIMEOUT_MS = 1200;
const MAX_CONTENT_LENGTH_BYTES = 8000;
const RATE_WINDOW_MS = 300_000; // 5 minutos
const RATE_MAX_REQUESTS = 10;

// ─── Rate limiter en memoria (IP → timestamps) ────────────────────────────────
// Mismo patrón que form-almacenajes/src/pages/api/lead-quiz.ts, replicado acá
// porque no hay forma de compartir código entre los dos repos.

const ipTimestamps = new Map<string, number[]>();

// Tope duro de entradas del mapa: sin esto, IPs falsificadas (una por request)
// harían crecer el Map indefinidamente y agotarían memoria del proceso.
const IP_MAP_MAX_ENTRIES = 5000;

function cleanupExpiredIps(): void {
  const now = Date.now();
  for (const [ip, timestamps] of ipTimestamps.entries()) {
    const stillValid = timestamps.filter((t) => now - t < RATE_WINDOW_MS);
    if (stillValid.length === 0) {
      ipTimestamps.delete(ip);
    } else {
      ipTimestamps.set(ip, stillValid);
    }
  }
}

function isRateLimited(ip: string): boolean {
  cleanupExpiredIps();

  // Mapa a capacidad y esta IP todavía no tiene entrada: fail-closed (bloquear)
  // en vez de fail-open (dejar pasar) ante presión de memoria.
  if (ipTimestamps.size >= IP_MAP_MAX_ENTRIES && !ipTimestamps.has(ip)) {
    return true;
  }

  const now = Date.now();
  const prev = ipTimestamps.get(ip) ?? [];
  const recent = prev.filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX_REQUESTS) return true;
  recent.push(now);
  ipTimestamps.set(ip, recent);
  return false;
}

// ─── Extracción de IP ──────────────────────────────────────────────────────
// Solo confiamos en cf-connecting-ip: es el único header que Cloudflare setea
// de forma no-spoofeable cuando el origin está detrás de Cloudflare. Headers
// como x-real-ip/x-forwarded-for los puede inventar cualquier cliente en cada
// request, lo que permitiría rotar "IPs" para esquivar el rate limiter.
//
// PENDIENTE (fuera del alcance de este código): confirmar con el Jefe que el
// servidor de origen (Dokploy) solo acepta tráfico que ya pasó por Cloudflare
// (Authenticated Origin Pulls o firewall equivalente). Sin eso, un atacante
// que le pegue directo al origin (bypaseando Cloudflare) podría setear
// cf-connecting-ip él mismo.
function extractIp(request: Request): string | undefined {
  return request.headers.get('cf-connecting-ip') ?? undefined;
}

// ─── Zod schema ────────────────────────────────────────────────────────────
// phone/lang/source son los ÚNICOS campos que hoy envía WhatsAppPhoneModal.tsx
// (ver sendLeadBestEffort). El resto se acepta como opcional para soportar el
// contrato completo documentado sin romper el request real actual ni forzar
// un cambio de frontend.

const UtmSchema = z
  .object({
    source: z.string().max(200).optional(),
    medium: z.string().max(200).optional(),
    campaign: z.string().max(200).optional(),
    gclid: z.string().max(200).optional(),
  })
  .partial();

const WhatsAppLeadSchema = z.object({
  phone: z.string().min(1).max(32),
  lang: z.enum(['es', 'en']),
  source: z.string().min(1).max(200),
  branch: z.string().max(200).optional(),
  pageUrl: z.string().url().max(200).optional(),
  utm: UtmSchema.optional(),
  waTarget: z.string().max(32).optional(),
  clientCaptureId: z.string().uuid().optional(),
  // Token del widget Turnstile (WhatsAppPhoneModal.tsx) — requerido, verificado contra
  // Cloudflare antes de reenviar nada al servicio interno de form-almacenajes.
  turnstileToken: z.string().min(1),
});

type WhatsAppLeadPayload = z.infer<typeof WhatsAppLeadSchema>;

// ─── Response helper ───────────────────────────────────────────────────────

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

// ─── Turnstile siteverify ─────────────────────────────────────────────────
// Mismo patrón que form-almacenajes/src/pages/api/lead-quiz.ts. Fail-closed a
// propósito: si el fetch a Cloudflare falla/timeoutea, se retorna `false` (rechazo),
// no `true`. A diferencia del resto de este endpoint (fail-open hacia el usuario, que
// ya abrió WhatsApp de forma fire-and-forget antes de que esta respuesta llegue), este
// es el único control anti-abuso real — fail-closed acá no degrada la experiencia del
// usuario, solo evita que un lead no verificado llegue a Kommo.

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
}

async function verifyTurnstile(
  token: string,
  secret: string,
  remoteip: string | undefined,
): Promise<boolean> {
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteip) body.set('remoteip', remoteip);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });

    const data = (await res.json()) as TurnstileResponse;
    return data.success === true;
  } catch (err) {
    console.error('[whatsapp-lead] Turnstile verification error:', err);
    return false;
  }
}

// ─── Forward al servicio interno de form-almacenajes ──────────────────────
// Acotado a DOWNSTREAM_TIMEOUT_MS. Cualquier falla (red caída, timeout, 404
// porque el endpoint interno todavía no existe, 5xx, etc.) se loguea con el
// captureId para correlación, pero NUNCA se propaga como error al cliente.
// Solo se llama DESPUÉS de que Turnstile verificó el token — por eso el payload
// forwardeado excluye turnstileToken (ya cumplió su propósito acá, es de un solo uso
// y form-almacenajes no lo espera en este contrato).
async function forwardToInternalCapture(
  payload: Omit<WhatsAppLeadPayload, 'turnstileToken'>,
  captureId: string,
  clientIp: string,
  internalUrl: string,
  internalKey: string,
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DOWNSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(`${internalUrl}/api/internal/whatsapp-capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': internalKey,
      },
      body: JSON.stringify({
        ...payload,
        clientCaptureId: captureId,
        clientIp,
        receivedAt: new Date().toISOString(),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error('[whatsapp-lead] downstream capture returned non-OK status', {
        captureId,
        status: response.status,
      });
    } else {
      console.log('[whatsapp-lead] downstream capture forwarded ok', {
        captureId,
        status: response.status,
      });
    }
  } catch (error) {
    console.error('[whatsapp-lead] downstream capture unreachable or timed out', {
      captureId,
      message: error instanceof Error ? error.message : 'unknown error',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Handler ───────────────────────────────────────────────────────────────

export const POST: APIRoute = async ({ request }) => {
  // 1. Allowlist de Origin — sin detalle en el rechazo.
  const origin = request.headers.get('origin');
  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    return jsonResponse({ success: false, error: 'Forbidden' }, 403);
  }

  // 2. Content-Type debe ser JSON.
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return jsonResponse({ success: false, error: 'Unsupported content type' }, 415);
  }

  // 3. Límite de tamaño del payload.
  const contentLength = parseInt(request.headers.get('content-length') ?? '0', 10);
  if (contentLength > MAX_CONTENT_LENGTH_BYTES) {
    return jsonResponse({ success: false, error: 'Payload too large' }, 413);
  }

  // 4. Parseo del body.
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Invalid request body' }, 400);
  }

  // 5. Validación con Zod.
  const parsed = WhatsAppLeadSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn('[whatsapp-lead] validation failed', parsed.error.flatten());
    return jsonResponse({ success: false, error: 'Invalid request body' }, 400);
  }

  const payload = parsed.data;

  // 6. Rate limiting por IP — ANTES de Turnstile para no gastar el siteverify en IPs bloqueadas.
  const clientIp = extractIp(request) ?? 'unknown';
  if (isRateLimited(clientIp)) {
    console.warn('[whatsapp-lead] rate limit exceeded', { clientIp });
    return jsonResponse({ success: false, error: 'Too many requests' }, 429);
  }

  // 6.5 Verificación Turnstile — fail-closed (ver comentario en verifyTurnstile). Si falta el
  //     secret en env, es un error de configuración del servidor, no del cliente.
  const turnstileSecret = import.meta.env.TURNSTILE_SECRET_KEY;
  if (!turnstileSecret) {
    console.error('[whatsapp-lead] missing TURNSTILE_SECRET_KEY');
    return jsonResponse({ success: false, error: 'Server configuration error' }, 500);
  }

  const turnstileOk = await verifyTurnstile(
    payload.turnstileToken,
    turnstileSecret,
    clientIp !== 'unknown' ? clientIp : undefined,
  );
  if (!turnstileOk) {
    console.warn('[whatsapp-lead] turnstile verification failed', { clientIp });
    return jsonResponse({ success: false, error: 'turnstile-failed' }, 400);
  }

  const captureId = payload.clientCaptureId ?? crypto.randomUUID();

  // 7. Reenvío al servicio interno — si faltan env vars o el downstream falla,
  //    se loguea pero jamás se bloquea ni se degrada la respuesta al cliente.
  //    turnstileToken ya cumplió su propósito (verificado arriba) — se excluye del forward.
  const internalUrl = import.meta.env.FORM_SERVICE_INTERNAL_URL;
  const internalKey = import.meta.env.INTERNAL_API_KEY;

  if (!internalUrl || !internalKey) {
    console.error('[whatsapp-lead] missing FORM_SERVICE_INTERNAL_URL/INTERNAL_API_KEY', {
      captureId,
    });
  } else {
    const { turnstileToken: _turnstileToken, ...forwardPayload } = payload;
    void _turnstileToken;
    await forwardToInternalCapture(forwardPayload, captureId, clientIp, internalUrl, internalKey);
  }

  // 8. El cliente siempre recibe 202 desde este punto en adelante.
  return jsonResponse({ success: true, status: 'accepted', captureId }, 202);
};
