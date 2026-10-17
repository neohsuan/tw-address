import { DISTRICTS } from './data.generated.js';
import { NUMERAL } from './numerals.js';
import type { DistrictRecord } from './types.js';

export const COUNTY_ALIASES: Readonly<Record<string, string>> = {
  臺北縣: '新北市', 桃園縣: '桃園市', 臺中縣: '臺中市', 臺南縣: '臺南市', 高雄縣: '高雄市',
};

// Actual former town/city names, restricted to the five municipal upgrades.
// Existing urban districts and unrelated counties are deliberately excluded.
export const LEGACY_DISTRICTS: Readonly<Record<string, readonly string[]>> = {
  新北市: '板橋市 三重市 中和市 永和市 新莊市 新店市 樹林市 鶯歌鎮 三峽鎮 淡水鎮 汐止市 瑞芳鎮 土城市 蘆洲市 五股鄉 泰山鄉 林口鄉 深坑鄉 石碇鄉 坪林鄉 三芝鄉 石門鄉 八里鄉 平溪鄉 雙溪鄉 貢寮鄉 金山鄉 萬里鄉 烏來鄉'.split(' '),
  臺中市: '豐原市 大里市 太平市 東勢鎮 大甲鎮 清水鎮 沙鹿鎮 梧棲鎮 后里鄉 神岡鄉 潭子鄉 大雅鄉 新社鄉 石岡鄉 外埔鄉 大安鄉 烏日鄉 大肚鄉 龍井鄉 霧峰鄉 和平鄉'.split(' '),
  臺南市: '新營市 永康市 鹽水鎮 白河鎮 麻豆鎮 佳里鎮 新化鎮 善化鎮 學甲鎮 柳營鄉 後壁鄉 東山鄉 下營鄉 六甲鄉 官田鄉 大內鄉 西港鄉 七股鄉 將軍鄉 北門鄉 新市鄉 安定鄉 山上鄉 玉井鄉 楠西鄉 南化鄉 左鎮鄉 仁德鄉 歸仁鄉 關廟鄉 龍崎鄉'.split(' '),
  高雄市: '鳳山市 岡山鎮 旗山鎮 美濃鎮 林園鄉 大寮鄉 大樹鄉 仁武鄉 大社鄉 鳥松鄉 橋頭鄉 燕巢鄉 田寮鄉 阿蓮鄉 路竹鄉 湖內鄉 茄萣鄉 永安鄉 彌陀鄉 梓官鄉 六龜鄉 甲仙鄉 杉林鄉 內門鄉 茂林鄉 桃源鄉 那瑪夏鄉'.split(' '),
  桃園市: '桃園市 中壢市 平鎮市 八德市 楊梅市 大溪鎮 蘆竹市 蘆竹鄉 大園鄉 龜山鄉 龍潭鄉 新屋鄉 觀音鄉 復興鄉'.split(' '),
};

export function assertString(value: unknown, name = 'input'): asserts value is string {
  if (typeof value !== 'string') throw new TypeError(`${name} must be a string`);
}

/** Replace 台 only within administration aliases, never globally in road/building names. */
export function canonicalCounty(county: string): string {
  const name = county.normalize('NFKC').trim().replace(/台/g, '臺');
  return COUNTY_ALIASES[name] ?? name;
}

export function canonicalDistrict(county: string, district: string): string {
  const name = district.normalize('NFKC').trim().replace(/台/g, '臺');
  return LEGACY_DISTRICTS[county]?.includes(name) ? `${name.slice(0, -1)}區` : name;
}

export const counties = [...new Set(DISTRICTS.map((record) => record.county))];
export const countyNames = [...counties, ...Object.keys(COUNTY_ALIASES)].sort((a, b) => b.length - a.length);

interface DistrictName {
  name: string;
  record: DistrictRecord;
}
export const districtNames: readonly DistrictName[] = DISTRICTS.flatMap((record) => [
  { name: record.district, record },
  ...(LEGACY_DISTRICTS[record.county] ?? [])
    .filter((name) => canonicalDistrict(record.county, name) === record.district)
    .map((name) => ({ name, record })),
]).sort((a, b) => b.name.length - a.name.length);

export function matchCounty(input: string): { name: string; county: string } | undefined {
  const name = countyNames.find((candidate) => input.startsWith(candidate) || input.startsWith(candidate.replace(/臺/g, '台')));
  return name ? { name, county: canonicalCounty(name) } : undefined;
}

// A lone 路/街/道 cannot form a road name after an administrative prefix.
// Longer names such as 大道 and 道路 can, so retain their district matches.
const bareRoadSuffix = new RegExp(`^[路街道](?=$|[${NUMERAL}]+(?:[之-][${NUMERAL}]+)*[段巷弄號樓室鄰])`, 'u');

export function matchDistrict(input: string, county?: string): DistrictName[] {
  const matches = districtNames.filter(({ name, record }) =>
    (!county || county === record.county) &&
    (input.startsWith(name) || input.startsWith(name.replace(/臺/g, '台'))) &&
    !bareRoadSuffix.test(input.slice(name.length)));
  const length = matches[0]?.name.length;
  return matches.filter(({ name }) => name.length === length);
}

/** Look up a district's three-digit code; accepts 台 aliases and supported legacy names. */
export function lookupZip3(county: string, district: string): string | undefined {
  assertString(county, 'county');
  assertString(district, 'district');
  const canonical = canonicalCounty(county);
  const name = canonicalDistrict(canonical, district);
  return DISTRICTS.find((record) => record.county === canonical && record.district === name)?.zip3;
}

/** Return all matching districts. Shared codes such as 300 and 600 retain every district. */
export function lookupDistrict(zip3: string): DistrictRecord[] {
  assertString(zip3, 'zip3');
  const code = zip3.normalize('NFKC').trim();
  return /^\d{3}$/.test(code) ? DISTRICTS.filter((record) => record.zip3 === code).map((record) => ({ ...record })) : [];
}

/** List the 22 counties/cities in source order. A fresh array is returned on each call. */
export function listCounties(): string[] {
  return [...counties];
}

/** List a county's district names in source order; unknown counties return an empty array. */
export function listDistricts(county: string): string[] {
  assertString(county, 'county');
  const canonical = canonicalCounty(county);
  return DISTRICTS.filter((record) => record.county === canonical).map((record) => record.district);
}
