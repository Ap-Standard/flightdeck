# How flightdeck works

One page. If this page cannot explain the repository, the page is wrong and
gets fixed.

## What problem

A delivery metric without its failure mode is a number somebody will optimize.
Lead time falls when every merge gets a release. A bypass rate reads zero when
nobody applies the label. A deploy count climbs when green CI gets called a
deploy. flightdeck measures this portfolio's own delivery practice and prints,
beside every number, the definition it was computed from, the way the number
gets gamed, and the cross-check that exposes the gaming. The number is the
headline. The three lines under it are the product.

## What runs each night

1. `nightly.yml` starts on `cron: '23 6 * * *'` or by manual dispatch, checks
   out the repository, installs the dev toolchain, and runs
   `npx tsx src/cli.ts` with `GITHUB_TOKEN`.
2. `src/cli.ts` reads `flightdeck.config.json`: the owner, the repositories
   measured, which of them run twoseat, the policy start date, and the 90-day
   window.
3. `src/github.ts` runs one GraphQL query per repository for the last 100
   merged pull requests (title, dates, labels, body, last 20 comments) and the
   last 50 releases. It requests no author, assignee, login, or reviews field;
   a test fails the build if the query text ever does.
4. `src/collect.ts` reads each release's notes for a `## Verified` heading
   followed by a run link and confirms that run through one REST call, reads
   each pull request's latest twoseat comment for its Decision row, replaces
   `@mentions` in titles, then drops every body, comment, and description. A
   second test asserts no per-person key survives in the collected data at any
   depth.
5. `src/metrics/` computes six tiles from the collected data. Each tile is one
   module exporting its definition, its gaming analysis, its cross-check, and a
   `compute` function.
6. `src/render/` writes `site/index.html`, `site/card.svg`, and
   `site/latest.json` by template literal. No chart library, no script, no
   external asset.
7. `actions/upload-pages-artifact` and `actions/deploy-pages` publish `site/`
   through Actions-mode GitHub Pages. No branch is written, so the page cannot
   drift from the code that rendered it.

The same program runs with `--fixtures` on every pull request, reading
`test/fixtures/` instead of the API, so CI proves the whole path without a
token.

## The two printing rules

`src/format.ts` is the only place a number becomes text.

- An empty set prints `not measured`. Never 0, never NaN. Time to restore,
  with no production service behind it, can never read as zero.
- A rate over fewer than 10 events prints as a count, `n of m`. A percentage
  over five events reads as precision it does not have.

## What it refuses to do

- **It does not count green CI as a deploy.** A release is verified only when
  its notes link an Actions run in this portfolio that concluded `success` and
  was created after the release was published. Unverified releases are listed
  by name in gray with the reason.
  [ADR 0001](adr/0001-a-deployment-is-a-verified-release.md).
- **It does not measure people.** Team-level only, by construction: the query
  cannot ask for a person and the collected data cannot carry one.
  [ADR 0002](adr/0002-team-level-only-by-construction.md).
- **It does not hide a small denominator behind a percentage.** See the
  printing rules.
- **It does not claim real time.** The card prints its generation date. A
  stale card declares itself.
- **It does not write to the repository.** Permissions are `contents: read`,
  `pages: write`, `id-token: write`. Output is a Pages artifact.

## What the numbers do not cover

- Two repositories, `twoseat` and `flightdeck`, over a 90-day window. The last
  100 merged pull requests per repository is a cap, and the dashboard footer
  says so.
- No production service exists in this portfolio, so time to restore is a
  definition waiting for its first event, and change failure counts
  bug-labeled pull requests, not incidents.
- A solo maintainer merges. The gate-bypass tile measures whether the review
  gate was honored, not whether a second person agreed.
- Issue aging is defined in [metrics.md](metrics.md) and not computed: it was
  cut when the code passed the line cap. [cut at the line cap]

## Where to look

- Definitions, gaming analysis, and cross-check for every tile:
  [metrics.md](metrics.md).
- Operating procedures: [runbook.md](runbook.md).
- The raw numbers behind the page: `latest.json` beside `index.html` on the
  published site, in the shape `src/cli.ts` writes.
