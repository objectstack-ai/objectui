---
---

**Chosen: make the parser see the form — ⛔ not narrow the charter.**
`scripts/cross-file-line-citation-census.mjs` now opens the continuation scope
on a bare FILENAME as well as on a full `NAME` plus address, so a docblock that
writes "`ObjectKanban.tsx` reads `schema.groupBy` at" and then a run of bare
addresses is read instead of scored empty (objectui#9026). Tooling and tests
only; no package is released by this change.

**What was actually broken.** Scope opened ONLY on a full address, so a filename
carrying no number of its own put nothing in scope and every bare address under
it was, to the scanner, a colon and a number. `ObjectKanbanSchema.groupBy`
carried six of them into `plugin-kanban`'s renderer and every one had rotted;
the census scored the docblock **empty** and `check:new-line-citations` reported
`0 new citation(s)`. ⇒ The gate was not report-only about that class, it was
**silent** on it, and the charter named the class as covered.

**⛔ The proximity window was NOT the cause, and it did not move.** With the
trigger absent, that docblock reads 0 of 6 at ANY window — no window can carry a
file that never entered scope — so the window stays at its shipped value. It is
deliberate, it is the guard that keeps a bare address from being a colon and a
number, and widening it to reach one further address would have admitted 14 more
rows of which three are a port, a cron minute and a Chinese enumeration.

**Backlog measured BEFORE the change, so the two numbers stay separable.**
Tree-wide population 1201 → 1271; 74 citations become visible and 4 are
re-attributed to the file the prose actually names. Citations FALSE against
today's tree: 532 → 561. Roughly eight of the newly visible rows are ports or
JSON literals rather than citations, named in the pull request body rather than
tuned away. ⛔ Enforcement is untouched (`report-only`) and this change ⛔ does
not flip it: the number above is the reason to leave it where it is for now.

Two follow-on effects, both measured: an address written after a second filename
on the same line now goes to the file written to its LEFT rather than to
whichever match the line ended on, and a blank line ends the scope.
