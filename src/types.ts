/**
 * Every shape the engine passes between modules. Raw* is the API after one mapping step, bodies
 * included. Everything below the Raw section survives collection and reaches the page: no body,
 * no comment text, no per-person field. That boundary is the privacy design.
 */
export interface RepoConfig { name: string; aiReview: boolean }
/** policyStart: merged PRs before it bucket as pre-policy. self: the repo whose nightly run list feeds reliability. */
export interface Config {
  owner: string; repos: RepoConfig[]; policyStart: string; windowDays: number; self: string; nightlyWorkflow: string; siteUrl: string;
}

export interface RawComment { body: string | null; createdAt: string }
export interface RawPullRequest {
  number: number; title: string; createdAt: string; mergedAt: string | null; body: string | null;
  labels: string[]; comments: RawComment[];
}
export interface RawRelease {
  name: string | null; tagName: string; isDraft: boolean; isPrerelease: boolean; publishedAt: string | null; description: string | null;
}
export interface RawRepo { pullRequests: RawPullRequest[]; releases: RawRelease[] }
/** One Actions run as REST reports it; repo is owner/name. */
export interface RunInfo { id: number; repo: string; conclusion: string | null; createdAt: string; url: string }
export interface WorkflowRun { id: number; event: string; status: string; conclusion: string | null; createdAt: string }

/** The three reads the engine performs. github.ts serves them live; fixtures.ts serves them from disk. */
export interface Api {
  fetchRepo(name: string): Promise<RawRepo>;
  fetchRun(repo: string, id: number): Promise<RunInfo | null>;
  fetchWorkflowRuns(repo: string, workflow: string): Promise<WorkflowRun[]>;
}

/** twoseat's four values plus the two absences the parser keeps apart. */
export type Decision = 'block' | 'pass' | 'blocking-disabled' | 'not-reviewed' | 'no-decision-row' | 'no-comment';
/** The reason is the sentence the page prints, so the code and the cross-check cannot disagree. */
export type Verification = { ok: true; runUrl: string } | { ok: false; reason: string };

export interface PullRequest {
  number: number; title: string; createdAt: string; mergedAt: string; labels: string[]; decision: Decision; url: string;
}
export interface Release { name: string; tagName: string; publishedAt: string; verification: Verification; url: string }
export interface Repo { name: string; aiReview: boolean; pullRequests: PullRequest[]; releases: Release[] }
export interface Collected {
  generatedAt: string; windowStart: string; policyStart: string; owner: string;
  repos: Repo[]; nightlyRuns: WorkflowRun[]; nightlyRunsUrl: string;
}

/** One printed line. muted renders gray: present, never hidden. */
export interface Line { text: string; href: string | null; muted: boolean }
export interface MetricOutput { headline: string; rows: Line[]; crossCheck: Line[] }
export interface Metric {
  id: string; title: string; definition: string; gaming: string; crossCheck: string;
  compute(data: Collected): MetricOutput;
}
export interface Computed { metric: Metric; out: MetricOutput }
