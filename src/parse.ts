import { lookupDistrict, lookupZip3, matchCounty, matchDistrict } from './admin.js';
import { format } from './format.js';
import { normalize, ZIP_PREFIX } from './normalize.js';
import type { AddressParts, ParsedAddress } from './types.js';

/**
 * Parse a Taiwan address using the bundled district table and ordered component grammar.
 * Unknown or ambiguous parts are preserved and reported through warning codes.
 * A valid result is structurally complete; delivery and extended ZIP suffixes are not verified.
 * @throws TypeError when input is not a string.
 */
export function parse(input: string): ParsedAddress {
  let remaining = normalize(input);
  const parts: AddressParts = {};
  const warnings: string[] = [];
  const warn = (code: string): void => { if (!warnings.includes(code)) warnings.push(code); };
  if (!remaining) return { normalized: '', valid: false, warnings: ['EMPTY_INPUT'] };

  const postal = remaining.match(ZIP_PREFIX);
  if (postal) {
    parts.zip = postal[1]!;
    parts.zip3 = parts.zip.slice(0, 3);
    remaining = remaining.slice(postal[0].length).replace(/^[\s,:]+/, '');
  } else if (/^(?:\d{4,}(?!\d)|\d{3}\s*-\s*\d)/u.test(remaining) && !/^\d+(?:之\d+)*[巷弄號樓室]/u.test(remaining)) {
    warn('INVALID_POSTAL_CODE');
  }
  const zipRecords = parts.zip3 ? lookupDistrict(parts.zip3) : [];
  if (parts.zip3 && zipRecords.length === 0) warn('UNKNOWN_ZIP3');

  const county = matchCounty(remaining);
  if (county) {
    parts.county = county.county;
    remaining = remaining.slice(county.name.length);
  }
  let matches = matchDistrict(remaining, parts.county);
  if (matches.length) {
    remaining = remaining.slice(matches[0]!.name.length);
    parts.district = matches[0]!.record.district;
    if (!parts.county && parts.zip3) {
      const compatible = matches.filter(({ record }) => record.zip3 === parts.zip3);
      if (compatible.length) matches = compatible;
      else warn('ZIP_DISTRICT_MISMATCH');
    }
    if (matches.length === 1) {
      parts.county = matches[0]!.record.county;
      parts.district = matches[0]!.record.district;
    } else warn('AMBIGUOUS_DISTRICT');
  } else {
    // Retain unknown administration as explicit fields rather than folding it into a road.
    if (!parts.county) {
      const unknownCounty = remaining.match(/^([\p{Script=Han}]{2,3}縣)/u);
      if (unknownCounty) {
        parts.county = unknownCounty[1]!;
        remaining = remaining.slice(unknownCounty[0].length);
        warn('UNKNOWN_COUNTY');
      }
    }
    const unknownDistrict = remaining.match(/^([\p{Script=Han}]{1,4}?[區鄉鎮市])/u);
    const candidate = unknownDistrict?.[0];
    // Common place nouns and numbered road names are not unknown districts.
    const placeName = candidate && /(?:(?:社|園|院|校|廠|特|風景|工業|加工|重劃|行政)區|(?:夜|超|門|都)市)$/u.test(candidate);
    const tail = candidate ? remaining.slice(candidate.length) : '';
    const roadOrPlaceTail = /^[\d零〇一二三四五六七八九十百千]*(?:大道|路|街|道)/u.test(tail) ||
      (candidate?.endsWith('市') && /^[場集]/u.test(tail));
    if (unknownDistrict && !placeName && !roadOrPlaceTail) {
      parts.district = unknownDistrict[1]!;
      remaining = remaining.slice(unknownDistrict[0].length);
      warn('UNKNOWN_DISTRICT');
    }
    if (!parts.county && zipRecords.length && !warnings.includes('UNKNOWN_COUNTY')) {
      const zipCounties = new Set(zipRecords.map((record) => record.county));
      if (zipCounties.size === 1) parts.county = zipRecords[0]!.county;
    }
    if (!parts.district) {
      const compatible = zipRecords.filter((record) => !parts.county || record.county === parts.county);
      if (compatible.length === 1) parts.district = compatible[0]!.district;
      else if (compatible.length > 1) warn('AMBIGUOUS_DISTRICT');
    }
  }

  if (parts.county && parts.district) {
    const expected = lookupZip3(parts.county, parts.district);
    if (expected) {
      if (parts.zip3 && parts.zip3 !== expected) warn('ZIP_DISTRICT_MISMATCH');
      parts.zip3 ??= expected;
    } else warn('UNKNOWN_DISTRICT');
  }
  if (parts.county && parts.zip3 && zipRecords.length && !zipRecords.some((record) => record.county === parts.county)) {
    warn('ZIP_DISTRICT_MISMATCH');
  }

  const take = (key: keyof AddressParts, pattern: RegExp): boolean => {
    const match = remaining.match(pattern);
    if (!match) return false;
    parts[key] = match[0];
    remaining = remaining.slice(match[0].length).trimStart();
    return true;
  };
  // A village suffix immediately followed by a road suffix is part of the road name.
  const village = remaining.match(/^([\p{Script=Han}]+?[里村])/u)?.[0];
  if (village && !/^(?:大道|路|街|道)/u.test(remaining.slice(village.length))) {
    take('village', /^[\p{Script=Han}]+?[里村]/u);
  }
  take('neighborhood', /^\d+鄰/u);
  take('road', /^[\p{Script=Han}A-Za-z\d·・]+?(?:大道|路|街|道)(?=[\d零〇一二三四五六七八九十百千]|$|\s|[^\p{Script=Han}A-Za-z\d])/u);
  take('section', /^[零〇一二三四五六七八九十百千]+段/u);
  take('lane', /^\d+(?:之\d+)*巷/u);
  take('alley', /^\d+(?:之\d+)*弄/u);
  take('number', /^\d+(?:之\d+)*號/u);
  take('floor', /^(?:地下)?\d+(?:之\d+)*樓/u);
  take('room', parts.floor
    ? /^(?:之\d+(?:室)?|[A-Za-z]?\d+[A-Za-z]?室|[A-Za-z]+室)/u
    : /^(?:[A-Za-z]?\d+[A-Za-z]?室|[A-Za-z]+室)/u);
  if (remaining) {
    parts.rest = remaining;
    warn('UNPARSED_TEXT');
  }
  if (!parts.county) warn('MISSING_COUNTY');
  if (!parts.district) warn('MISSING_DISTRICT');
  if (!parts.number) warn('MISSING_NUMBER');
  if (parts.section === '零段' ||
    [parts.neighborhood, parts.lane, parts.alley, parts.number, parts.floor, parts.room].some((part) =>
      part !== undefined && /^(?:地下)?(?:之)?\d+(?:之\d+)*(?:鄰|巷|弄|號|樓|室)?$/u.test(part) &&
      /(?:^|地下|之)0+(?=之|[^\d]|$)/u.test(part))) {
    warn('INVALID_COMPONENT');
  }
  return { ...parts, normalized: format(parts), valid: warnings.length === 0, warnings };
}
