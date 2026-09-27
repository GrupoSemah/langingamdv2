import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EVENT_CALLBACK_TIMEOUT_MS,
  NETWORK_SAFETY_TIMEOUT_MS,
  fireLeadSubmittedConversion,
} from './quoteConversion';

// Este proyecto no tiene jsdom instalado, así que `window` y `sessionStorage` se
// stubean manualmente sobre globalThis. Funciona porque quoteConversion.ts solo los
// referencia dentro de funciones (nunca en el top-level del módulo) — un bare
// identifier sin declaración lexical local resuelve contra globalThis en Node.
interface DataLayerEvent {
  event: string;
  lead_id?: string;
  lead_mode: string;
  eventCallback: () => void;
  eventTimeout: number;
}

interface StubWindow {
  dataLayer?: DataLayerEvent[];
}

function createSessionStorageStub(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

function getDataLayer(): DataLayerEvent[] {
  return ((globalThis as unknown as { window: StubWindow }).window.dataLayer ?? []) as DataLayerEvent[];
}

describe('fireLeadSubmittedConversion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (globalThis as unknown as { window: StubWindow }).window = {};
    (globalThis as unknown as { sessionStorage: Storage }).sessionStorage = createSessionStorageStub();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('empuja el evento amd_lead_submitted con el shape esperado (lead_id como string)', () => {
    const onDone = vi.fn();
    fireLeadSubmittedConversion(123, 'quote', onDone);

    const dataLayer = getDataLayer();
    expect(dataLayer).toHaveLength(1);
    expect(dataLayer[0]).toMatchObject({
      event: 'amd_lead_submitted',
      lead_id: '123',
      lead_mode: 'quote',
      eventTimeout: EVENT_CALLBACK_TIMEOUT_MS,
    });
    expect(typeof dataLayer[0].eventCallback).toBe('function');
  });

  it('omite lead_id (undefined) cuando no hay leadId disponible', () => {
    const onDone = vi.fn();
    fireLeadSubmittedConversion(null, 'whatsapp', onDone);

    const dataLayer = getDataLayer();
    expect(dataLayer).toHaveLength(1);
    expect(dataLayer[0].lead_id).toBeUndefined();
    expect(dataLayer[0].lead_mode).toBe('whatsapp');
  });

  it('invoca onDone cuando eventCallback de GTM confirma el disparo', () => {
    const onDone = vi.fn();
    fireLeadSubmittedConversion(1, 'quote', onDone);

    const dataLayer = getDataLayer();
    dataLayer[0].eventCallback();

    expect(onDone).toHaveBeenCalledTimes(1);

    // Aunque venza después el timeout de red, onDone no se vuelve a llamar.
    vi.advanceTimersByTime(NETWORK_SAFETY_TIMEOUT_MS + 100);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('invoca onDone por el timeout de red cuando eventCallback nunca llega (ad-blocker, GTM caído)', () => {
    const onDone = vi.fn();
    fireLeadSubmittedConversion(2, 'quote', onDone);

    expect(onDone).not.toHaveBeenCalled();
    vi.advanceTimersByTime(NETWORK_SAFETY_TIMEOUT_MS);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('no vuelve a pushear al dataLayer para el mismo leadId (dedupe por identidad)', () => {
    const onDoneFirst = vi.fn();
    const onDoneSecond = vi.fn();

    fireLeadSubmittedConversion(42, 'quote', onDoneFirst);
    fireLeadSubmittedConversion(42, 'quote', onDoneSecond);

    expect(getDataLayer()).toHaveLength(1);
    // El segundo llamado no bloquea la navegación aunque no pushee de nuevo.
    expect(onDoneSecond).toHaveBeenCalledTimes(1);
  });

  it('sí pushea al dataLayer para un leadId distinto', () => {
    fireLeadSubmittedConversion(1, 'quote', vi.fn());
    fireLeadSubmittedConversion(2, 'quote', vi.fn());

    expect(getDataLayer()).toHaveLength(2);
  });

  it('sin leadId (null) no puede dedupear — deja pasar el push cada vez', () => {
    fireLeadSubmittedConversion(null, 'quote', vi.fn());
    fireLeadSubmittedConversion(null, 'quote', vi.fn());

    expect(getDataLayer()).toHaveLength(2);
  });
});
