import type { AddressParts, FormatOptions } from './types.js';

/**
 * Join normalized address parts in postal order, preserving unparsed text.
 * By default preserves only an input zip; { zip: true } also uses an inferred zip3.
 * Components supplied by callers should already be normalized and include suffixes.
 * @throws TypeError when address is null or not an object.
 */
export function format(address: Readonly<AddressParts>, options: FormatOptions = {}): string {
  if (address === null || typeof address !== 'object') throw new TypeError('address must be an object');
  const zip = options.zip === false ? '' : options.zip === true ? address.zip ?? address.zip3 : address.zip;
  const body = [address.county, address.district, address.village, address.neighborhood,
    address.road, address.section, address.lane, address.alley, address.number,
    address.floor, address.room].filter((part) => part !== undefined && part !== '').join('');
  // Retain a boundary before Latin notes, but avoid inserting spaces into Chinese addresses.
  const rest = address.rest ?? '';
  const separator = body && rest && /^[A-Za-z]/.test(rest) ? ' ' : '';
  const text = `${body}${separator}${rest}`;
  const postalSeparator = zip && /^\d/.test(text) ? ' ' : '';
  return `${zip ?? ''}${postalSeparator}${text}`;
}
