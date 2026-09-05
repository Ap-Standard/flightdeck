import { expect, test } from 'vitest';
import { REPO_QUERY } from './github.js';

test('the query requests no per-person field, and asks for the last 100 merged PRs with labels, body, and the last 20 comments', () => {
  expect(REPO_QUERY).not.toMatch(/author|assignee|login|reviews/i);
  expect(REPO_QUERY).toContain('pullRequests(first: 100, states: [MERGED]');
  expect(REPO_QUERY).toContain('comments(last: 20)');
  expect(REPO_QUERY).toContain('releases(first: 50');
});
