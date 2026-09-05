import { afterEach, expect, test, vi } from 'vitest';
import { REPO_QUERY, githubApi } from './github.js';
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
const failing = (status: number) => { const mock = vi.fn().mockResolvedValue(new Response(null, { status })); vi.stubGlobal('fetch', mock); return mock; };
test('the query requests no per-person field, and asks for the last 100 merged PRs with labels, body, and the last 20 comments', () => {
  expect(REPO_QUERY).not.toMatch(/author|assignee|login|reviews/i);
  expect(REPO_QUERY).toContain('pullRequests(first: 100, states: [MERGED]');
  expect(REPO_QUERY).toContain('comments(last: 20)');
  expect(REPO_QUERY).toContain('releases(first: 50');
});
test('a persistent non-404 4xx fails on the first attempt, with no retry', async () => {
  const fetchMock = failing(401);
  await expect(githubApi('token', 'owner').fetchRun('repo', 1)).rejects.toThrow('GitHub returned 401');
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
test('a persistent 5xx retries once, sleeping between attempts, then fails', async () => {
  vi.useFakeTimers();
  const fetchMock = failing(502);
  const pending = expect(githubApi('token', 'owner').fetchRun('repo', 1)).rejects.toThrow('GitHub returned 502');
  await vi.advanceTimersByTimeAsync(2000); await pending;
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
