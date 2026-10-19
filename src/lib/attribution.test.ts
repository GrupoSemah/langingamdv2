import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { captureAttributionFromUrl, captureGaClientId, getAttributionParams } from './attribution';

const STORAGE_KEY = 'amd_attribution';
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Storage en memoria que cumple el contrato de `Storage` del DOM. Se castea
 * porque el índice `[name: string]: any` de `lib.dom.d.ts` no puede
 * satisfacerse con un objeto literal sin recurrir a `any`.
 */
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } as unknown as Storage;
}

function createThrowingStorage(): Storage {
  const explode = () => {
    throw new Error('localStorage bloqueado (modo privado / cuota / cookies)');
  };

  return {
    getItem: explode,
    setItem: explode,
    removeItem: explode,
    clear: explode,
    key: explode,
    length: 0,
  } as unknown as Storage;
}

function stubWindow(search: string, storage: Storage): void {
  vi.stubGlobal('window', {
    location: { search },
    localStorage: storage,
  });
}

/** Simula Safari en modo privado: acceder a `.localStorage` ya lanza. */
function stubWindowWithUnreachableStorage(search: string): void {
  vi.stubGlobal('window', {
    location: { search },
    get localStorage(): Storage {
      throw new Error('SecurityError: localStorage inaccesible');
    },
  });
}

function readStoredRaw(storage: Storage): string | null {
  return storage.getItem(STORAGE_KEY);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-27T12:00:00.000Z'));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('captureAttributionFromUrl', () => {
  it('captura un gclid válido y lo guarda en localStorage con timestamp', () => {
    const storage = createMemoryStorage();
    stubWindow('?gclid=Abc123_-XYZ', storage);

    captureAttributionFromUrl();

    const raw = readStoredRaw(storage);
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw as string) as { capturedAt: number; params: Record<string, string> };
    expect(parsed.params.gclid).toBe('Abc123_-XYZ');
    expect(parsed.capturedAt).toBe(Date.now());
  });

  it('captura gbraid, wbraid y utm_* válidos en simultáneo', () => {
    const storage = createMemoryStorage();
    stubWindow(
      '?gbraid=gb123&wbraid=wb456&utm_source=google&utm_medium=cpc&utm_campaign=verano2026',
      storage
    );

    captureAttributionFromUrl();

    const parsed = JSON.parse(readStoredRaw(storage) as string) as {
      params: Record<string, string>;
    };
    expect(parsed.params).toEqual({
      gbraid: 'gb123',
      wbraid: 'wb456',
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'verano2026',
    });
  });

  it('descarta un gclid con formato inválido pero conserva los demás parámetros válidos', () => {
    const storage = createMemoryStorage();
    stubWindow('?gclid=tiene%20espacio&utm_source=google', storage);

    captureAttributionFromUrl();

    const parsed = JSON.parse(readStoredRaw(storage) as string) as {
      params: Record<string, string>;
    };
    expect(parsed.params).toEqual({ utm_source: 'google' });
  });

  it('descarta un utm_campaign de más de 150 caracteres', () => {
    const storage = createMemoryStorage();
    const tooLong = 'a'.repeat(151);
    stubWindow(`?utm_source=google&utm_campaign=${tooLong}`, storage);

    captureAttributionFromUrl();

    const parsed = JSON.parse(readStoredRaw(storage) as string) as {
      params: Record<string, string>;
    };
    expect(parsed.params).toEqual({ utm_source: 'google' });
  });

  it('no guarda nada si ningún parámetro de atribución es válido', () => {
    const storage = createMemoryStorage();
    stubWindow('?gclid=tiene espacio&utm_campaign=' + 'a'.repeat(151), storage);

    captureAttributionFromUrl();

    expect(readStoredRaw(storage)).toBeNull();
  });

  it('reemplaza por completo la atribución previa cuando llega un click más nuevo (last-click wins)', () => {
    const storage = createMemoryStorage();

    stubWindow('?gclid=viejo123&utm_source=facebook', storage);
    captureAttributionFromUrl();

    vi.setSystemTime(new Date('2026-09-28T12:00:00.000Z'));
    vi.stubGlobal('window', { location: { search: '?utm_source=google' }, localStorage: storage });
    captureAttributionFromUrl();

    const parsed = JSON.parse(readStoredRaw(storage) as string) as {
      capturedAt: number;
      params: Record<string, string>;
    };
    expect(parsed.params).toEqual({ utm_source: 'google' });
    expect(parsed.params.gclid).toBeUndefined();
    expect(parsed.capturedAt).toBe(new Date('2026-09-28T12:00:00.000Z').getTime());
  });

  it('no modifica lo guardado cuando la URL actual no trae ningún parámetro de atribución', () => {
    const storage = createMemoryStorage();

    stubWindow('?gclid=original123', storage);
    captureAttributionFromUrl();
    const before = readStoredRaw(storage);

    vi.stubGlobal('window', { location: { search: '' }, localStorage: storage });
    captureAttributionFromUrl();

    expect(readStoredRaw(storage)).toBe(before);
  });

  it('no lanza cuando localStorage.setItem lanza excepción (modo privado)', () => {
    const storage = createThrowingStorage();
    stubWindow('?gclid=abc123', storage);

    expect(() => captureAttributionFromUrl()).not.toThrow();
  });

  it('no lanza cuando acceder a window.localStorage lanza excepción', () => {
    stubWindowWithUnreachableStorage('?gclid=abc123');

    expect(() => captureAttributionFromUrl()).not.toThrow();
  });
});

