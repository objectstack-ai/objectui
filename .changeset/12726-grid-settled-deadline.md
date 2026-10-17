---
'@object-ui/plugin-grid': patch
---

A grid date column stops drawing "Overdue Nd" in red on a row whose deadline is settled (objectui#12726). `@objectstack/spec` declares `settledWhen` on a `dueLike` date field: a per-record CEL predicate such as `record.status in ['returned', 'lost']`. While it holds, no overdue wording or colour applies. The grid now evaluates it against each row with the same evaluator and scope as its conditional formatting. A settled row's cell gets `dueLike: false` and draws the neutral relative date ("3 days ago"). All four ways the grid builds its columns do this: authored column objects, authored column names, inline rows and the object's field list.

Unchanged: a field without `settledWhen`, a row where the predicate does not hold, and a date that is not a deadline all render as before. The stage option's lifecycle `kind` (`won` / `lost`) settles nothing by itself, because the spec says "nothing reads an option's `kind` to settle a deadline". An object that wants closed records settled says so in `settledWhen`.

Clause-②: no
