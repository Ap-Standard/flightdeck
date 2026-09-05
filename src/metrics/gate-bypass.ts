import { day, rate } from '../format.js';
import type { Decision, Metric, PullRequest, Repo } from '../types.js';
import { line, mergedInWindow } from './shared.js';

const TEXT: Record<Decision, string> = {
  block: 'twoseat decision block', pass: 'twoseat decision pass', 'blocking-disabled': 'twoseat blocking disabled',
  'not-reviewed': 'twoseat decision not-reviewed', 'no-decision-row': 'twoseat comment without a Decision row', 'no-comment': 'no twoseat comment',
};
const isBypass = (pr: PullRequest): boolean => pr.decision !== 'pass' && pr.decision !== 'blocking-disabled';

export const gateBypass: Metric = {
  id: 'gate-bypass',
  title: 'Gate-bypass rate',
  definition: 'Merged PRs carrying the gate-bypass label over merged PRs since the policy start date, in repositories that run twoseat. PRs merged before the policy start bucket as pre-policy and are not rated.',
  gaming: 'Skip the label.',
  crossCheck: 'Unlabeled bypasses: PRs whose latest twoseat comment decided block or not-reviewed, has no Decision row, or is missing, and that carry no gate-bypass label. Listed with links.',
  compute(data) {
    const post: { repo: Repo; pr: PullRequest }[] = [];
    let pre = 0;
    for (const repo of data.repos.filter((r) => r.aiReview)) {
      for (const pr of mergedInWindow(repo, data)) {
        if (pr.mergedAt >= data.policyStart) post.push({ repo, pr });
        else pre += 1;
      }
    }
    return {
      headline: rate(post.filter(({ pr }) => pr.labels.includes('gate-bypass')).length, post.length),
      rows: [
        line(`${String(post.length)} merged PRs since the policy start on ${day(data.policyStart)}`),
        line(`${String(pre)} earlier PRs in the window bucket as pre-policy`),
      ],
      crossCheck: post
        .filter(({ pr }) => isBypass(pr) && !pr.labels.includes('gate-bypass'))
        .map(({ repo, pr }) => line(`${repo.name} #${String(pr.number)}: ${TEXT[pr.decision]}, no gate-bypass label`, pr.url)),
    };
  },
};
