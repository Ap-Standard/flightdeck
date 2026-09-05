import { beforeAll, expect, test } from 'vitest';
import { collect } from '../collect.js';
import { fixtureApi, readConfig } from '../fixtures.js';
import { METRICS, computeAll } from '../metrics/index.js';
import type { Collected, Computed } from '../types.js';
import { renderCard } from './card.js';
import { escapeHtml, renderHtml } from './html.js';

const SITE = 'https://ap-standard.github.io/flightdeck/';
let data: Collected;
let computed: Computed[];

beforeAll(async () => {
  const { api, now } = fixtureApi();
  data = await collect(readConfig(), api, now);
  computed = computeAll(data);
});

test('the page holds every metric id and its definition anchor, and no NaN, undefined, null, script, or external fetch', () => {
  const html = renderHtml(data, computed, SITE);
  for (const metric of METRICS) {
    expect(html).toContain(`id="${metric.id}"`);
    expect(html).toContain(`href="#${metric.id}-definition"`);
  }
  expect(html).not.toMatch(/NaN|undefined|null|<script|<link|@import|url\(/);
  expect(html).toContain('Generated 2026-10-02T00:00:00.000Z');
  expect(html).toContain('<li class="muted"><a href="https://github.com/Ap-Standard/flightdeck/releases/tag/v0.1.1">');
});

test('text reaching the markup is escaped', () => {
  expect(escapeHtml('<b>"x" & y</b>')).toBe('&lt;b&gt;&quot;x&quot; &amp; y&lt;/b&gt;');
  const hostile: Collected = { ...data, repos: data.repos.map((repo) => ({ ...repo, name: '<img src=x onerror=alert(1)>' })) };
  expect(renderHtml(hostile, computeAll(hostile), SITE)).not.toContain('<img');
});

test('the card is one self-contained SVG with four headline numbers, the date, and the dashboard URL, and it is deterministic', () => {
  const svg = renderCard(data, computed, SITE);
  expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="640" height="200"/);
  expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
  expect((svg.match(/<text /g) ?? []).length).toBe(12);
  for (const value of ['2 of 3', '20.5 h', '1 of 2', '5 of 27', 'generated 2026-10-02 UTC', SITE]) expect(svg).toContain(value);
  expect(svg).not.toMatch(/xlink:href|href=|@import|url\(|<image|<style|<script|<foreignObject|NaN|undefined|null/);
  expect(svg).toBe(renderCard(data, computed, SITE));
});