describe('getAttributionParams', () => {
  it('devuelve un URLSearchParams vacío cuando no hay nada guardado', () => {
    const storage = createMemoryStorage();
    stubWindow('', storage);

    const result = getAttributionParams();

    expect(Array.from(result.entries())).toEqual([]);
  });

  it('devuelve los parámetros guardados vigentes (dentro de los 90 días)', () => {
    const storage = createMemoryStorage();
    stubWindow('?gclid=abc123&utm_source=google', storage);
    captureAttributionFromUrl();

    vi.setSystemTime(new Date('2026-10-01T12:00:00.000Z'));

    const result = getAttributionParams();

    expect(result.get('gclid')).toBe('abc123');
    expect(result.get('utm_source')).toBe('google');
  });

  it('no incluye claves que no fueron guardadas', () => {
    const storage = createMemoryStorage();
    stubWindow('?gclid=abc123', storage);
    captureAttributionFromUrl();

    const result = getAttributionParams();

    expect(result.has('utm_source')).toBe(false);
    expect(Array.from(result.keys())).toEqual(['gclid']);
  });

  it('expira y limpia el storage cuando pasaron más de 90 días desde la captura', () => {
    const storage = createMemoryStorage();
    stubWindow('?gclid=abc123', storage);
    captureAttributionFromUrl();

    vi.setSystemTime(new Date(Date.now() + NINETY_DAYS_MS + 1000));

    const result = getAttributionParams();

    expect(Array.from(result.entries())).toEqual([]);
    expect(readStoredRaw(storage)).toBeNull();
  });

  it('sigue vigente justo en el límite de 90 días (no expira antes de tiempo)', () => {
    const storage = createMemoryStorage();
    stubWindow('?gclid=abc123', storage);
    captureAttributionFromUrl();

    vi.setSystemTime(new Date(Date.now() + NINETY_DAYS_MS - 1000));

    const result = getAttributionParams();

    expect(result.get('gclid')).toBe('abc123');
  });

  it('devuelve vacío sin lanzar cuando localStorage.getItem lanza excepción', () => {
    const storage = createThrowingStorage();
    stubWindow('', storage);

    let result: URLSearchParams = new URLSearchParams();
    expect(() => {
      result = getAttributionParams();
    }).not.toThrow();
    expect(Array.from(result.entries())).toEqual([]);
  });

  it('devuelve vacío sin lanzar cuando window no está definido', () => {
    // No se llama a stubWindow(): en este entorno de test Node, `window`
    // no existe globalmente por defecto.
    const result = getAttributionParams();

    expect(Array.from(result.entries())).toEqual([]);
  });

  it('devuelve vacío cuando el contenido guardado es JSON corrupto', () => {
    const storage = createMemoryStorage();
    storage.setItem(STORAGE_KEY, 'esto-no-es-json{{{');
    stubWindow('', storage);

    const result = getAttributionParams();

    expect(Array.from(result.entries())).toEqual([]);
  });
});

function stubCookieJar(initial: Record<string, string> = {}): { writes: string[] } {
  const jar = new Map<string, string>(Object.entries(initial));
  const writes: string[] = [];
  vi.stubGlobal('document', {
    get cookie(): string {
      return Array.from(jar.entries(), ([k, v]) => `${k}=${v}`).join('; ');
    },
    set cookie(raw: string) {
      writes.push(raw);
      const [pair] = raw.split(';');
      const idx = pair.indexOf('=');
      jar.set(pair.slice(0, idx), pair.slice(idx + 1));
    },
  });
  return { writes };
}

