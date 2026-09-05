import { expect, test } from 'vitest';
import { NOT_MEASURED, count, day, quantity, rate } from './format.js';

test('an empty denominator prints not measured, never 0 or NaN; time to restore can never read as zero', () => {
  expect([rate(0, 0), count(0, 0), quantity(null, 'h'), quantity(Number.NaN, 'h')]).toEqual([NOT_MEASURED, NOT_MEASURED, NOT_MEASURED, NOT_MEASURED]);
  expect(rate(0, 0)).not.toMatch(/0/);
});

test('a rate under 10 events prints as a count, at 10 or more as a percentage with the count', () => {
  expect(rate(1, 2)).toBe('1 of 2');
  expect(rate(9, 9)).toBe('9 of 9');
  expect(rate(3, 12)).toBe('25.0% (3 of 12)');
  expect(count(0, 1)).toBe('0 of 1');
  expect(quantity(13.446, 'h')).toBe('13.4 h');
  expect(day('2026-09-04T18:07:16Z')).toBe('2026-09-04');
});
