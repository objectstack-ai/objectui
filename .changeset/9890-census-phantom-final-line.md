---
---

**A file is as long as `wc -l` says, not one line longer.**
`scripts/cross-file-line-citation-census.mjs` computed a cited file's length as
`text.split('\n').length`, which counts the terminator of the last line as a
line of its own on every file that ends in a newline — nearly all of them. The
read now goes through a named `fileLines` helper that drops that trailing
terminator (objectui#9890). Tooling and tests only; no package is released by
this change.

**Two things the phantom element did.** The `(file has N lines)` the census
prints beside an `out-of-range` citation was one too many. And a citation
addressing that phantom index passed the range check, was scored against the
empty string the terminator left behind, and came back `non-substantive`
instead of `out-of-range` — a citation genuinely past the end of a file,
reported as a citation to a blank line.

**⛔ The repair is not a blanket `length - 1`, and could not be.** A file that
does not end in a newline has no trailing empty element and its real last line
is the one a blanket subtraction would delete; this tree contains such files.
Exactly one trailing empty element is dropped, which is also the right answer
for a file ending in a blank line — that file has a genuinely empty last line
*and* a terminator, and only the terminator goes.

**No headline count moves, and that was measured rather than argued.**
`out-of-range` and `non-substantive` are both members of `FALSE_VERDICTS` in
the census and both map to `'false'` through `classify` in
`scripts/check-new-cross-file-line-citations.mjs`, which imports this `judge`
and therefore inherits the repaired boundary without a line of it edited. Run
against this tree before and after, the census population, every per-verdict
count and both content-addressed controls are identical; what changes is the
length printed beside each `out-of-range` row.
