/**
 * Every tile on the fixtures, expected values derived by hand. now = 2026-10-02T00:00:00Z, window 90 days,
 * policy start 2026-09-04T18:07:16Z. Lead time: twoseat PRs #23, #19, #17, #9 merged 0.39, 13.45, 20.46, 37.97
 * hours before v0.1.0 (2026-09-04T18:07:16Z); flightdeck #1 merged 238 hours before its v0.1.0; median of five 20.46.
 */
import { beforeAll, expect, test } from 'vitest';
import { collect } from '../collect.js';
import { NOT_MEASURED } from '../format.js';
import { fixtureApi, readConfig } from '../fixtures.js';
import type { Collected, Line, MetricOutput } from '../types.js';
import { METRICS, computeAll } from './index.js';

let data: Collected;
const out = (id: string, from = data): MetricOutput => {
  const found = computeAll(from).find((entry) => entry.metric.id === id);
  if (found === undefined) throw new Error(id);
  return found.out;
};
const texts = (lines: Line[]): string[] => lines.map((line) => line.text);

beforeAll(async () => {
  const { api, now } = fixtureApi();
  data = await collect(readConfig(), api, now);
});

test('every metric ships a definition, a gaming analysis, and a cross-check', () => {
  expect(METRICS.map((m) => m.id)).toEqual(['verified-releases', 'lead-time', 'gate-bypass', 'change-failure', 'reliability', 'time-to-restore']);
  for (const m of METRICS) expect([m.definition.length > 40, m.gaming.length > 10, m.crossCheck.length > 20]).toEqual([true, true, true]);
});

test('verified releases: 2 of 3 in the window; the unverified one is listed gray with its reason', () => {
  const result = out('verified-releases');
  expect(result.headline).toBe('2 of 3');
  expect(texts(result.rows)).toEqual(['twoseat: 1 of 1', 'flightdeck: 1 of 2']);
  expect(result.crossCheck).toEqual([{ text: 'flightdeck v0.1.1: no Verified heading in the notes', href: 'https://github.com/Ap-Standard/flightdeck/releases/tag/v0.1.1', muted: true }]);
});

test('lead time: median 20.5 h over 5 PRs, release debt 1, cycle time median 1.5 h over 6', () => {
  const result = out('lead-time');
  expect(result.headline).toBe('20.5 h');
  expect(texts(result.rows)).toEqual(['median over 5 PRs']);
  expect(texts(result.crossCheck)).toEqual(['release debt: 1 merged PRs in no verified release', 'PR cycle time, created to merged: median 1.5 h over 6 PRs']);
});

test('lead time is not measured until 3 PRs qualify', () => {
  const two: Collected = { ...data, repos: data.repos.map((repo) => ({ ...repo, pullRequests: repo.pullRequests.slice(0, 1) })) };
  expect(out('lead-time', two).headline).toBe(NOT_MEASURED);
  expect(texts(out('lead-time', two).rows)).toEqual(['2 of the 3 PRs needed qualify']);
});

test('gate-bypass: 1 of 2 since the policy start, 4 pre-policy, one unlabeled bypass with a link', () => {
  const result = out('gate-bypass');
  expect(result.headline).toBe('1 of 2');
  expect(texts(result.rows)).toEqual(['2 merged PRs since the policy start on 2026-09-04', '4 earlier PRs in the window bucket as pre-policy']);
  expect(result.crossCheck).toEqual([{ text: 'flightdeck #1: no twoseat comment, no gate-bypass label', href: 'https://github.com/Ap-Standard/flightdeck/pull/1', muted: false }]);
});

test('change failure: 1 of 2 verified releases, label coverage 1 of 6, one fix-titled PR without type:bug', () => {
  const result = out('change-failure');
  expect(result.headline).toBe('1 of 2');
  expect(texts(result.rows)).toEqual(['twoseat: 0 of 1', 'flightdeck: 1 of 1']);
  expect(texts(result.crossCheck)).toEqual(['label coverage: 1 of 6 merged PRs carry a type: label', 'flightdeck #1: fix in the title, no type:bug label']);
});

test('reliability: 5 of the 27 nights since the first run, 3 by schedule and 2 by manual dispatch', () => {
  const result = out('reliability');
  expect(result.headline).toBe('5 of 27');
  expect(texts(result.rows)).toEqual(['3 nights by schedule, 2 by manual dispatch', 'first run in the list on 2026-09-05; 2 of 7 listed runs did not complete with success']);
  expect(result.crossCheck[0]?.href).toBe('https://github.com/Ap-Standard/flightdeck/actions/workflows/nightly.yml');
});

test('time to restore prints not measured, and an empty window prints not measured on every rated tile', () => {
  expect(out('time-to-restore').headline).toBe(NOT_MEASURED);
  const empty: Collected = { ...data, generatedAt: '2027-06-01T00:00:00.000Z', windowStart: '2027-03-03T00:00:00.000Z' };
  for (const id of ['verified-releases', 'lead-time', 'gate-bypass', 'change-failure']) expect(out(id, empty).headline).toBe(NOT_MEASURED);
  expect(JSON.stringify(computeAll(empty))).not.toMatch(/NaN|undefined/);
});
