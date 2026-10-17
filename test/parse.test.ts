import { describe, expect, it } from 'vitest';
import { format, parse } from '../src/index.js';

describe('government-style addresses across all counties', () => {
  it.each([
    ['臺北市', '中正區', '100', '重慶南路一段122號', '重慶南路', '一段', '122號'],
    ['臺北市', '中正區', '100', '忠孝東路一段1號', '忠孝東路', '一段', '1號'],
    ['臺北市', '信義區', '110', '市府路1號', '市府路', undefined, '1號'],
    ['新北市', '板橋區', '220', '中山路一段161號', '中山路', '一段', '161號'],
    ['桃園市', '桃園區', '330', '縣府路1號', '縣府路', undefined, '1號'],
    ['臺中市', '西屯區', '407', '台灣大道三段99號', '台灣大道', '三段', '99號'],
    ['臺南市', '安平區', '708', '永華路二段6號', '永華路', '二段', '6號'],
    ['高雄市', '苓雅區', '802', '四維三路2號', '四維三路', undefined, '2號'],
    ['基隆市', '中正區', '202', '義一路1號', '義一路', undefined, '1號'],
    ['新竹市', '北區', '300', '中正路120號', '中正路', undefined, '120號'],
    ['嘉義市', '東區', '600', '中山路199號', '中山路', undefined, '199號'],
    ['嘉義市', '西區', '600', '中興路353號', '中興路', undefined, '353號'],
    ['宜蘭縣', '宜蘭市', '260', '縣政北路1號', '縣政北路', undefined, '1號'],
    ['新竹縣', '竹北市', '302', '光明六路10號', '光明六路', undefined, '10號'],
    ['苗栗縣', '苗栗市', '360', '縣府路100號', '縣府路', undefined, '100號'],
    ['彰化縣', '彰化市', '500', '中山路二段416號', '中山路', '二段', '416號'],
    ['南投縣', '南投市', '540', '中興路660號', '中興路', undefined, '660號'],
    ['雲林縣', '斗六市', '640', '雲林路二段515號', '雲林路', '二段', '515號'],
    ['嘉義縣', '民雄鄉', '621', '建國路二段285號', '建國路', '二段', '285號'],
    ['屏東縣', '屏東市', '900', '自由路527號', '自由路', undefined, '527號'],
    ['臺東縣', '臺東市', '950', '中山路276號', '中山路', undefined, '276號'],
    ['花蓮縣', '花蓮市', '970', '府前路17號', '府前路', undefined, '17號'],
    ['澎湖縣', '馬公市', '880', '治平路32號', '治平路', undefined, '32號'],
    ['金門縣', '金城鎮', '893', '民生路60號', '民生路', undefined, '60號'],
  ])('%s%s%s', (county, district, zip3, tail, road, section, number) => {
    const address = `${county}${district}${tail}`;
    const result = parse(address);
    expect(result).toMatchObject({ county, district, zip3, road, number, valid: true, warnings: [], normalized: address });
    expect(result.section).toBe(section);
    expect(result.zip).toBeUndefined();
    expect(format(result, { zip: true })).toBe(zip3 + address);
  });

  it('parses a rural village address with no road', () => {
    expect(parse('連江縣南竿鄉介壽村76號')).toMatchObject({
      county: '連江縣', district: '南竿鄉', zip3: '209', village: '介壽村', number: '76號', valid: true,
    });
  });
});

