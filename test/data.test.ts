import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { DISTRICTS } from '../src/data.generated.js';
import { LEGACY_DISTRICTS } from '../src/admin.js';
import { listCounties, listDistricts, lookupDistrict, lookupZip3, parse } from '../src/index.js';

describe('official data and lookup', () => {
  it('retains every official entry, including special postal areas', () => {
    expect(DISTRICTS).toHaveLength(371);
    expect(listCounties()).toHaveLength(22);
    expect(new Set(DISTRICTS.map(({ county, district }) => county + district)).size).toBe(371);
    expect(listCounties().reduce((sum, county) => sum + listDistricts(county).length, 0)).toBe(371);
    expect(lookupZip3('宜蘭縣', '釣魚臺列嶼')).toBe('290');
    expect(lookupZip3('高雄市', '東沙群島')).toBe('817');
    expect(lookupZip3('高雄市', '南沙群島')).toBe('819');
  });

  it.each(DISTRICTS)('round-trips $county / $district ($zip3)', ({ county, district, zip3 }) => {
    expect(lookupZip3(county, district)).toBe(zip3);
    expect(lookupDistrict(zip3)).toContainEqual({ county, district, zip3 });
    expect(listDistricts(county)).toContain(district);
    expect(parse(`${county}${district}中山路1號`)).toMatchObject({ county, district, zip3, valid: true });
    expect(parse(`${zip3}${district}中山路1號`)).toMatchObject({ county, district, zip3, valid: true });
  });

  it('preserves the non-injective three-digit mapping', () => {
    expect(lookupDistrict('600').map(({ district }) => district).sort()).toEqual(['東區', '西區']);
    expect(lookupDistrict('300').map(({ district }) => district).sort()).toEqual(['北區', '東區', '香山區']);
  });

  it('accepts administrative spelling and legacy aliases', () => {
    expect(lookupZip3('台北市', '大安區')).toBe('106');
    expect(lookupZip3('台東縣', '台東市')).toBe('950');
    expect(lookupZip3('台北縣', '板橋市')).toBe('220');
    expect(listDistricts('桃園縣')).toEqual(listDistricts('桃園市'));
    expect(lookupDistrict(' １０６ ')).toEqual([{ county: '臺北市', district: '大安區', zip3: '106' }]);
  });

  it.each(Object.entries(LEGACY_DISTRICTS))('maps every supported former name in %s', (county, names) => {
    for (const former of names) {
      const result = parse(`${county}${former}中山路1號`);
      expect(result, `${county}${former}`).toMatchObject({ county, district: `${former.slice(0, -1)}區`, valid: true });
    }
  });

  it('returns empty results for unknown or invalid lookup keys', () => {
    expect(lookupZip3('不存在縣', '不存在區')).toBeUndefined();
    expect(lookupZip3('臺北市', '板橋區')).toBeUndefined();
    expect(listDistricts('不存在縣')).toEqual([]);
    for (const zip of ['', '999', '106003', '106-003', 'abc', '10']) expect(lookupDistrict(zip)).toEqual([]);
  });

  it('returns defensive copies', () => {
    const counties = listCounties();
    counties.length = 0;
    expect(listCounties()).toHaveLength(22);
    const districts = listDistricts('臺北市');
    districts.length = 0;
    expect(listDistricts('臺北市')).toHaveLength(12);
    const records = lookupDistrict('600');
    Object.assign(records[0]!, { county: 'changed' });
    records.pop();
    expect(lookupDistrict('600')).toHaveLength(2);
    expect(lookupDistrict('600')[0]!.county).toBe('嘉義市');
  });

  it('reproduces the generated source byte for byte', async () => {
    const file = new URL('../src/data.generated.ts', import.meta.url);
    const before = readFileSync(file, 'utf8');
    await promisify(execFile)(process.execPath, ['scripts/generate-data.mjs'], { cwd: new URL('..', import.meta.url) });
    expect(readFileSync(file, 'utf8')).toBe(before);
  });

  it('rejects non-string lookup inputs', () => {
    expect(() => lookupZip3(null as unknown as string, '大安區')).toThrow(TypeError);
    expect(() => lookupZip3('臺北市', 1 as unknown as string)).toThrow(TypeError);
    expect(() => lookupDistrict(106 as unknown as string)).toThrow(TypeError);
    expect(() => listDistricts(undefined as unknown as string)).toThrow(TypeError);
  });
});
