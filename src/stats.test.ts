import { expect, test } from 'vitest';
import { hoursBetween, median } from './stats.js';

test('median: empty is null, odd takes the middle, even averages the two middles', () => {
  expect(median([])).toBeNull();
  expect(median([3, 1, 2])).toBe(2);
  expect(median([4, 1, 3, 2])).toBe(2.5);
});

test('hoursBetween: 2026-09-04T17:43:49Z to 18:07:16Z is 1407 seconds', () => {
  expect(hoursBetween('2026-09-04T17:43:49Z', '2026-09-04T18:07:16Z')).toBeCloseTo(1407 / 3600, 6);
});