describe('address components', () => {
  it('parses every component, canonicalizes width, and preserves the extended code', () => {
    expect(parse('Taiwan (R.O.C.) １０６－００３台北市大安區光明里二十三鄰忠孝東路４段二十三巷五弄十二之三號五樓之二')).toEqual({
      zip: '106003', zip3: '106', county: '臺北市', district: '大安區', village: '光明里', neighborhood: '23鄰',
      road: '忠孝東路', section: '四段', lane: '23巷', alley: '5弄', number: '12之3號', floor: '5樓', room: '之2',
      normalized: '106003臺北市大安區光明里23鄰忠孝東路四段23巷5弄12之3號5樓之2', valid: true, warnings: [],
    });
  });

  it.each([
    ['12-3號5F', { number: '12之3號', floor: '5樓' }],
    ['12號5f', { number: '12號', floor: '5樓' }],
    ['12號B1', { number: '12號', floor: '地下1樓' }],
    ['12號地下二樓', { number: '12號', floor: '地下2樓' }],
    ['12號五樓之二', { floor: '5樓', room: '之2' }],
    ['12號5樓之2室', { floor: '5樓', room: '之2室' }],
    ['12號5樓501室', { floor: '5樓', room: '501室' }],
    ['12號5樓A室', { floor: '5樓', room: 'A室' }],
    ['12號5樓A1室', { floor: '5樓', room: 'A1室' }],
    ['12號之3', { number: '12之3號' }],
    ['十二號之三之四', { number: '12之3之4號', valid: true }],
    ['12-1號之2', { number: '12之1之2號' }],
    ['12號5F-2', { floor: '5樓', room: '之2' }],
    ['12號5樓-2', { floor: '5樓', room: '之2' }],
    ['12號地下1樓-2', { floor: '地下1樓', room: '之2' }],
    ['12號B1-2', { floor: '地下1樓', room: '之2' }],
    ['12號5F之2', { floor: '5樓', room: '之2' }],
    ['12號地下一樓之二', { floor: '地下1樓', room: '之2' }],
    ['12號B1樓', { floor: '地下1樓' }],
  ])('handles %s', (tail, fields) => {
    const result = parse(`臺北市大安區和平東路二段${tail}`);
    expect(result).toMatchObject({ ...fields, valid: true, warnings: [] });
    expect(parse(result.normalized)).toEqual(result);
  });

  it.each(['萬里路', '大村路', '八里大道', '三民街', '經貿大道', '環河道', '14街'])('handles road %s', (road) => {
    const result = parse(`新北市板橋區${road}1號`);
    expect(result).toMatchObject({ road, number: '1號', valid: true });
    expect(result.village).toBeUndefined();
  });

  it('preserves a trailing building annotation and reports it', () => {
    const result = parse('臺北市大安區和平東路二段12號5樓（服務中心）');
    expect(result.rest).toBe('(服務中心)');
    expect(result.warnings).toEqual(['UNPARSED_TEXT']);
    expect(result.valid).toBe(false);
    expect(result.normalized).toBe('臺北市大安區和平東路二段12號5樓(服務中心)');
  });

  it('preserves Latin notes and supports canonical round trips', () => {
    const first = parse('106臺北市大安區和平東路12號   Building A');
    expect(first.rest).toBe('Building A');
    expect(parse(first.normalized)).toEqual(first);
    expect(format(first, { zip: false })).toBe('臺北市大安區和平東路12號 Building A');
  });
});

