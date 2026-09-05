/**
 * The GitHub client: one GraphQL query per repo, two REST lookups, global fetch. Each request
 * retries once on a network error or a 5xx, then fails loud; a 4xx other than 404 fails at once.
 * The query requests no author, assignee, login, or reviews field; a test fails the build otherwise.
 */
import type { Api, RawRelease, WorkflowRun } from './types.js';

export const REPO_QUERY = `query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    pullRequests(first: 100, states: [MERGED], orderBy: {field: UPDATED_AT, direction: DESC}) {
      nodes { number title createdAt mergedAt body labels(first: 20) { nodes { name } } comments(last: 20) { nodes { body createdAt } } }
    }
    releases(first: 50, orderBy: {field: CREATED_AT, direction: DESC}) {
      nodes { name tagName isDraft isPrerelease publishedAt description }
    }
  }
}`;

interface Nodes<T> { nodes: T[] }
interface PullRequestNode {
  number: number; title: string; createdAt: string; mergedAt: string | null; body: string | null;
  labels: Nodes<{ name: string }>; comments: Nodes<{ body: string | null; createdAt: string }>;
}
interface QueryResult {
  data?: { repository: { pullRequests: Nodes<PullRequestNode>; releases: Nodes<RawRelease> } | null };
  errors?: { message: string }[];
}
interface RestRun { id: number; conclusion: string | null; created_at: string; html_url: string; repository: { full_name: string } }
interface RestRuns { workflow_runs: { id: number; event: string; status: string; conclusion: string | null; created_at: string }[] }

const API = 'https://api.github.com';

async function call(url: string, token: string, body?: string): Promise<Response> {
  const headers = { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'user-agent': 'flightdeck' };
  const init: RequestInit = { method: body === undefined ? 'GET' : 'POST', headers, ...(body === undefined ? {} : { body }) };
  for (let attempt = 0; ; attempt += 1) {
    let response: Response | undefined;
    try {
      response = await fetch(url, init);
    } catch (error) {
      if (attempt === 1) throw error;
    }
    if (response !== undefined) {
      if (response.ok || response.status === 404) return response;
      if (response.status < 500) throw new Error(`GitHub returned ${String(response.status)} for ${url}`);
      if (attempt === 1) throw new Error(`GitHub returned ${String(response.status)} for ${url}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

export function githubApi(token: string, owner: string): Api {
  return {
    async fetchRepo(name) {
      const body = JSON.stringify({ query: REPO_QUERY, variables: { owner, name } });
      const result = (await (await call(`${API}/graphql`, token, body)).json()) as QueryResult;
      const repo = result.data?.repository;
      if (repo === undefined || repo === null) {
        throw new Error(`GraphQL returned no repository for ${owner}/${name}: ${result.errors?.[0]?.message ?? 'no message'}`);
      }
      return {
        pullRequests: repo.pullRequests.nodes.map((pr) => ({ ...pr, labels: pr.labels.nodes.map((l) => l.name), comments: pr.comments.nodes })),
        releases: repo.releases.nodes,
      };
    },
    async fetchRun(repo, id) {
      const response = await call(`${API}/repos/${owner}/${repo}/actions/runs/${String(id)}`, token);
      if (response.status === 404) return null;
      const run = (await response.json()) as RestRun;
      return { id: run.id, repo: run.repository.full_name, conclusion: run.conclusion, createdAt: run.created_at, url: run.html_url };
    },
    async fetchWorkflowRuns(repo, workflow): Promise<WorkflowRun[]> {
      const response = await call(`${API}/repos/${owner}/${repo}/actions/workflows/${workflow}/runs?per_page=100`, token);
      if (response.status === 404) return [];
      const list = (await response.json()) as RestRuns;
      return list.workflow_runs.map((r) => ({ id: r.id, event: r.event, status: r.status, conclusion: r.conclusion, createdAt: r.created_at }));
    },
  };
}
