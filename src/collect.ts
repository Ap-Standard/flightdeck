/**
 * Turns raw API data into the published-safe Collected shape. Three things happen here and
 * nowhere else: release notes are read for the "## Verified" convention and confirmed against
 * one Actions run; the latest twoseat comment on each PR is read for its Decision row; and every
 * body, comment, and description is dropped. The last step re-checks that no per-person key survived.
 */
import type { Api, Collected, Config, Decision, RawComment, RawRelease, Release, Repo, Verification } from './types.js';

/** twoseat's frozen comment contract: the marker, then one Decision row. */
const MARKER = '<!-- twoseat:review -->';
const DECISION_ROW = /^\| Decision \| (block|pass|blocking-disabled|not-reviewed) \|/m;
const RUN_URL = /https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/actions\/runs\/(\d+)/;
const FORBIDDEN_KEY = /author|assignee|login|reviews/i;

/** The most recently created twoseat comment wins; a marker without a Decision row is its own state. */
export function parseDecision(comments: readonly RawComment[]): Decision {
  const marked = comments.filter((c) => c.body?.includes(MARKER) === true).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const latest = marked.at(-1);
  if (latest === undefined) return 'no-comment';
  const match = DECISION_ROW.exec(latest.body ?? '');
  return match === null ? 'no-decision-row' : (match[1] as Decision);
}

/** A level-2 heading exactly "## Verified"; the next non-empty line holds the run URL. */
export function extractVerifiedLink(description: string): { owner: string; repo: string; id: number } | string {
  const lines = description.split(/\r?\n/);
  const at = lines.findIndex((line) => line.trim() === '## Verified');
  if (at === -1) return 'no Verified heading in the notes';
  const next = lines.slice(at + 1).find((line) => line.trim() !== '');
  const match = next === undefined ? null : RUN_URL.exec(next);
  if (match === null) return 'no run link under the Verified heading';
  return { owner: match[1] ?? '', repo: match[2] ?? '', id: Number(match[3]) };
}

export async function verify(release: RawRelease, owner: string, repos: readonly string[], api: Api): Promise<Verification> {
  const link = extractVerifiedLink(release.description ?? '');
  if (typeof link === 'string') return { ok: false, reason: link };
  if (link.owner !== owner || !repos.includes(link.repo)) return { ok: false, reason: 'links a run outside the portfolio' };
  const run = await api.fetchRun(link.repo, link.id);
  if (run === null) return { ok: false, reason: 'the linked run does not exist' };
  if (run.conclusion !== 'success') return { ok: false, reason: 'the linked run did not conclude success' };
  if (release.publishedAt === null || run.createdAt <= release.publishedAt) {
    return { ok: false, reason: 'the linked run was created before the release was published' };
  }
  return { ok: true, runUrl: run.url };
}

/** Replaces an @mention with a fixed token. A pin such as twoseat@v0.1.0 is not a mention and stays. */
export const stripLogins = (text: string): string => text.replace(/(^|[^\w])@[A-Za-z0-9-]{1,39}(?![\w./-])/g, '$1@[login removed]');

/** Every key path, at any depth, whose name is a per-person field. */
export function forbiddenKeys(value: unknown, path = ''): string[] {
  if (Array.isArray(value)) return value.flatMap((item, i) => forbiddenKeys(item, `${path}[${String(i)}]`));
  if (value === null || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) => {
    const here = `${path}.${key}`;
    return [...(FORBIDDEN_KEY.test(key) ? [here] : []), ...forbiddenKeys(child, here)];
  });
}

export async function collect(config: Config, api: Api, now: Date): Promise<Collected> {
  const names = config.repos.map((repo) => repo.name);
  const base = `https://github.com/${config.owner}`;
  const repos: Repo[] = [];
  for (const { name, aiReview } of config.repos) {
    const raw = await api.fetchRepo(name);
    const releases: Release[] = [];
    for (const r of raw.releases) {
      if (r.isDraft || r.isPrerelease || r.publishedAt === null) continue;
      const verification = await verify(r, config.owner, names, api);
      releases.push({ name: stripLogins(r.name ?? r.tagName), tagName: r.tagName, publishedAt: r.publishedAt, verification, url: `${base}/${name}/releases/tag/${r.tagName}` });
    }
    const pullRequests = raw.pullRequests.flatMap((pr) =>
      pr.mergedAt === null ? [] : [{
        number: pr.number, title: stripLogins(pr.title), createdAt: pr.createdAt, mergedAt: pr.mergedAt, labels: pr.labels,
        decision: parseDecision(pr.comments), url: `${base}/${name}/pull/${String(pr.number)}`,
      }],
    );
    repos.push({ name, aiReview, releases, pullRequests });
  }
  const collected: Collected = {
    generatedAt: now.toISOString(),
    windowStart: new Date(now.getTime() - config.windowDays * 86_400_000).toISOString(),
    policyStart: config.policyStart, owner: config.owner, repos,
    nightlyRuns: await api.fetchWorkflowRuns(config.self, config.nightlyWorkflow),
    nightlyRunsUrl: `${base}/${config.self}/actions/workflows/${config.nightlyWorkflow}`,
  };
  const leaked = forbiddenKeys(collected);
  if (leaked.length > 0) throw new Error(`Collected data carries a per-person field: ${leaked.join(', ')}`);
  return collected;
}
