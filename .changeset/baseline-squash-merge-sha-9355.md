---
---

Build-tooling provenance only; nothing published changes.

`BASELINE` in `scripts/check-eager-closure-budget.mjs` gains a second commit field,
`squashMerge`, beside the existing `commit`. ⛔ No ceiling, baseline, threshold or
ratchet moves, and ⛔ what `commit` names is unchanged — the docblock's standing ruling
that it must name the tree the reading was taken on is left exactly as written.

The thing it buys: `commit` names a branch tip, this repository squash-merges, and the
object therefore does not exist in any `main` checkout (`git cat-file -t` exits 128 in a
clone that `git rev-parse --is-shallow-repository` reports as `false`, so the absence is
genuine). The squash that carried the same branch onto `main` does resolve, and carrying
it AS DATA drags it under the existing positive pin that holds every commit the
constant carries to its own attached prose. A prose hash on this constant is guarded by
nothing; a carried one cannot go stale in silence — and this change was open long enough
to be shown that rather than argue it. A re-baseline landed on `main` underneath it,
rewrote the block, and took the prose handle out with it: on `main` today the squash of
the tree the constant names appears nowhere in the repository, while the field below
carries it under the pin.

The ledger case in `scripts/__tests__/check-eager-closure-budget.test.ts` that records
what each baseline carries as data is re-pinned to the exact new pair. It is still
positional and still exact: it was not widened, and a re-baseline that cannot yet name
its own squash sha is meant to red there and be re-pinned deliberately.
