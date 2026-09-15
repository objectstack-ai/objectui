---
---

Tooling and test-only: `scripts/check-test-path-roots.mjs` rejects a test that
resolves a path below `process.cwd()`, closing a class that produced 13 defects
in one day (objectui#7799) and that root `AGENTS.md` has taught with nothing
behind it since PR objectui#8952 (objectui#8953).

Nothing ships. No runtime source changed; the three repaired files are test
files, and the gate and its pin live under `scripts/`.

The detector is not a `process.cwd` grep, deliberately: one of objectui#7799's
own 13 defects was invisible to that card's census regex because it spelled the
read through `(globalThis as unknown as {…}).process.cwd()`. The scan starts at
the FILESYSTEM CALL and resolves what its path argument is rooted at, following
the file's own bindings, so a root laundered through a `const` — the shape of
both `examples/schema-catalog` instances, whose read lines carry no `cwd` at all
— is caught where a text search finds nothing. It classifies every root it can
and PRINTS the number it cannot, so a clean run is never read as a claim about
the whole class.

Readings on `87f174c00`: 1880 filesystem calls across 386 of 3036 test files;
8 cwd-rooted reads in 3 files, all repaired here and green under BOTH
invocations afterwards (repo root 611 tests, package directories 599 + 12).
