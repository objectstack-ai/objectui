---
'@object-ui/plugin-form': patch
---

A `record:line_items` grid no longer offers a cell the CALLER may read but not edit (objectui#10163).

**What it was.** objectui#10120 taught the record-form containers to render a field the caller's permission set marks `editable: false` as disabled, through one shared render pass. The line-items panel stayed outside that pass: it read `readonly` and nothing else, so on the same page the same column rendered as a live, editable cell — inviting an edit the server refuses.

**What changed, in observable terms.**

- The panel's columns now go through the same render pass the form containers use, adapted to the grid: a column the caller may read but not edit renders its cells locked (on loaded rows and on the entry row alike), and a column the caller may not read is omitted, exactly as the forms omit such a field. Columns the caller may edit are unchanged.
- Adding and removing lines are unchanged: they still follow the panel's `readonly`.
- With no permission provider mounted the grid is exactly as before — every cell editable. That fail-open posture is objectui#10161's and is not moved here; the server still enforces.

**Clause-②: no** — no exported symbol is added, removed, renamed or retyped. The new column adapter lives in a module `@object-ui/plugin-form`'s entry does not re-export. No authored key changes meaning and no accept set is relaxed.

**Not here.** The master-detail form's own child grid (`object-master-detail-form`) carries the same gap and is not changed by this release; objectui#10163 stays open for it.
