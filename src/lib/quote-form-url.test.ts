import { describe, expect, it } from 'vitest';
import { buildQuoteFormUrl } from './quote-form-url';

describe('buildQuoteFormUrl', () => {
  it('agrega lang y mode sobre la URL base', () => {
    const url = buildQuoteFormUrl({
      formUrl: 'https://leadform.almacenajes.net',
      lang: 'es',
      mode: 'quote',
      attributionParams: new URLSearchParams(),
    });

    const parsed = new URL(url);
    expect(parsed.searchParams.get('lang')).toBe('es');
    expect(parsed.searchParams.get('mode')).toBe('quote');
  });

  it('agrega todos los parámetros de atribución recibidos', () => {
    const attributionParams = new URLSearchParams({ utm_source: 'google', gclid: 'abc123' });

    const url = buildQuoteFormUrl({
      formUrl: 'https://leadform.almacenajes.net',
      lang: 'en',
      mode: 'whatsapp',
      attributionParams,
    });

    const parsed = new URL(url);
    expect(parsed.searchParams.get('utm_source')).toBe('google');
    expect(parsed.searchParams.get('gclid')).toBe('abc123');
    expect(parsed.searchParams.get('mode')).toBe('whatsapp');
  });

  it('preserva query params ya presentes en formUrl sin duplicar mode/lang', () => {
    const url = buildQuoteFormUrl({
      formUrl: 'https://leadform.almacenajes.net/?ref=footer',
      lang: 'es',
      mode: 'quote',
      attributionParams: new URLSearchParams(),
    });

    const parsed = new URL(url);
    expect(parsed.searchParams.get('ref')).toBe('footer');
    expect(parsed.searchParams.getAll('mode')).toEqual(['quote']);
    expect(parsed.searchParams.getAll('lang')).toEqual(['es']);
  });

  it('los parámetros de atribución sobrescriben un valor existente con la misma key', () => {
    const url = buildQuoteFormUrl({
      formUrl: 'https://leadform.almacenajes.net/?utm_source=stale',
      lang: 'es',
      mode: 'quote',
      attributionParams: new URLSearchParams({ utm_source: 'google' }),
    });

    const parsed = new URL(url);
    expect(parsed.searchParams.getAll('utm_source')).toEqual(['google']);
  });

  it('lanza si formUrl no es una URL válida', () => {
    expect(() =>
      buildQuoteFormUrl({
        formUrl: 'no-es-una-url',
        lang: 'es',
        mode: 'quote',
        attributionParams: new URLSearchParams(),
      })
    ).toThrow();
  });
});
