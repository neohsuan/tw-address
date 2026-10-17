import { describe, expect, it } from 'vitest';
import { format, parse } from '../src/index.js';
import type { AddressParts } from '../src/index.js';

describe('format', () => {
  it.each([null, undefined, 106, true, 'address'])('rejects non-object input %s', (input) => {
    expect(() => format(input as unknown as AddressParts)).toThrow(new TypeError('address must be an object'));
  });

  it('preserves an input postal code by default', () => {
    const parsed = parse('106003臺北市大安區金山南路2段55號');
    expect(format(parsed)).toBe('106003臺北市大安區金山南路二段55號');
    expect(format(parsed, { zip: false })).toBe('臺北市大安區金山南路二段55號');
    expect(format(parsed, { zip: true })).toBe(parsed.normalized);
  });
  it('adds the inferred zip3 only when requested', () => {
    const parsed = parse('板橋區中山路1號');
    expect(format(parsed)).toBe('新北市板橋區中山路1號');
    expect(format(parsed, { zip: true })).toBe('220新北市板橋區中山路1號');
  });
  it('accepts partial normalized parts and does not mutate them', () => {
    const parts: Readonly<AddressParts> = Object.freeze({ road: '中山路', number: '12號', floor: '地下1樓', room: '101室' });
    expect(format(parts)).toBe('中山路12號地下1樓101室');
    expect(format({})).toBe('');
    expect(format({ rest: 'unknown note' })).toBe('unknown note');
  });

  it('keeps a ZIP separate from partial numeric address parts', () => {
    const parts = { zip: '106', road: '14街', number: '1號' };
    expect(format(parts)).toBe('106 14街1號');
    expect(format(parts, { zip: false })).toBe('14街1號');
    expect(format({ zip3: '106', number: '12號' }, { zip: true })).toBe('106 12號');
    expect(format({ zip: '999', rest: '14未知地名' })).toBe('999 14未知地名');
  });
});
