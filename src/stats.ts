/** Median and the duration helper. Empty input returns null, never NaN. */
export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const upper = sorted[mid] ?? 0;
  return sorted.length % 2 === 1 ? upper : ((sorted[mid - 1] ?? 0) + upper) / 2;
}

export const hoursBetween = (from: string, to: string): number => (Date.parse(to) - Date.parse(from)) / 3_600_000;
