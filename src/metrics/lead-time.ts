import { NOT_MEASURED, quantity } from '../format.js';
import { hoursBetween, median } from '../stats.js';
import type { Metric } from '../types.js';
import { line, mergedInWindow } from './shared.js';

export const leadTime: Metric = {
  id: 'lead-time',
  title: 'Lead time',
  definition: 'Median hours from a pull request being merged to the first verified release published after it in the same repository, over merged PRs in the window. Not measured until 3 PRs qualify.',
  gaming: 'Release after every merge. Hold work in branches so it never counts as merged.',
  crossCheck: 'Release debt (merged PRs in no verified release) and median PR cycle time (created to merged) are shown beside it.',
  compute(data) {
    const hours: number[] = [];
    const cycle: number[] = [];
    let debt = 0;
    for (const repo of data.repos) {
      const verifiedAt = repo.releases.filter((r) => r.verification.ok).map((r) => r.publishedAt).sort();
      for (const pr of mergedInWindow(repo, data)) {
        cycle.push(hoursBetween(pr.createdAt, pr.mergedAt));
        const next = verifiedAt.find((at) => at > pr.mergedAt);
        if (next === undefined) debt += 1;
        else hours.push(hoursBetween(pr.mergedAt, next));
      }
    }
    const measured = hours.length >= 3;
    return {
      headline: measured ? quantity(median(hours), 'h') : NOT_MEASURED,
      rows: [line(measured ? `median over ${String(hours.length)} PRs` : `${String(hours.length)} of the 3 PRs needed qualify`)],
      crossCheck: [
        line(`release debt: ${String(debt)} merged PRs in no verified release`),
        line(`PR cycle time, created to merged: median ${quantity(median(cycle), 'h')} over ${String(cycle.length)} PRs`),
      ],
    };
  },
};
