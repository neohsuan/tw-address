const digitValues: Readonly<Record<string, number>> = {
  零: 0, 〇: 0, '○': 0, 一: 1, 壹: 1, 二: 2, 兩: 2, 貳: 2, 三: 3, 參: 3,
  四: 4, 肆: 4, 五: 5, 伍: 5, 六: 6, 陸: 6, 七: 7, 柒: 7, 八: 8, 捌: 8, 九: 9, 玖: 9,
};
const unitValues: Readonly<Record<string, number>> = { 十: 10, 拾: 10, 百: 100, 佰: 100, 千: 1000, 仟: 1000 };
export const NUMERAL = '0-9零〇○一二兩三四五六七八九十百千萬壹貳參肆伍陸柒捌玖拾佰仟廿卅卌';

/** Convert ordinary, positional and financial Chinese integers without touching names. */
export function arabic(value: string): string {
  if (/^\d+$/.test(value)) return value;
  const expanded = value.replace(/廿/g, '二十').replace(/卅/g, '三十').replace(/卌/g, '四十');
  if ([...expanded].every((char) => digitValues[char] !== undefined)) {
    return [...expanded].map((char) => digitValues[char]).join('').replace(/^0+(?=\d)/, '');
  }
  let total = 0;
  let group = 0;
  let digit: number | undefined;
  let pendingZero = false;
  let seenWan = false;
  let lastUnit = 10000;
  for (const char of expanded) {
    const nextDigit = digitValues[char];
    if (nextDigit !== undefined) {
      // Positional digit strings were handled above. Unit notation takes one
      // multiplier at a time; accumulating 十二三 would silently invent 33.
      if (digit !== undefined) return value;
      if (nextDigit === 0) {
        if (pendingZero || (group === 0 && total === 0)) return value;
        pendingZero = true;
      } else {
        digit = nextDigit;
        pendingZero = false;
      }
    } else if (char === '萬') {
      if (seenWan || pendingZero) return value;
      total += (group + (digit ?? 0) || 1) * 10000;
      group = 0;
      digit = undefined;
      lastUnit = 10000;
      seenWan = true;
    } else {
      const unit = unitValues[char];
      if (unit === undefined || unit >= lastUnit) return value;
      // Preserve the supported implicit ten in forms such as 一千零十.
      if (pendingZero && unit !== 10) return value;
      group += (digit ?? 1) * unit;
      digit = undefined;
      pendingZero = false;
      lastUnit = unit;
    }
  }
  if (pendingZero) return value;
  const result = total + group + (digit ?? 0);
  return Number.isSafeInteger(result) ? String(result) : value;
}

/** Postal sections conventionally use Chinese numerals; unusually large values stay lossless. */
export function chinese(value: string): string {
  const digits = arabic(value);
  const number = Number(digits);
  if (!/^\d+$/.test(digits) || number > 9999) return value;
  if (number === 0) return '零';
  const names = '零一二三四五六七八九';
  const units = ['', '十', '百', '千'];
  let output = '';
  let pendingZero = false;
  for (let power = 3; power >= 0; power--) {
    const digit = Math.floor(number / 10 ** power) % 10;
    if (digit === 0) {
      if (output) pendingZero = true;
      continue;
    }
    if (pendingZero) output += '零';
    pendingZero = false;
    output += `${digit === 1 && power === 1 && !output ? '' : names[digit]}${units[power]}`;
  }
  return output;
}
