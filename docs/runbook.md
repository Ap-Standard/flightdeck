# Runbook

Operating flightdeck. Every procedure here is a command or a place to look;
the reasoning lives in [how-it-works.md](how-it-works.md) and the decision
records under `adr/`.

## Run it now

```bash
gh workflow run nightly.yml -R Ap-Standard/flightdeck
gh run list -R Ap-Standard/flightdeck --workflow nightly.yml --limit 1 --json databaseId,status,conclusion,event
gh run watch <databaseId> -R Ap-Standard/flightdeck --exit-status
```

A manual run is counted apart from scheduled runs on the reliability tile, so
dispatching one hides nothing. The page updates when the `deploy` step
finishes; the card's `generated YYYY-MM-DD UTC` text is the proof the new
render landed.

## Run it locally

```bash
npm ci
npx tsx src/cli.ts --fixtures                      # offline, from test/fixtures; what CI runs
GITHUB_TOKEN=$(gh auth token) npx tsx src/cli.ts   # live; writes site/
```

Then open `site/index.html` in a browser. `site/` is ignored by git; the
repository never carries a rendered copy.

## Re-enable after GitHub's 60-day inactivity disable

GitHub disables a scheduled workflow after 60 days without repository activity
and emails the owner. The card's date stops advancing and the reliability tile
stops counting. Re-enable with one command. No keepalive commit.

```bash
gh workflow list -R Ap-Standard/flightdeck --all      # a disabled workflow shows disabled_inactivity
gh workflow enable nightly.yml -R Ap-Standard/flightdeck
gh workflow run nightly.yml -R Ap-Standard/flightdeck
```

## The token, and the PAT fallback

`nightly.yml` reads with
`${{ secrets.FLIGHTDECK_READ_TOKEN || secrets.GITHUB_TOKEN }}`. With no
`FLIGHTDECK_READ_TOKEN` secret set, the expression falls back to the run's own
`GITHUB_TOKEN`, which reads public repositories. If a run fails with
`GraphQL returned no repository for Ap-Standard/<name>` or a `403` from an
Actions endpoint, the token cannot read across repositories. The fallback
needs no workflow change:

1. The maintainer creates a fine-grained personal access token in GitHub
   settings: resource owner `Ap-Standard`, access to the measured
   repositories, repository permissions `Contents: read-only`,
   `Metadata: read-only`, `Pull requests: read-only`, `Actions: read-only`,
   an expiry, nothing else.
2. Store it as the secret, pasting at the prompt so it never touches a shell
   history line or a file:

   ```bash
   gh secret set FLIGHTDECK_READ_TOKEN -R Ap-Standard/flightdeck
   gh secret list -R Ap-Standard/flightdeck
   ```

3. Dispatch a run. The `||` picks the new secret up on the next run.
4. Record the expiry date. A token that expires reproduces the original
   failure.

## Adding a repository

One line in `flightdeck.config.json` and one fixture entry.

1. Add `{ "name": "<repo>", "aiReview": true }` to `repos`. Set `aiReview` to
   `false` for a repository that does not run twoseat; its pull requests then
   stay out of the gate-bypass rate.
2. Add a `"<repo>"` entry to `test/fixtures/repos.json` in the same shape as
   the existing ones, with `body` set to `null` and no login anywhere.
3. Run `npm test` and `npx tsx src/cli.ts --fixtures`. Adjust the hand-derived
   expected values in `src/metrics/metrics.test.ts` for the new fixture data.
4. Open a pull request. A deleted or renamed repository fails the nightly loud
   with `GraphQL returned no repository`, so remove a repository from the
   config before deleting it.

## What a failed nightly looks like

- GitHub emails the repository owner on a failed scheduled run; no issue is
  filed.
- `gh run list -R Ap-Standard/flightdeck --workflow nightly.yml --limit 5`
  shows the conclusion per run.
- `gh run view <id> -R Ap-Standard/flightdeck --log-failed` prints the failing
  step. The program prints counts (the `--fixtures` render prints
  `twoseat: 4 merged PRs, 1 releases`) and error messages, never a body or a
  full API response.
- The published page is the last successful render. Its card date and the
  reliability tile show the gap.
- Common causes: the token cannot read a repository (see the fallback above);
  a repository in the config was deleted or renamed; a GitHub API outage,
  which the client retries once before failing.
