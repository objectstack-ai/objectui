---
---

Tooling only, no published package touched: the two whole-tree filesystem sweeps
under `scripts/` that start at the repository root now skip `.objectui-tmp`.

`.objectui-tmp` is not clutter, it is a LIVE directory. `withGeneratedApp()` in
`packages/cli/src/__tests__/app-generator.test.ts` mkdtemps a generated app under
`<repo>/.objectui-tmp/` and removes it in a `finally`, inside the same test shard
`check:i18n-dead-keys` runs in. That gate's safety net is a `grep -rFn` over the
whole tree, and its skip set did not name the directory — so the sweep descended
into a scratch tree that was being torn down underneath it. GNU grep answers a
file error with exit **2**, even on a run that also matched, and the gate absorbs
only exit 1 (`no match`) and re-throws everything else. The gate therefore did not
print a warning, it **died**, turning the shard red for a reason unrelated to the
code under test.

That is a defect, not a flake: what varies is the interleaving, not the outcome
once the two overlap. The exclusion is the fix — ⛔ not a wider catch (an absorbed
IO error returns an empty footprint, which reads as "this key is dead"), and ⛔ not
a change to the producer, which is correctly cleaning up after itself.

- `scripts/check-i18n-dead-keys.mjs` — `TEXT_SWEEP_SKIP_DIRS` gains `.objectui-tmp`.
- `scripts/body-dialect-census.mjs` — `SKIP_DIRS` gains it for the same reason;
  measured to reach the root and descend dot-directories, so it was over-reporting
  scratch output as corpus.

`scripts/check-comment-mask-corpus.mjs`, the sibling whole-tree sweep, has excluded
the directory on this reasoning all along. Both changes are pinned by two-sided
tests: the same bytes planted under `.objectui-tmp/` and in a scanned directory, so
"absent from the output" cannot be satisfied by a sweep that walked nothing.

`.objectui-tmp` is `.gitignore`d, which is why no `git grep`-based tool in this tree
could see the omission and only a filesystem sweep ever hit it.
