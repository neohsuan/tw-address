import { describe, expect, it } from 'vitest';
import { arabic, chinese } from '../src/numerals.js';

describe('Chinese address numerals', () => {
  it.each([
    ['一百二', '102'], ['二百五', '205'], ['一千零二', '1002'], ['一萬零二百', '10200'],
    ['壹仟零貳拾', '1020'], ['一千零一十', '1010'], ['一千零十', '1010'],
    ['一百零十', '110'], ['一十', '10'], ['廿', '20'], ['卅', '30'], ['卌', '40'],
    ['一〇二', '102'], ['十萬', '100000'], ['萬', '10000'], ['百', '100'],
  ])('keeps supported conversion %s → %s', (input, expected) => {
    expect(arabic(input)).toBe(expected);
  });

  it.each(['零十', '零百', '零萬', '一萬萬', '一萬二萬', '十二三', '一百二三', '一千二三四', '二十二三', '三2', '一百零'])('retains invalid numeral %s', (input) => {
    expect(arabic(input)).toBe(input);
    expect(chinese(input)).toBe(input);
  });

  it('round trips every supported section numeral', () => {
    for (let value = 0; value <= 9999; value++) {
      expect(arabic(chinese(String(value)))).toBe(String(value));
    }
  });
});
