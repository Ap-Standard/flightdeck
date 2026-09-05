/** The offline data source. `--fixtures` and the tests both read test/fixtures, so CI exercises the
 * same collect, compute, and render path the nightly runs, with no token and no network. */
import { readFileSync } from 'node:fs';
import type { Api, Config, RawRepo, RunInfo, WorkflowRun } from './types.js';

const read = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;

export function fixtureApi(dir = 'test/fixtures'): { api: Api; now: Date } {
  const repos = read<Record<string, RawRepo>>(`${dir}/repos.json`);
  const runs = read<{ now: string; runs: RunInfo[]; nightly: WorkflowRun[] }>(`${dir}/runs.json`);
  return {
    now: new Date(runs.now),
    api: {
      fetchRepo: (name) => {
        const repo = repos[name];
        if (repo === undefined) throw new Error(`no fixture for ${name}`);
        return Promise.resolve(repo);
      },
      fetchRun: (repo, id) => Promise.resolve(runs.runs.find((run) => run.repo.endsWith(`/${repo}`) && run.id === id) ?? null),
      fetchWorkflowRuns: () => Promise.resolve(runs.nightly),
    },
  };
}

export const readConfig = (path = 'flightdeck.config.json'): Config => read<Config>(path);
