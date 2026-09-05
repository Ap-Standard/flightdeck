import { count, rate } from '../format.js';
import type { Line, Metric, PullRequest } from '../types.js';
import { line, mergedInWindow, verifiedInWindow } from './shared.js';

const SEVEN_DAYS = 7 * 86_400_000;

export const changeFailure: Metric = {
  id: 'change-failure',
  title: 'Change failure',
  definition: 'Verified releases in the window followed within 7 days by a merged PR labeled type:bug in the same repository, printed as "n of m".',
  gaming: 'Leave fixes unlabeled. Label them after day 7.',
  crossCheck: 'Label coverage of merged PRs, and PRs with "fix" in the title that carry no type:bug label, listed with links.',
  compute(data) {
    let failed = 0;
    let total = 0;
    const rows: Line[] = [];
    const merged: PullRequest[] = [];
    const fixNoLabel: Line[] = [];
    for (const repo of data.repos) {
      const prs = mergedInWindow(repo, data);
      merged.push(...prs);
      const verified = verifiedInWindow(repo, data);
      const repoFailed = verified.filter((release) => {
        const deadline = new Date(Date.parse(release.publishedAt) + SEVEN_DAYS).toISOString();
        return repo.pullRequests.some((pr) => pr.labels.includes('type:bug') && pr.mergedAt > release.publishedAt && pr.mergedAt <= deadline);
      }).length;
      failed += repoFailed;
      total += verified.length;
      rows.push(line(`${repo.name}: ${count(repoFailed, verified.length)}`));
      for (const pr of prs.filter((p) => /\bfix/i.test(p.title) && !p.labels.includes('type:bug'))) {
        fixNoLabel.push(line(`${repo.name} #${String(pr.number)}: fix in the title, no type:bug label`, pr.url));
      }
    }
    const typed = merged.filter((pr) => pr.labels.some((label) => label.startsWith('type:'))).length;
    return {
      headline: count(failed, total),
      rows,
      crossCheck: [line(`label coverage: ${rate(typed, merged.length)} merged PRs carry a type: label`), ...fixNoLabel],
    };
  },
};
