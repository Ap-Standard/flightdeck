/**
 * card.svg by template literal: four headline numbers, the generation date,
 * and the dashboard URL as text. The profile README hot-links this file, so it
 * references nothing outside itself and uses opaque neutrals that read on light
 * and dark GitHub themes. The printed date is how staleness declares itself.
 */
import { NOT_MEASURED, day } from '../format.js';
import type { Collected, Computed } from '../types.js';
import { escapeHtml } from './html.js';

const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const HEADLINES: [string, string][] = [
  ['verified-releases', 'Verified releases'], ['lead-time', 'Lead time, median'], ['gate-bypass', 'Gate-bypass rate'], ['reliability', 'Nights measured'],
];

const text = (x: number, y: number, font: string, size: string, fill: string, body: string, extra = ''): string =>
  `<text x="${String(x)}" y="${String(y)}"${extra} font-family="${font}" font-size="${size}" fill="${fill}">${escapeHtml(body)}</text>`;

export function renderCard(data: Collected, computed: Computed[], siteUrl: string): string {
  const values = HEADLINES.map(([id, label]) => [label, computed.find((e) => e.metric.id === id)?.out.headline ?? NOT_MEASURED]);
  const generated = day(data.generatedAt);
  const days = String(Math.round((Date.parse(data.generatedAt) - Date.parse(data.windowStart)) / 86_400_000));
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="200" viewBox="0 0 640 200" role="img" aria-labelledby="title desc">',
    '<title id="title">flightdeck: nightly delivery metrics</title>',
    `<desc id="desc">${escapeHtml(values.map(([label, value]) => `${label ?? ''} ${value ?? ''}`).join(', '))}. Generated ${generated}.</desc>`,
    '<rect x="0.5" y="0.5" width="639" height="199" rx="8" fill="#f0f2f4" stroke="#8b949e"/>',
    text(24, 36, SANS, '16', '#1f2328', 'flightdeck', ' font-weight="600"'),
    text(616, 36, MONO, '12', '#57606a', `generated ${generated} UTC`, ' text-anchor="end"'),
    ...values.flatMap(([label, value], i) => [
      text(24 + i * 150, 72, SANS, '12', '#57606a', label ?? ''),
      text(24 + i * 150, 106, MONO, value === NOT_MEASURED ? '14' : '26', '#1f2328', value ?? '', ' font-weight="700"'),
    ]),
    '<line x1="24" y1="134" x2="616" y2="134" stroke="#d0d7de"/>',
    text(24, 158, SANS, '12', '#57606a', `Measured nightly from the GitHub API over a ${days}-day window. Rates under 10 events print as counts.`),
    text(24, 180, MONO, '12', '#57606a', siteUrl),
    '</svg>',
    '',
  ].join('\n');
}
