import { describe, expect, it } from 'vitest';
import { generateAileKodu, encryptBundle, decryptBundle, normalizeCode, isFamilyPayload } from './crypto';

describe('Aile Kodu crypto', () => {
  it('generates an 8-char Crockford code (no I,L,O,U)', () => {
    const code = generateAileKodu();
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$/);
    // iki üretim farklıdır (1/32^8 çakışma olasılığı ihmal)
    expect(generateAileKodu()).not.toBe(code);
  });

  it('roundtrips: encrypt → decrypt gives identical data', async () => {
    const data = { hello: 'dünya', n: 42, list: [1, 2, 3] };
    const code = generateAileKodu();
    const payload = await encryptBundle(data, code);
    expect(payload.startsWith('HPK1.')).toBe(true);
    expect(await decryptBundle(payload, code)).toEqual(data);
  });

  it('wrong code is rejected', async () => {
    const payload = await encryptBundle({ secret: true }, 'ABCDEFGH');
    await expect(decryptBundle(payload, 'ZZZZZZZZ')).rejects.toThrow(/Aile Kodu hatalı|çözülemedi/);
  });

  it('tampered payload is rejected', async () => {
    const payload = await encryptBundle({ a: 1 }, 'AB12CD34');
    const parts = payload.split('.');
    parts[3] = parts[3].slice(0, -2) + 'AA';
    await expect(decryptBundle(parts.join('.'), 'AB12CD34')).rejects.toThrow();
  });

  it('non-HPK1 input is rejected with a clear message', async () => {
    await expect(decryptBundle('merhaba dostum', 'AB12CD34')).rejects.toThrow(/HPK1 zarfı bekleniyor/);
  });

  it('normalizeCode maps human typos (o→0, i→1), case and separators', () => {
    expect(normalizeCode(' abcd efgh ')).toBe('ABCDEFGH');
    expect(normalizeCode('AB12-CD34')).toBe('AB12CD34');
    expect(normalizeCode('o1i u')).toBe('011V');
  });

  it('lowercase / human-typed code still decrypts', async () => {
    const payload = await encryptBundle({ k: 'v' }, 'AB12CD34');
    expect(await decryptBundle(payload, 'ab12cd34')).toEqual({ k: 'v' });
  });

  it('corrupted SALT segment gives the friendly error (not raw DOMException)', async () => {
    const payload = await encryptBundle({ a: 1 }, 'AB12CD34');
    const parts = payload.split('.');
    parts[1] = '!!invalid-base64!!';
    await expect(decryptBundle(parts.join('.'), 'AB12CD34')).rejects.toThrow(/Aile Kodu hatalı|bozuk/);
  });

  it('normalizeCode maps U→V and Turkish İ/ı→1 (documented Crockford aliases)', () => {
    expect(normalizeCode('UB')).toBe('VB');
    expect(normalizeCode('İB')).toBe('1B');
    expect(normalizeCode('ıb')).toBe('1B');
  });

  it('isFamilyPayload validates the envelope shape', () => {
    expect(isFamilyPayload('HPK1.AAAA.AAAA.AAAA')).toBe(true);
    expect(isFamilyPayload('selam')).toBe(false);
    expect(isFamilyPayload('HPK1.AAAA')).toBe(false);
  });
});