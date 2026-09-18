---
---

`scripts/check-lint-coverage.mjs`'s rule-2 ratchet banner no longer asserts, in
the present tense, which other gates carry the closing-keyword shape
(objectui#9906). It named two sibling gates and said the shape "still stands" in
both; one half was false when the sentence was written and the other went false
when the sibling was repaired. The trade-off the banner exists to explain —
spell the anchor `objectui#` rather than a bare `#`, so a quoted message cannot
match GitHub's closing grammar — is unchanged, and the scope record of the
repair that wrote it survives as history rather than as a reading of the tree.

`scripts/__tests__/check-lint-coverage-closing-keyword.test.ts` now also fails
if the banner names any other gate at all, with a control that restores the
removed sentence and proves the scan fires on it. Scripts and tests only; no
package is released by this change.