describe('postal prefixes and administrative inference', () => {
  it.each(['106', '10603', '106003', '106 - 03', '106 - 003'])('retains %s before a numeric address', (prefix) => {
    const zip = prefix.replace(/[\s-]/g, '');
    for (const tail of ['12號', '14街1號']) {
      const result = parse(`${prefix} ${tail}`);
      expect(result).toMatchObject({ zip, zip3: '106', county: '臺北市', district: '大安區', valid: true, warnings: [] });
      expect(result.number).toBe(tail === '12號' ? '12號' : '1號');
      expect(result.road).toBe(tail === '12號' ? undefined : '14街');
      expect(parse(result.normalized)).toEqual(result);
    }
  });

  it('retains ZIP boundaries when an unknown code cannot supply administration', () => {
    const result = parse('999 14街1號');
    expect(result).toMatchObject({ zip: '999', road: '14街', number: '1號', normalized: '999 14街1號' });
    expect(parse(result.normalized)).toEqual(result);
  });

  it.each(['106', '10603', '106003', '106-003', '106-03'])('preserves postal prefix %s', (zip) => {
    const result = parse(`${zip}台北市大安區金山南路2段55號`);
    expect(result).toMatchObject({ zip: zip.replace('-', ''), zip3: '106', county: '臺北市', district: '大安區', valid: true });
  });
  it('infers a unique county without a zip', () => {
    expect(parse('板橋區中山路1號')).toMatchObject({ county: '新北市', district: '板橋區', zip3: '220', valid: true });
  });
  it('retains ambiguity without guessing a county', () => {
    const result = parse('信義區市府路1號');
    expect(result.county).toBeUndefined();
    expect(result.zip3).toBeUndefined();
    expect(result).toMatchObject({ district: '信義區', road: '市府路', number: '1號', valid: false });
    expect(result.warnings).toEqual(['AMBIGUOUS_DISTRICT', 'MISSING_COUNTY']);
  });
  it.each([['110', '臺北市'], ['201', '基隆市']])('uses %s to disambiguate 信義區', (zip, county) => {
    expect(parse(`${zip}信義區市府路1號`)).toMatchObject({ county, district: '信義區', valid: true, warnings: [] });
  });
  it('infers administration from a unique code', () => {
    expect(parse('106忠孝東路四段12號')).toMatchObject({ county: '臺北市', district: '大安區', valid: true });
  });
  it('retains a shared code without inventing a district', () => {
    const result = parse('600中山路199號');
    expect(result).toMatchObject({ county: '嘉義市', zip: '600', zip3: '600', valid: false });
    expect(result.district).toBeUndefined();
    expect(result.warnings).toContain('AMBIGUOUS_DISTRICT');
  });
  it.each(['嘉義市東區', '嘉義市西區', '600東區', '600西區', '300東區', '300北區', '300香山區'])('accepts shared-code district %s', (prefix) => {
    expect(parse(`${prefix}中山路1號`).valid).toBe(true);
  });
  it('checks the first three digits without validating the suffix', () => {
    expect(parse('106999臺北市大安區金山南路二段55號')).toMatchObject({ zip: '106999', valid: true });
    const result = parse('100003臺北市大安區金山南路二段55號');
    expect(result).toMatchObject({ zip: '100003', zip3: '100', valid: false });
    expect(result.warnings).toEqual(['ZIP_DISTRICT_MISMATCH']);
  });
  it('does not discard an ambiguous district when the zip conflicts', () => {
    const result = parse('106信義區市府路1號');
    expect(result.county).toBeUndefined();
    expect(result.district).toBe('信義區');
    expect(result.warnings).toContain('ZIP_DISTRICT_MISMATCH');
  });
  it.each(['123號', '12345號', '123456號', '123之4號'])('does not read %s as a zip', (number) => {
    expect(parse(number).zip).toBeUndefined();
    expect(parse(number).number).toBe(number);
  });
});

describe('legacy upgrades', () => {
  it.each([
    ['臺灣省臺北縣板橋市中山路一段161號', '新北市板橋區中山路一段161號', '220'],
    ['台灣省台北縣板橋市中山路一段161號', '新北市板橋區中山路一段161號', '220'],
    ['福建省金門縣金城鎮民生路60號', '金門縣金城鎮民生路60號', '893'],
    ['福建省連江縣南竿鄉介壽村76號', '連江縣南竿鄉介壽村76號', '209'],
  ])('accepts province prefix %s', (input, normalized, zip3) => {
    expect(parse(input)).toMatchObject({ normalized, zip3, valid: true, warnings: [] });
  });

  it.each([
    ['臺北縣板橋市', '新北市板橋區', '220'],
    ['台北縣淡水鎮', '新北市淡水區', '251'],
    ['臺北縣烏來鄉', '新北市烏來區', '233'],
    ['臺中縣豐原市', '臺中市豐原區', '420'],
    ['臺中縣清水鎮', '臺中市清水區', '436'],
    ['臺中縣和平鄉', '臺中市和平區', '424'],
    ['臺南縣新營市', '臺南市新營區', '730'],
    ['臺南縣麻豆鎮', '臺南市麻豆區', '721'],
    ['臺南縣仁德鄉', '臺南市仁德區', '717'],
    ['高雄縣鳳山市', '高雄市鳳山區', '830'],
    ['高雄縣旗山鎮', '高雄市旗山區', '842'],
    ['高雄縣大寮鄉', '高雄市大寮區', '831'],
    ['桃園縣桃園市', '桃園市桃園區', '330'],
    ['桃園縣中壢市', '桃園市中壢區', '320'],
    ['桃園縣蘆竹鄉', '桃園市蘆竹區', '338'],
    ['桃園縣蘆竹市', '桃園市蘆竹區', '338'],
    ['桃園縣大溪鎮', '桃園市大溪區', '335'],
    ['桃園縣復興鄉', '桃園市復興區', '336'],
  ])('%s becomes %s', (legacy, current, zip3) => {
    const result = parse(`${legacy}中正路1號`);
    expect(result).toMatchObject({ normalized: `${current}中正路1號`, zip3, valid: true });
  });
  it('does not upgrade unrelated municipalities', () => {
    expect(parse('新竹縣竹北市光明六路10號')).toMatchObject({ district: '竹北市', valid: true });
    expect(parse('苗栗縣竹南鎮中正路1號')).toMatchObject({ district: '竹南鎮', valid: true });
  });
});

