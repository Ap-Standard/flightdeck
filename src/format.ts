/**
 * The two printing rules, in one place, so no tile can bypass them: an empty set prints
 * "not measured", never 0 and never NaN; a rate over fewer than 10 events prints as a
 * count, because a percentage over five events reads as precision it does not have.
 */
export const NOT_MEASURED = 'not measured';

export function rate(n: number, m: number): string {
  if (m <= 0) return NOT_MEASURED;
  if (m < 10) return `${String(n)} of ${String(m)}`;
  return `${((100 * n) / m).toFixed(1)}% (${String(n)} of ${String(m)})`;
}

export const count = (n: number, m: number): string => (m <= 0 ? NOT_MEASURED : `${String(n)} of ${String(m)}`);

export const quantity = (value: number | null, unit: string): string =>
  value === null || !Number.isFinite(value) ? NOT_MEASURED : `${value.toFixed(1)} ${unit}`;

/** The UTC date of an ISO timestamp. */
export const day = (iso: string): string => iso.slice(0, 10);
