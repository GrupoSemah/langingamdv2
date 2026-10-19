import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  captureAttributionFromUrl,
  captureGaClientId,
  getAttributionParams,
} from "./attribution";

// Archivo aparte: attribution.test.ts ya está en el tope de 400 líneas.
const STORAGE_KEY = "amd_attribution";
const CONSENT_KEY = "cookie-consent";
const NOW = new Date("2026-09-27T12:00:00.000Z").getTime();

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) =>
      store.has(key) ? (store.get(key) as string) : null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  } as unknown as Storage;
}

function stubEnv(
  storage: Storage,
  search = "",
  cookies: Record<string, string> = {},
): { writes: string[] } {
  const jar = new Map<string, string>(Object.entries(cookies));
  const writes: string[] = [];
  vi.stubGlobal("window", { location: { search }, localStorage: storage });
  vi.stubGlobal("document", {
    get cookie(): string {
      return Array.from(jar.entries(), ([k, v]) => `${k}=${v}`).join("; ");
    },
    set cookie(raw: string) {
      writes.push(raw);
      const [pair] = raw.split(";");
      const idx = pair.indexOf("=");
      jar.set(pair.slice(0, idx), pair.slice(idx + 1));
    },
  });
  return { writes };
}

function storedParams(storage: Storage): Record<string, string> {
  return (
    JSON.parse(storage.getItem(STORAGE_KEY) as string) as {
      params: Record<string, string>;
    }
  ).params;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("saneo al leer (A)", () => {
  it("descarta el registro si capturedAt no es finito o es futuro", () => {
    for (const capturedAt of [1e308, NOW + 10 * 60 * 1000]) {
      const storage = createMemoryStorage();
      storage.setItem(
        STORAGE_KEY,
        JSON.stringify({ capturedAt, params: { gclid: "ok" } }),
      );
      stubEnv(storage);

      expect(Array.from(getAttributionParams().entries())).toEqual([]);
      expect(storage.getItem(STORAGE_KEY)).toBeNull();
    }
  });

  it("tolera 5 minutos de reloj adelantado", () => {
    const storage = createMemoryStorage();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        capturedAt: NOW + 4 * 60 * 1000,
        params: { gclid: "ok" },
      }),
    );
    stubEnv(storage);

    expect(getAttributionParams().get("gclid")).toBe("ok");
  });

  it("la cookie manipulada se sanea antes de re-hidratar localStorage", () => {
    const storage = createMemoryStorage();
    const params = { gclid: "ok", evil: "x", utm_term: "a\u0000b" };
    stubEnv(storage, "", {
      [STORAGE_KEY]: encodeURIComponent(
        JSON.stringify({ capturedAt: NOW, params }),
      ),
    });

    expect(Object.fromEntries(getAttributionParams().entries())).toEqual({
      gclid: "ok",
    });
    expect(storedParams(storage)).toEqual({ gclid: "ok" });
  });

  it("captureGaClientId persiste el registro saneado", () => {
    const storage = createMemoryStorage();
    storage.setItem(CONSENT_KEY, "accepted");
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        capturedAt: NOW,
        params: { gclid: "ok", evil: "x", adid: "zz" },
      }),
    );
    stubEnv(storage, "", { _ga: "GA1.2.55.66" });

    captureGaClientId();

    expect(storedParams(storage)).toEqual({ gclid: "ok", gclientid: "55.66" });
  });
});

describe("cookie grande u obsoleta (B)", () => {
  it("borra la cookie anterior (Max-Age=0, Path=/) si el valor supera 2000 caracteres", () => {
    const storage = createMemoryStorage();
    const { writes } = stubEnv(
      storage,
      `?utm_source=${"a".repeat(100)}&utm_medium=${"b".repeat(100)}`,
    );
    captureAttributionFromUrl();
    expect(writes.at(-1)).toContain("Max-Age=7776000");

    // Valores cortos que se expanden al codificar (é = 6 caracteres) y superan el tope.
    const big = encodeURIComponent("é".repeat(75));
    const second = stubEnv(
      storage,
      `?utm_source=${big}&utm_medium=${big}&utm_campaign=${big}&utm_term=${big}&utm_content=${big}`,
    );
    captureAttributionFromUrl();

    const last = second.writes.at(-1) as string;
    expect(last.startsWith(`${STORAGE_KEY}=;`)).toBe(true);
    expect(last).toContain("Max-Age=0");
    expect(last).toContain("Path=/");
  });

  it("un valor chico sigue escribiéndose normalmente", () => {
    const { writes } = stubEnv(createMemoryStorage(), "?gclid=abc");
    captureAttributionFromUrl();
    expect(writes.at(-1)).toContain("Max-Age=7776000");
  });
});

describe("gclientid y consentimiento de analítica (C)", () => {
  it('con consentimiento "accepted" captura gclientid', () => {
    const storage = createMemoryStorage();
    storage.setItem(CONSENT_KEY, "accepted");
    stubEnv(storage, "?gclid=abc", { _ga: "GA1.2.55.66" });
    captureAttributionFromUrl();

    captureGaClientId();

    expect(getAttributionParams().get("gclientid")).toBe("55.66");
  });

  it('con "essential-only" no captura gclientid', () => {
    const storage = createMemoryStorage();
    storage.setItem(CONSENT_KEY, "essential-only");
    stubEnv(storage, "?gclid=abc", { _ga: "GA1.2.55.66" });
    captureAttributionFromUrl();

    captureGaClientId();

    expect(storedParams(storage)).toEqual({ gclid: "abc" });
  });

  it("sin decisión no captura; al aceptar después, la siguiente llamada sí", () => {
    const storage = createMemoryStorage();
    stubEnv(storage, "?gclid=abc", { _ga: "GA1.2.55.66" });
    captureAttributionFromUrl();

    captureGaClientId();
    expect(storedParams(storage)).toEqual({ gclid: "abc" });

    storage.setItem(CONSENT_KEY, "accepted");
    captureGaClientId();
    expect(storedParams(storage)).toEqual({ gclid: "abc", gclientid: "55.66" });
  });

  it("un gclientid ya guardado no se devuelve si el consentimiento es denegado", () => {
    const storage = createMemoryStorage();
    storage.setItem(CONSENT_KEY, "essential-only");
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        capturedAt: NOW,
        params: { gclid: "abc", gclientid: "55.66" },
      }),
    );
    stubEnv(storage);

    expect(Object.fromEntries(getAttributionParams().entries())).toEqual({
      gclid: "abc",
    });
  });
});
