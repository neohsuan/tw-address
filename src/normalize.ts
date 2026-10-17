import { assertString, matchCounty, matchDistrict } from './admin.js';
import { arabic, chinese, NUMERAL } from './numerals.js';
import type { NormalizeOptions } from './types.js';

// A leading house number (123號) must not be mistaken for a postal prefix.
export const ZIP_PREFIX = /^(\d{3}(?:\s*-\s*\d{2,3}|\d{2,3})?)(?!\d|\s*-)(?=$|[^\d之號巷弄樓室Ff])/u;

function stripCountry(input: string): string {
  return input.replace(/^(?:(?:(?:臺灣省|台灣省|福建省)(?!大道|路|街|道)|(?:臺灣|台灣)(?!省|大道|路|街|道)|中華民國|Taiwan(?![A-Za-z])(?:\s*\(\s*R\.?\s*O\.?\s*C\.?\s*\))?)[\s,，:：]*)+/iu, '');
}

/**
 * Normalize width, administration aliases, whitespace and address numeral conventions.
 * Does not infer a county or ZIP, and preserves 台 in road/building names.
 * @throws TypeError when input is not a string.
 */
export function normalize(input: string, options: NormalizeOptions = {}): string {
  assertString(input);
  let text = stripCountry(input.normalize('NFKC').replace(/\s+/gu, ' ').trim());
  let zip = '';
  const postal = text.match(ZIP_PREFIX);
  if (postal) {
    zip = postal[1]!.replace(/[\s-]/g, '');
    text = stripCountry(text.slice(postal[0].length).replace(/^[\s,:]+/, ''));
  }
  // Extract the postal prefix before removing spaces between numeric tokens.
  text = text.replace(/([\p{Script=Han}\d])\s+(?=[\p{Script=Han}\d])/gu, '$1');
  const county = matchCounty(text);
  if (county) {
    const tail = text.slice(county.name.length);
    const district = matchDistrict(tail, county.county)[0];
    text = county.county + (district ? district.record.district + tail.slice(district.name.length) : tail);
  } else {
    const districts = matchDistrict(text);
    const canonical = new Set(districts.map(({ record }) => record.district));
    if (canonical.size === 1 && districts[0]) {
      text = districts[0].record.district + text.slice(districts[0].name.length);
    }
  }

  text = text.replace(/(\d+)\s*[Ff](?![A-Za-z])/g, '$1樓')
    .replace(/\b[Bb]\s*(\d+)(?:\s*[Ff樓])?(?![A-Za-z\d])/g, '地下$1樓')
    .replace(new RegExp(`([${NUMERAL}]+)段`, 'gu'), (_, value: string) => `${chinese(value)}段`)
    .replace(new RegExp(`([${NUMERAL}]+(?:[之-][${NUMERAL}]+)*)(巷|弄|號|樓|室|鄰)`, 'gu'), (_, value: string, suffix: string) =>
      value.split(/([之-])/u).map((part) => /^[之-]$/.test(part) ? part : arabic(part)).join('') + suffix)
    .replace(new RegExp(`樓([之-])([${NUMERAL}]+)`, 'gu'), (_, separator: string, value: string) =>
      `樓${separator === '-' && options.hyphenToZhi === false ? '-' : '之'}${arabic(value)}`)
    .replace(new RegExp(`(\\d+(?:[之-]\\d+)*)號((?:之[${NUMERAL}]+)+)`, 'gu'), (_, base: string, suffix: string) =>
      base + suffix.split('之').filter(Boolean).map((value) => `之${arabic(value)}`).join('') + '號');
  if (options.hyphenToZhi !== false) {
    text = text.replace(/\d+(?:[之-]\d+)+(?:巷|弄|號|樓|室)/g, (value) => value.replace(/-/g, '之'));
  }
  // Keep the ZIP distinct from a leading house number or numbered road on reparse.
  const separator = zip && /^\d/.test(text) ? ' ' : '';
  return `${zip}${separator}${text}`.replace(/\s+/gu, ' ').trim();
}
