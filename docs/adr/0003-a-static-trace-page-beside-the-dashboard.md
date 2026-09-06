# ADR 0003: A static trace page beside the dashboard

Status: accepted, 2026-09-06.

## Context

The profile's diagram names the seven gates a change moves through. It
states the shape of the process, not that the process ran. The dashboard
counts every change in aggregate, but no surface walks one change from end
to end with the GitHub object that proves each step, so checking that claim
means rebuilding the trail by hand.

## Decision

One static file, `static/loop.html`, copied into `site/` by the nightly run
and published beside `index.html`. It walks one fixed real change through
all seven gates, and each step carries the link to the object that proves
it, its UTC timestamp, the elapsed time since the previous step, how the
step gets gamed, and what catches the gaming, quoted from the metric source.
`static/` is a page asset, not engine code: the 1,100-line cap counts `src`,
`test`, `.github`, and the config files and never listed `static/`, so the
page sits outside that cap by construction, under its own printed cap of 250
lines. No dependency, no external asset, no network call, no required
script.

## Consequences

- It publishes at the next nightly run or a dispatch, not on merge.
- The receipts are historical objects in a frozen repository, so they cannot
  drift, but they 404 if a repository is renamed. A CI grep blocks external
  references and every href is checked after the first publish.
- One change is not a sample and the footer says so. Any change to the seven
  gates makes this page stale, and nothing detects that automatically.

## Alternative rejected

Render the trace nightly from collected data instead. About 120 counted
lines in `src/render`, which breaches the 1,100-line cap, and it buys
freshness the page does not need: the traced change is finished. Recorded as
the v2 to revisit once 30 measured nights exist. Also rejected, a
platformer-style mini-game or a cart-racing arcade variant on a fourth
repository, which showcases typing this portfolio does not claim (profile
ADR 0007), and an interactive over single-digit denominators, which dresses
thin data instead of thickening it.