describe('parámetros nuevos (utm_term, utm_content, ids de campaña)', () => {
  it('captura los 5 nuevos y getAttributionParams devuelve los 12 con gclientid', () => {
    const storage = createMemoryStorage();
    storage.setItem('cookie-consent', 'accepted');
    stubCookieJar({ _ga: 'GA1.1.1234567890.1700000000' });
    stubWindow(
      '?gclid=g1&gbraid=gb1&wbraid=wb1&utm_source=google&utm_medium=cpc&utm_campaign=c&utm_term=bodega%20panama&utm_content=ad1&campaignid=123&adgroupid=456&adid=789',
      storage
    );

    captureAttributionFromUrl();
    captureGaClientId();

    const result = getAttributionParams();
    expect(Object.fromEntries(result.entries())).toEqual({
      gclid: 'g1',
      gbraid: 'gb1',
      wbraid: 'wb1',
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'c',
      utm_term: 'bodega panama',
      utm_content: 'ad1',
      campaignid: '123',
      adgroupid: '456',
      adid: '789',
      gclientid: '1234567890.1700000000',
    });
  });

  it('rechaza ids no numéricos, utm_term con control y gclientid desde la URL', () => {
    const storage = createMemoryStorage();
    stubCookieJar();
    stubWindow('?campaignid=12a&adgroupid=' + '9'.repeat(21) + '&adid=-5&gclientid=111.222&utm_term=a%00b&utm_content=ok', storage);

    captureAttributionFromUrl();

    const parsed = JSON.parse(readStoredRaw(storage) as string) as { params: Record<string, string> };
    expect(parsed.params).toEqual({ utm_content: 'ok' });
  });

  it('descarta valores inválidos guardados al leer (storage manipulado)', () => {
    const storage = createMemoryStorage();
    stubCookieJar();
    const params = { campaignid: 'abc', adid: '55', gclientid: 'x.y', gclid: 'bad value' };
    storage.setItem(STORAGE_KEY, JSON.stringify({ capturedAt: Date.now(), params }));
    stubWindow('', storage);

    expect(Object.fromEntries(getAttributionParams().entries())).toEqual({ adid: '55' });
  });
});

describe('captureGaClientId', () => {
  it('lee client_id de _ga y lo fusiona sin perder lo capturado', () => {
    const storage = createMemoryStorage();
    storage.setItem('cookie-consent', 'accepted');
    stubCookieJar({ _ga: 'GA1.2.55.66' });
    stubWindow('?gclid=abc', storage);
    captureAttributionFromUrl();

    captureGaClientId();

    const parsed = JSON.parse(readStoredRaw(storage) as string) as { params: Record<string, string> };
    expect(parsed.params).toEqual({ gclid: 'abc', gclientid: '55.66' });
  });
});

describe('cookie amd_attribution', () => {
  it('escribe la cookie con 90 días, Path=/, SameSite=Lax y valor codificado', () => {
    const storage = createMemoryStorage();
    const { writes } = stubCookieJar();
    stubWindow('?utm_source=google&utm_term=a%20b', storage);

    captureAttributionFromUrl();

    const raw = writes.find((w) => w.startsWith(`${STORAGE_KEY}=`)) as string;
    expect(raw).toContain(`Max-Age=${NINETY_DAYS_MS / 1000}`);
    expect(raw).toContain('Path=/');
    expect(raw).toContain('SameSite=Lax');
    expect(raw).not.toContain('Secure');
    const value = raw.split(';')[0].slice(STORAGE_KEY.length + 1);
    expect(JSON.parse(decodeURIComponent(value)).params).toEqual({ utm_source: 'google', utm_term: 'a b' });
    expect(raw.length).toBeLessThan(4000);
  });

  it('cae a la cookie si localStorage está vacío y re-hidrata localStorage', () => {
    const source = createMemoryStorage();
    const { writes } = stubCookieJar();
    stubWindow('?gclid=cookie123', source);
    captureAttributionFromUrl();
    const cookieValue = writes[0].split(';')[0].slice(STORAGE_KEY.length + 1);

    const fresh = createMemoryStorage();
    stubCookieJar({ [STORAGE_KEY]: cookieValue });
    stubWindow('', fresh);

    expect(getAttributionParams().get('gclid')).toBe('cookie123');
    expect(readStoredRaw(fresh)).not.toBeNull();
  });
});
