/**
 * The one command. `npx tsx src/cli.ts` collects from GitHub with GITHUB_TOKEN and writes site/.
 * `--fixtures` renders the same three files offline from test/fixtures, which is what CI runs on
 * every pull request. Logs print counts, never bodies or a full API response.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { collect } from './collect.js';
import { fixtureApi, readConfig } from './fixtures.js';
import { githubApi } from './github.js';
import { computeAll } from './metrics/index.js';
import { renderCard } from './render/card.js';
import { renderHtml } from './render/html.js';

async function main(): Promise<void> {
  const config = readConfig();
  const fixtures = process.argv.includes('--fixtures');
  const token = process.env.GITHUB_TOKEN ?? '';
  if (!fixtures && token === '') throw new Error('GITHUB_TOKEN is not set. Pass --fixtures to render offline.');
  const source = fixtures ? fixtureApi() : { api: githubApi(token, config.owner), now: new Date() };
  const data = await collect(config, source.api, source.now);
  for (const repo of data.repos) {
    console.log(`${repo.name}: ${String(repo.pullRequests.length)} merged PRs, ${String(repo.releases.length)} releases`);
  }
  console.log(`nightly runs listed: ${String(data.nightlyRuns.length)}`);
  const computed = computeAll(data);
  const latest = {
    generatedAt: data.generatedAt, windowStart: data.windowStart, policyStart: data.policyStart,
    source: fixtures ? 'fixtures' : 'github', repos: data.repos.map((repo) => repo.name),
    metrics: Object.fromEntries(computed.map(({ metric, out }) => [metric.id, out])),
  };
  mkdirSync('site', { recursive: true });
  writeFileSync('site/index.html', renderHtml(data, computed, config.siteUrl));
  writeFileSync('site/card.svg', renderCard(data, computed, config.siteUrl));
  writeFileSync('site/latest.json', `${JSON.stringify(latest, null, 2)}\n`);
  console.log(`rendered site/index.html, site/card.svg, site/latest.json at ${data.generatedAt}${fixtures ? ' from fixtures' : ''}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
