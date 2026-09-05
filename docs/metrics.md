# Metrics

Every tile on the dashboard carries four things: a definition, the way the
number gets gamed, the cross-check that exposes the gaming, and the number.
This file is the hand-written source for the first three; the modules in
`src/metrics/` carry the same text, and a test fails the build if any tile
ships without all three. Window: 90 days. Rates under 10 events print as
counts. Empty sets print `not measured`.

## Verified releases

**Definition.** Published, non-draft, non-prerelease releases in the window
whose notes hold a level-2 heading exactly `## Verified`, followed on the next
non-empty line by a link of the form
`https://github.com/Ap-Standard/<repo>/actions/runs/<id>`. The run must be in
a measured repository, must have concluded `success`, and must have been
created after the release's `publishedAt`, confirmed by one REST call per
release. Green CI is not a deploy; a run that happened before the release
proves nothing about the release.

**Why it matters.** Deployment frequency is the DORA metric that gets faked
first, because "deployed" has no natural definition in a repository without a
production service. Here it has one: somebody looked after publishing, and
left a link the dashboard can check.

**How it gets gamed.** Paste the heading with any link. Cut trivial releases to
inflate the count.

**Cross-check.** Every unverified release in the window is listed by name in
gray with the reason the detector gave: no Verified heading, no run link under
it, a run outside the portfolio, a run that does not exist, a run that did not
succeed, or a run created before publish. The list is never hidden; an empty
list prints "none in the window".

## Lead time

**Definition.** Median hours from a pull request's `mergedAt` to the
`publishedAt` of the first verified release after it in the same repository,
over merged pull requests in the window. Not measured until 3 pull requests
qualify. Lead time looks for the next verified release in the repository
regardless of the window, while change failure counts only releases verified
inside the window; the two tiles answer different questions and are not meant
to reconcile.

**Why it matters.** It is the DORA lead-time-for-changes metric with the
deploy half defined by the tile above, so it cannot be shortened by relabeling
a CI run.

**How it gets gamed.** Release after every merge. Hold work in branches so it
never counts as merged.

**Cross-check.** Two lines beside the number: release debt, the count of
merged pull requests in no verified release; and the median pull-request cycle
time from `createdAt` to `mergedAt`, which a release-after-every-merge habit
leaves untouched.

## Gate-bypass rate

**Definition.** Merged pull requests carrying the `gate-bypass` label over
merged pull requests since the policy start date, in repositories with
`aiReview: true` in the config. The policy start is twoseat's v0.1.0
`publishedAt`, `2026-09-04T18:07:16Z`, read from the release by
`gh release view v0.1.0 -R Ap-Standard/twoseat --json publishedAt` and written
to `flightdeck.config.json`. Pull requests merged before it bucket as
pre-policy: counted, not rated.

**Why it matters.** A review gate that can be skipped silently is a
suggestion. The label is the honest way to skip it; this tile measures whether
the honest way was used.

**How it gets gamed.** Skip the label.

**Cross-check.** Unlabeled bypasses: pull requests since the policy start
whose latest twoseat comment decided `block` or `not-reviewed`, whose comment
has no Decision row, or that have no twoseat comment at all, and that carry no
`gate-bypass` label. Each is listed with a link. The most recently created
twoseat comment on a pull request is the one read.

## Change failure

**Definition.** Verified releases in the window followed within 7 days by a
merged pull request labeled `type:bug` in the same repository, printed as
`n of m`.

**Why it matters.** The DORA change-failure rate needs an incident record this
portfolio does not have. Bug-labeled fixes within a week are the nearest honest
proxy, and the tile says so by printing a count.

**How it gets gamed.** Leave fixes unlabeled. Label them after day 7.

**Cross-check.** Label coverage: the share of merged pull requests in the
window carrying any `type:` label. And a list of merged pull requests with
"fix" in the title that carry no `type:bug` label, each linked.

## Measurement reliability

**Definition.** Of the last 30 UTC nights before tonight, counting only nights
on or after the nightly workflow's first listed run, how many had a run of
`nightly.yml` complete with `success`. Read from the workflow's own run list
through the Actions REST API. Scheduled runs and manual dispatches are counted
apart.

**Why it matters.** A dashboard that silently stops updating keeps showing its
last good numbers. GitHub disables a scheduled workflow after 60 days without
repository activity; this tile, together with the generation date on the card,
makes the silence visible.

**How it gets gamed.** Backfill missed nights with manual runs.

**Cross-check.** The count by trigger is printed on the tile, so a manual
backfill shows as manual. The run list is linked. A night with both a
scheduled and a manually dispatched success counts once in the headline and
once in each trigger row, so the two rows can sum above the headline; the rows
describe how the nights were produced, not a second total.

## Time to restore

**Definition.** Median hours from a verified release that introduced a
regression to the verified release that restored service. No production
service exists in this portfolio, so the set is empty and the tile prints
`not measured`. The definition is published now so it activates on the first
regression without a definition change.

**How it gets gamed.** Report zero.

**Cross-check.** `src/format.ts` prints `not measured` for an empty set and
never prints 0 for a rate with no denominator; a test holds it there.

## Issue aging [cut at the line cap]

Not computed. The build that included this tile measured over the 1,100-line
hard cap by the line-count gate (`wc -l` over `src`, `test`, `.github`, and
the config files) before the first pull request opened, and the rule is that a
tile over the cap is cut, not squeezed in. The definition stays here so
re-adding it is one module, one test, and one query field.

**Definition.** Median age in days of open issues, and the count open for more
than 30 days, per repository.

**How it gets gamed.** Bulk-close as not planned.

**Cross-check.** Closures with state reason `NOT_PLANNED` in the last 30 days,
shown beside the median.
