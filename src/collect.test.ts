import { expect, test } from 'vitest';
import { collect, extractVerifiedLink, forbiddenKeys, parseDecision, stripLogins, verify } from './collect.js';
import { fixtureApi, readConfig } from './fixtures.js';
import type { Api, RawRelease, RunInfo } from './types.js';

const MARKER = '<!-- twoseat:review -->';
const at = (createdAt: string, body: string | null) => ({ createdAt, body });

test('parseDecision reads the four twoseat values and names the two absences', () => {
  for (const value of ['block', 'pass', 'blocking-disabled', 'not-reviewed']) {
    expect(parseDecision([at('2026-09-04T00:00:00Z', `${MARKER}\n| Decision | ${value} |`)])).toBe(value);
  }
  expect(parseDecision([at('2026-09-04T00:00:00Z', `${MARKER}\n**No findings.**`)])).toBe('no-decision-row');
  expect(parseDecision([at('2026-09-04T00:00:00Z', '| Decision | block |'), at('2026-09-04T00:00:01Z', null)])).toBe('no-comment');
});

test('parseDecision: the most recently created twoseat comment wins, whatever order the API returns', () => {
  const newer = at('2026-09-04T04:30:00Z', `${MARKER}\n| Decision | not-reviewed |`);
  const older = at('2026-09-03T23:33:00Z', `${MARKER}\n| Decision | pass |`);
  expect(parseDecision([newer, older])).toBe('not-reviewed');
  expect(parseDecision([older, newer])).toBe('not-reviewed');
});

test('extractVerifiedLink needs the exact heading, then a run URL on the next non-empty line', () => {
  expect(extractVerifiedLink('## Verify\nhttps://github.com/Ap-Standard/twoseat/actions/runs/1')).toBe('no Verified heading in the notes');
  expect(extractVerifiedLink('## Verified\n\nsee the run page')).toBe('no run link under the Verified heading');
  expect(extractVerifiedLink('notes\n\n## Verified\n\nhttps://github.com/Ap-Standard/flightdeck/actions/runs/42\n')).toEqual({ owner: 'Ap-Standard', repo: 'flightdeck', id: 42 });
});

const release = (description: string): RawRelease => ({ name: 'v1', tagName: 'v1', isDraft: false, isPrerelease: false, publishedAt: '2026-09-04T18:07:16Z', description });
const apiWith = (run: RunInfo | null): Api => ({ fetchRepo: () => Promise.reject(new Error('unused')), fetchRun: () => Promise.resolve(run), fetchWorkflowRuns: () => Promise.resolve([]) });
const run = (conclusion: string, createdAt: string): RunInfo => ({ id: 7, repo: 'Ap-Standard/flightdeck', conclusion, createdAt, url: 'https://github.com/Ap-Standard/flightdeck/actions/runs/7' });
const NOTES = '## Verified\n\nhttps://github.com/Ap-Standard/flightdeck/actions/runs/7';
const REPOS = ['twoseat', 'flightdeck'];
const reason = async (description: string, found: RunInfo | null): Promise<string> => {
  const result = await verify(release(description), 'Ap-Standard', REPOS, apiWith(found));
  return result.ok ? `ok ${result.runUrl}` : result.reason;
};

test('verify rejects a missing heading, a wrong repo, a missing run, a failed run, and a run created before publish', async () => {
  expect(await reason('no section', null)).toBe('no Verified heading in the notes');
  expect(await reason('## Verified\nhttps://github.com/other/repo/actions/runs/7', null)).toBe('links a run outside the portfolio');
  expect(await reason(NOTES, null)).toBe('the linked run does not exist');
  expect(await reason(NOTES, run('failure', '2026-09-05T00:00:00Z'))).toBe('the linked run did not conclude success');
  expect(await reason(NOTES, run('success', '2026-09-04T17:29:27Z'))).toBe('the linked run was created before the release was published');
  expect(await reason(NOTES, run('success', '2026-09-05T03:10:00Z'))).toBe('ok https://github.com/Ap-Standard/flightdeck/actions/runs/7');
});

test('forbiddenKeys finds per-person keys at any depth; stripLogins removes mentions and keeps pins and emails', () => {
  expect(forbiddenKeys({ a: [{ author: { login: 'x' } }], reviews: [], ok: 1 })).toEqual(['.a[0].author', '.a[0].author.login', '.reviews']);
  expect(forbiddenKeys({ title: 'login page fix', mergedAt: null })).toEqual([]);
  expect(stripLogins('thanks @someone-else and @a1')).toBe('thanks @[login removed] and @[login removed]');
  expect(stripLogins('pin Ap-Standard/twoseat@v0.1.0, mail a@b.example')).toBe('pin Ap-Standard/twoseat@v0.1.0, mail a@b.example');
});

test('collect drops bodies, comments, descriptions, drafts and prereleases, and keeps no per-person key', async () => {
  const { api, now } = fixtureApi();
  const data = await collect(readConfig(), api, now);
  expect(JSON.stringify(data)).not.toMatch(/"body"|"comments"|"description"|someone-else/);
  expect(forbiddenKeys(data)).toEqual([]);
  expect(data.repos[0]?.releases.map((r) => r.tagName)).toEqual(['v0.1.0']);
  expect(data.repos[0]?.pullRequests.map((pr) => pr.decision)).toEqual(['pass', 'not-reviewed', 'no-decision-row', 'no-comment']);
  expect(data.repos[1]?.releases.map((r) => r.verification.ok)).toEqual([true, false]);
});
