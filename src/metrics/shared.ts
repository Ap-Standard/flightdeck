/** Helpers every tile uses: the window filter and the line constructor. */
import type { Collected, Line, PullRequest, Release, Repo } from '../types.js';

export const line = (text: string, href: string | null = null, muted = false): Line => ({ text, href, muted });
export const inWindow = (iso: string, data: Collected): boolean => iso >= data.windowStart && iso <= data.generatedAt;
export const mergedInWindow = (repo: Repo, data: Collected): PullRequest[] => repo.pullRequests.filter((pr) => inWindow(pr.mergedAt, data));
export const publishedInWindow = (repo: Repo, data: Collected): Release[] => repo.releases.filter((r) => inWindow(r.publishedAt, data));
export const verifiedInWindow = (repo: Repo, data: Collected): Release[] => publishedInWindow(repo, data).filter((r) => r.verification.ok);
