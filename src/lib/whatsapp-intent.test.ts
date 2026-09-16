import { describe, expect, it } from 'vitest';
import { isValidWhatsAppUrl, resolveIntent } from './whatsapp-intent';

describe('isValidWhatsAppUrl', () => {
  it('acepta una URL https de wa.me', () => {
    expect(isValidWhatsAppUrl('https://wa.me/50761234567?text=hola')).toBe(true);
  });

  it('acepta una URL https de api.whatsapp.com', () => {
    expect(isValidWhatsAppUrl('https://api.whatsapp.com/send?phone=50761234567')).toBe(true);
  });

  it('rechaza protocolo http (no https)', () => {
    expect(isValidWhatsAppUrl('http://wa.me/50761234567')).toBe(false);
  });

  it('rechaza hostnames que no son wa.me ni api.whatsapp.com', () => {
    expect(isValidWhatsAppUrl('https://evil.com/wa.me/50761234567')).toBe(false);
  });

  it('rechaza un hostname que contiene wa.me como subdominio de otro dominio', () => {
    expect(isValidWhatsAppUrl('https://wa.me.evil.com/50761234567')).toBe(false);
  });

  it('rechaza strings que no parsean como URL', () => {
    expect(isValidWhatsAppUrl('no-es-una-url')).toBe(false);
  });

  it('rechaza string vacío', () => {
    expect(isValidWhatsAppUrl('')).toBe(false);
  });
});

describe('resolveIntent', () => {
  it('devuelve mode quote cuando detail es undefined', () => {
    expect(resolveIntent(undefined)).toEqual({ mode: 'quote' });
  });

  it('devuelve mode quote cuando detail es null', () => {
    expect(resolveIntent(null)).toEqual({ mode: 'quote' });
  });

  it('devuelve mode quote cuando detail es un objeto vacío', () => {
    expect(resolveIntent({})).toEqual({ mode: 'quote' });
  });

  it('devuelve mode quote cuando detail no es un objeto (string)', () => {
    expect(resolveIntent('whatsapp')).toEqual({ mode: 'quote' });
  });

  it('devuelve mode quote cuando detail no es un objeto (number)', () => {
    expect(resolveIntent(42)).toEqual({ mode: 'quote' });
  });

  it('devuelve mode quote cuando mode es un string inválido', () => {
    expect(resolveIntent({ mode: 'invalido' })).toEqual({ mode: 'quote' });
  });

  it('devuelve mode quote explícito tal cual, ignorando whatsappUrl si viene', () => {
    expect(resolveIntent({ mode: 'quote', whatsappUrl: 'https://wa.me/507123' })).toEqual({
      mode: 'quote',
    });
  });

  it('devuelve mode whatsapp con whatsappUrl válida', () => {
    expect(resolveIntent({ mode: 'whatsapp', whatsappUrl: 'https://wa.me/50761234567' })).toEqual({
      mode: 'whatsapp',
      whatsappUrl: 'https://wa.me/50761234567',
    });
  });

  it('degrada a quote cuando mode es whatsapp pero falta whatsappUrl', () => {
    expect(resolveIntent({ mode: 'whatsapp' })).toEqual({ mode: 'quote' });
  });

  it('degrada a quote cuando mode es whatsapp pero whatsappUrl no es string', () => {
    expect(resolveIntent({ mode: 'whatsapp', whatsappUrl: 12345 })).toEqual({ mode: 'quote' });
  });

  it('degrada a quote cuando mode es whatsapp pero whatsappUrl es una URL insegura (anti open-redirect)', () => {
    expect(resolveIntent({ mode: 'whatsapp', whatsappUrl: 'https://evil.com/phish' })).toEqual({
      mode: 'quote',
    });
  });

  it('ignora el campo source opcional sin afectar la resolución', () => {
    expect(
      resolveIntent({
        mode: 'whatsapp',
        whatsappUrl: 'https://wa.me/50761234567',
        source: 'float_button',
      })
    ).toEqual({ mode: 'whatsapp', whatsappUrl: 'https://wa.me/50761234567' });
  });
});