describe('invalid and incomplete input', () => {
  it.each([
    '零段1號', '0段1號', '0巷1號', '00巷1號', '23之0巷1號', '23巷0弄1號', '23巷5之0弄1號',
    '12之0號', '12之00號', '12之3之0號', '12號0樓', '12號地下0樓', '12號5之0樓',
    '12號0室', '12號5樓之0', '12號5樓之0室', '12號5樓00室',
  ])('reports zero component in %s', (tail) => {
    expect(parse(`臺北市大安區中山路${tail}`)).toMatchObject({ valid: false, warnings: ['INVALID_COMPONENT'] });
  });

  it.each(['10巷20弄101號10樓101室', '12號5樓A0室', '12號5樓0A室', '12號5樓之10'])('accepts nonzero values and room identifiers in %s', (tail) => {
    expect(parse(`臺北市大安區中山路${tail}`)).toMatchObject({ valid: true, warnings: [] });
  });

  it.each(['0', '00', '零'])('reports zero neighborhood %s', (value) => {
    expect(parse(`臺北市大安區光明里${value}鄰中山路1號`)).toMatchObject({
      valid: false, warnings: ['INVALID_COMPONENT'],
    });
  });

  it.each(['106 - 0034', '106 - 003 - 1', '106-003-1'])('does not truncate malformed postal prefix %s', (prefix) => {
    const result = parse(`${prefix} 臺北市大安區中山路1號`);
    expect(result.zip).toBeUndefined();
    expect(result.valid).toBe(false);
    expect(result.warnings).toContain('INVALID_POSTAL_CODE');
  });

  it.each(['', ' \t\n', '台灣', '中華民國', 'Taiwan (R.O.C.)'])('handles empty address %s', (input) => {
    expect(parse(input)).toEqual({ normalized: '', valid: false, warnings: ['EMPTY_INPUT'] });
  });
  it.each(['hello world', '🦄???', '!@#$%^&*()', 'nonsense 123'])('preserves garbage %s', (input) => {
    const result = parse(input);
    expect(result.rest).toBe(input);
    expect(result.valid).toBe(false);
    expect(result.warnings).toEqual(['UNPARSED_TEXT', 'MISSING_COUNTY', 'MISSING_DISTRICT', 'MISSING_NUMBER']);
  });
  it.each(['1060臺北市大安區金山南路55號', '1060000臺北市大安區金山南路55號', '106-0000臺北市大安區金山南路55號'])('reports malformed zip %s', (input) => {
    expect(parse(input).valid).toBe(false);
    expect(parse(input).zip).toBeUndefined();
    expect(parse(input).warnings).toContain('INVALID_POSTAL_CODE');
  });
  it('reports unknown three-digit prefixes', () => {
    const result = parse('999臺北市大安區金山南路55號');
    expect(result.warnings).toContain('UNKNOWN_ZIP3');
    expect(result.warnings).toContain('ZIP_DISTRICT_MISMATCH');
    expect(result.zip).toBe('999');
  });
  it.each([
    ['臺北市不存在區中山路1號', 'UNKNOWN_DISTRICT'],
    ['不存在縣不存在區中山路1號', 'UNKNOWN_COUNTY'],
    ['臺北市中正路1號', 'MISSING_DISTRICT'],
    ['忠孝東路四段12號', 'MISSING_COUNTY'],
    ['臺北市大安區忠孝東路四段', 'MISSING_NUMBER'],
    ['臺北市大安區中山路0號', 'INVALID_COMPONENT'],
    ['臺北市大安區中山路0之3號', 'INVALID_COMPONENT'],
    ['臺北市大安區中山路1號0樓', 'INVALID_COMPONENT'],
    ['臺北市大安區中山路-1號', 'UNPARSED_TEXT'],
    ['臺北市大安區中山路1號5樓之', 'UNPARSED_TEXT'],
  ])('reports incomplete or invalid %s', (input, warning) => {
    expect(parse(input).valid).toBe(false);
    expect(parse(input).warnings).toContain(warning);
  });
  it('never drops unmatched middle text', () => {
    const result = parse('臺北市大安區未知地標12號5樓');
    expect(result.rest).toBe('未知地標12號5樓');
    expect(result.normalized).toBe('臺北市大安區未知地標12號5樓');
  });
  it('does not hang or truncate a long unrecognized value', () => {
    const value = '!'.repeat(20000);
    expect(parse(value).rest).toBe(value);
  });
  it.each([null, undefined, 123, {}, []])('rejects non-string input %s', (value) => {
    expect(() => parse(value as unknown as string)).toThrow(TypeError);
  });
});

