---
'@object-ui/plugin-form': patch
---

A master-detail form's child grid no longer offers a cell the CALLER may read but not edit (objectui#10163).

**What it was.** The companion objectui#10163 entry routed the `record:line_items` panel's columns through the render pass the record-form containers share. The master-detail form's own child grid (`object-master-detail-form`) renders through the same line-items widget and read no field-level permission, so a child column the caller's permission set marks `editable: false` rendered as a live, editable cell — inviting an edit the server refuses.

**What changed, in observable terms.**

- Each child collection's columns now go through that same pass: a child column the caller may read but not edit renders its cells locked (on loaded rows and on the entry row alike), and a child column the caller may not read is omitted, exactly as the line-items panel does. Columns the caller may edit are unchanged.
- With no permission provider mounted the grid is exactly as before — every cell editable. That fail-open posture is objectui#10161's and is not moved here; the server still enforces.
- The per-row "expand to full form" editor is unchanged: it is a record form and already rendered through the form containers' pass.

**Clause-②: no** — no exported symbol is added, removed, renamed or retyped, and no prop changes. No authored key changes meaning and no accept set is relaxed.
