---
---

Give the eager-closure gate's ceiling-sensitivity half a LOWER bound
(objectui#8554). It refused a ceiling that had drifted more than one regression
ABOVE its payload and said nothing at all about one whose headroom was spent, so
a chunk sitting one byte under its ceiling drew a green tick until an ordinary
change turned the trunk red — and, once, turned an unrelated pull request red in
the merge queue for another diff's bytes.

The bound is a tenth of `REGRESSION_THIS_GATE_MUST_CATCH_BYTES`, which is the
convention every deliberate re-pin in this file already sized its headroom by.
The two rows measured under it on the day it landed are declared, at the byte, in
a pinned allowance table that can only be paid down; those allowances are
compared at a hundredth of a regression rather than at the byte, so a declared
row reds only on drift the gate's own table can actually show having moved. CI
script and its tests only; no package is released by this change.
