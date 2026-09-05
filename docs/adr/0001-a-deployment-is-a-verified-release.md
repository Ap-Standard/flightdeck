# ADR 0001: A deployment is a verified release

Status: accepted, 2026-09-05.

## Context

DORA's deployment frequency and lead time both need a definition of
"deployed". This portfolio has no production service, so the candidates are a
merge to `main`, a green CI run, or a GitHub release. Each can be produced
without anyone checking that anything works: a merge is a click, a green run
is a build, a release is a form.

## Decision

A deployment is a published, non-draft, non-prerelease release whose notes
carry a level-2 heading `## Verified` followed by a link to an Actions run in
this portfolio that concluded `success` and was created after the release was
published. flightdeck confirms the run through one REST call and counts
nothing else as a deploy. The link is written by hand after publishing, which
is the point: someone looked afterward and left evidence where the dashboard
can check it.

The convention is the one twoseat's runbook prescribes for cutting a release,
so both repositories follow one rule.

## Consequences

- Green CI is not a deploy. A release with no Verified section is listed by
  name in gray with the reason, never hidden and never counted.
- Lead time inherits the definition, merge to first verified release, so it
  cannot be shortened by relabeling a CI run.
- The check is gameable by pasting the heading with any link. The cross-check
  lists every unverified release, and a pasted link to a failed run, a run
  outside the portfolio, or a run older than the release fails the detector by
  construction.
- The definition costs one REST call per published release per night.
