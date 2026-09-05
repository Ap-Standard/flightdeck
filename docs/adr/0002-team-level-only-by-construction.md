# ADR 0002: Team-level only, by construction

Status: accepted, 2026-09-05.

## Context

Delivery metrics computed per person become performance reviews, and once
they do, the numbers get managed instead of the work. The usual safeguard is a
policy: collect the data, promise not to slice it by person. A policy can be
changed by whoever holds the data.

## Decision

flightdeck cannot measure a person. The GraphQL query requests no `author`,
`assignee`, `login`, or `reviews` field, and a test fails the build if the
query text ever names one; the pattern has no word boundaries, so
`authorAssociation` and `reviewRequests` fail it too. After collection, a
second test walks the collected data at every depth and fails if any key
matches the same pattern. Titles have `@mentions` replaced with
`@[login removed]` before they reach the page. Bodies, comments, and release
descriptions are read inside `src/collect.ts` for the Decision row and the
Verified link, then dropped; `latest.json` and the page carry numbers, titles,
tag names, and links.

## Consequences

- No tile can be added that slices by person without deleting two tests,
  which is a visible act in a reviewed pull request.
- The fixtures under `test/fixtures/` follow the same rule: no real login
  appears in them. The one `@mention` in a fixture body is synthetic and
  exists to prove the stripping.
- Some DORA breakdowns are unavailable here by design, and the dashboard says
  so in its footer.
- A pull request title that is itself a person's name would survive. Titles
  here are descriptive, and this is accepted.
