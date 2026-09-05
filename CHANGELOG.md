# Changelog

This file records every notable change to flightdeck. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Each entry names
the pull request that carried the change and the mechanism it introduced.

## [Unreleased]

### Added

- The engine, in one pull request ([#1]). One GraphQL query per repository
  through global `fetch` with no runtime dependency; collection that drops
  every body and per-person field before anything is published; six tiles,
  each shipping a definition, a gaming analysis, and a cross-check; and three
  rendered files, `index.html`, `card.svg`, and `latest.json`. Two printing
  rules in one module: an empty set prints "not measured" and a rate under 10
  events prints as a count.
- Workflows ([#1]). `checks.yml` runs lint, typecheck, the tests, and the
  fixtures render on every pull request, then fails on any unformatted value
  in the output or any tracked file git reads as binary; a separate `gitleaks`
  job scans history. `ai-review.yml` runs twoseat at `v0.1.0`, comment-only.
  `nightly.yml` collects from the GitHub API on `cron: '23 6 * * *'` and
  publishes `site/` through Actions-mode Pages with no branch written.
- Documentation ([#1]). `docs/how-it-works.md`; `docs/metrics.md`, with issue
  aging kept as a definition under a cut tag; `docs/runbook.md`; and two
  decision records: a deployment is a verified release, and team-level only by
  construction.

[Unreleased]: https://github.com/Ap-Standard/flightdeck/commits/main
[#1]: https://github.com/Ap-Standard/flightdeck/pull/1
