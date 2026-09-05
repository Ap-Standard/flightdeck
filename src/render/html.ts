/**
 * index.html by template literal. One page, no chart library, no script, no
 * external stylesheet or font. Every headline links to its own definition on
 * the same page, and every list a cross-check produces is printed in full.
 */
import { day } from '../format.js';
import type { Collected, Computed, Line } from '../types.js';

export const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const item = (e: Line): string =>
  `<li${e.muted ? ' class="muted"' : ''}>${e.href === null ? escapeHtml(e.text) : `<a href="${escapeHtml(e.href)}">${escapeHtml(e.text)}</a>`}</li>`;

const list = (lines: Line[], empty: string): string =>
  `<ul>${lines.length === 0 ? `<li class="muted">${escapeHtml(empty)}</li>` : lines.map(item).join('')}</ul>`;

const tile = ({ metric, out }: Computed): string => `<section class="tile" id="${metric.id}">
<h2>${escapeHtml(metric.title)}</h2>
<p class="headline"><a href="#${metric.id}-definition">${escapeHtml(out.headline)}</a></p>
${list(out.rows, 'nothing in the window')}
<dl>
<dt id="${metric.id}-definition">Definition</dt><dd>${escapeHtml(metric.definition)}</dd>
<dt>How it gets gamed</dt><dd>${escapeHtml(metric.gaming)}</dd>
<dt>Cross-check</dt><dd>${escapeHtml(metric.crossCheck)}${list(out.crossCheck, 'none in the window')}</dd>
</dl>
</section>`;

export function renderHtml(data: Collected, computed: Computed[], siteUrl: string): string {
  const source = `https://github.com/${data.owner}/flightdeck`;
  const repos = data.repos.map((r) => `<a href="${escapeHtml(`https://github.com/${data.owner}/${r.name}`)}">${escapeHtml(r.name)}</a>`).join(', ');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>flightdeck</title>
<style>
body{margin:0;padding:24px;font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;color:#1f2328;background:#f6f8fa}
main{max-width:1100px;margin:0 auto} header p,footer p{color:#57606a} a{color:#0969da} .muted{color:#8b949e}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px} .tile h2{margin:0 0 4px;font-size:16px}
.tile{background:#fff;border:1px solid #d0d7de;border-radius:8px;padding:16px} ul{margin:0 0 8px;padding-left:18px}
.headline{margin:0 0 8px;font:700 28px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.headline a{color:inherit;text-decoration:none;border-bottom:1px dotted #8b949e} dl{margin:0;font-size:13px;color:#57606a} dt{font-weight:600;margin-top:8px} dd{margin:0}
</style>
</head>
<body>
<main>
<header>
<h1>flightdeck</h1>
<p>Delivery metrics for the ${escapeHtml(data.owner)} portfolio, measured nightly from the GitHub API. Generated ${escapeHtml(data.generatedAt)}. Window: ${day(data.windowStart)} to ${day(data.generatedAt)}, ${String(data.repos.length)} repositories: ${repos}. Policy start for the gate-bypass rate: ${day(data.policyStart)}.</p>
<p>Every number links to its definition. Each tile also states how the number gets gamed and the cross-check that exposes it. Rates under 10 events print as counts; empty sets print "not measured". Raw numbers: <a href="${escapeHtml(siteUrl)}latest.json">latest.json</a>. Card: <a href="${escapeHtml(siteUrl)}card.svg">card.svg</a>. Definitions and method: <a href="${source}/blob/main/docs/metrics.md">docs/metrics.md</a>.</p>
</header>
<div class="grid">
${computed.map(tile).join('\n')}
</div>
<footer>
<p>Team-level only by construction: the query requests no author, assignee, login, or reviews field, and a test fails the build if it does. Last 100 merged PRs per repository. Source: <a href="${source}">${escapeHtml(source.slice(8))}</a>.</p>
</footer>
</main>
</body>
</html>
`;
}
