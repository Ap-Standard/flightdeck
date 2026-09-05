## Direction and acceptance (Arthur)

What was decided, why, and what had to be true for this to merge. Link the
issue or decision record that carries it.

Closes #

## Implementation (Claude)

What changed, in mechanism terms. Name every public contract change: a tile's
definition, the config shape, the card layout, latest.json, the workflows.

## Verification

Paste the output of `npm run lint`, `npm run typecheck`, `npm test`, and
`npx tsx src/cli.ts --fixtures`, or link the CI run. A change to what a tile
counts needs a hand-derived expected value in the test beside it.

- [ ] Line count over `src`, `test`, `.github`, and the config files printed
      below, at or under 1,100.
- [ ] No em dashes. Every number carries its method and its as-of date.
- [ ] The ai-review seat ran on this pull request; its findings are addressed
      or waived with the `gate-bypass` label and the reasoning in a comment.

## Mechanism in two sentences

Two sentences the maintainer could repeat cold. If it takes more, simplify the
change before asking for a merge.
