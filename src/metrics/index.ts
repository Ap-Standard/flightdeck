/**
 * The five tiles plus time to restore, in display order. Time to restore lives here rather than in
 * its own module because it has no data: no production service exists in this portfolio. The tile
 * exists so the definition is public before the first regression, printed through the same function.
 */
import { rate } from '../format.js';
import type { Collected, Computed, Metric } from '../types.js';
import { changeFailure } from './change-failure.js';
import { gateBypass } from './gate-bypass.js';
import { leadTime } from './lead-time.js';
import { reliability } from './reliability.js';
import { line } from './shared.js';
import { verifiedReleases } from './verified-releases.js';

export const timeToRestore: Metric = {
  id: 'time-to-restore',
  title: 'Time to restore',
  definition: 'Median hours from a verified release that introduced a regression to the verified release that restored service. No production service exists in this portfolio, so the set is empty. The definition activates on the first regression.',
  gaming: 'Report zero.',
  crossCheck: 'format.ts prints "not measured" for an empty set and never prints 0 for a rate with no denominator; a test holds it there.',
  compute: () => ({ headline: rate(0, 0), rows: [line('No production service to restore. The tile activates on the first regression.')], crossCheck: [] }),
};

export const METRICS: readonly Metric[] = [verifiedReleases, leadTime, gateBypass, changeFailure, reliability, timeToRestore];

export const computeAll = (data: Collected): Computed[] => METRICS.map((metric) => ({ metric, out: metric.compute(data) }));