describe('administrative suffixes within names', () => {
  it.each(['工業區一路', '工業區三十八路'])('preserves road %s when the district is omitted', (road) => {
    expect(parse(`臺中市${road}1號`)).toMatchObject({
      county: '臺中市', road, number: '1號', valid: false, warnings: ['MISSING_DISTRICT'],
    });
    expect(parse(`臺中市${road}1號`).district).toBeUndefined();
    expect(parse(`臺中市西屯區${road}1號`)).toMatchObject({
      county: '臺中市', district: '西屯區', road, number: '1號', valid: true, warnings: [],
    });
    expect(parse(`${road}1號`)).toMatchObject({
      road, number: '1號', warnings: ['MISSING_COUNTY', 'MISSING_DISTRICT'],
    });
  });

  it.each(['環南市場', '果菜市場', '士林夜市', '民生社區', '萬芳社區', '內湖園區'])('retains place name %s as unparsed text', (name) => {
    const result = parse(`臺北市${name}1號`);
    expect(result.district).toBeUndefined();
    expect(result).toMatchObject({ county: '臺北市', rest: `${name}1號`, valid: false });
    expect(result.warnings).not.toContain('UNKNOWN_DISTRICT');
  });

  it.each(['岡山鎮路', '東港鎮路', '北區路'])('does not infer administration from road %s', (road) => {
    const result = parse(`${road}1號`);
    expect(result).toMatchObject({ road, number: '1號', warnings: ['MISSING_COUNTY', 'MISSING_DISTRICT'] });
    expect(result.district).toBeUndefined();
    expect(result.county).toBeUndefined();
  });

  it.each(['大道', '道路', '路一路'])('keeps known administration before road %s', (road) => {
    expect(parse(`臺北市大安區${road}1號`)).toMatchObject({
      county: '臺北市', district: '大安區', road, number: '1號', valid: true, warnings: [],
    });
  });

  it.each(['中山路', '民生路', '市府路'])('continues to retain unknown districts before %s without a county', (road) => {
    expect(parse(`不存在區${road}1號`)).toMatchObject({
      district: '不存在區', road, number: '1號', warnings: ['UNKNOWN_DISTRICT', 'MISSING_COUNTY'],
    });
  });

  it.each([
    ['新北市板橋區三民路2段1號', { road: '三民路', section: '二段', number: '1號' }],
    ['高雄市苓雅區四維三路二號', { road: '四維三路', number: '2號' }],
    ['連江縣南竿鄉四維村一鄰1號', { village: '四維村', neighborhood: '1鄰', number: '1號' }],
    ['新竹市北區鐵道路一段1號', { road: '鐵道路', section: '一段', number: '1號' }],
    ['新北市林口區文化2路1段1號', { road: '文化2路', section: '一段', number: '1號' }],
    ['新北市平溪區十分街1號', { road: '十分街', number: '1號' }],
    ['臺北市大同區迪化街一段1號', { road: '迪化街', section: '一段', number: '1號' }],
  ])('preserves existing name parsing for %s', (input, parts) => {
    expect(parse(input)).toMatchObject({ ...parts, valid: true, warnings: [] });
  });
});
