---
"@object-ui/plugin-view": minor
---

**A stray `groupBy` in `viewOptions.kanban` no longer overrides the lane `generateViewSchema` resolved — the second route.**

`plugin-view`'s `generateViewSchema` kanban branch destructured
`columns`/`groupByField`/`groupField`/`titleField`/`conditionalFormatting` out of
`viewOptions.kanban` and spread the **rest** *after* its own `groupBy`. A
`groupBy` surviving in that bag therefore **overrode the lane the branch had just
resolved** from the canonical `groupByField`, and nothing said so — the board
simply grouped by the wrong field.

This is the **second route**, not a repeat of objectui#8365. `generateViewSchema`
runs precisely when no host supplied `renderListView` — the authored
`object-view` element — so it never passes through `ListView`, and PR
objectui#9236's destructure fix does not reach it. The same distinction the
`calendar` branch records for objectui#7029.

**BREAKING** (shipped as `minor`: all 41 packages sit in one `fixed` group, so
`major` is unavailable and would drag the group off `@objectstack`'s major —
AGENTS.md "版本号策略"). A **stored view that carries `kanban.groupBy` will now
render a different lane than it did before**: the canonical `groupByField` wins,
or — with no declared key at all — this branch's floor. That re-pointing is the
ruled intent, not a side effect, but it is a real change to what an existing
board displays and is stated here for that reason.

The affected population is narrow and was measured rather than assumed: the
contract half landed with PR objectui#9236 and already covers **both** routes —
the view-level `KanbanConfig` mirror declares `groupBy` as a named alias refusal
pointing at `groupByField`, so a view carrying the key is refused at every
validating door (`os check` / `os validate`, the VS Code extension) and `tsc`
refuses it at the authoring site. What remains, and what this change repairs, is
a pure **behaviour** gap: a document already in storage that never passed through
a validator.

Maintainer ruling of 2026-09-12 (decision batch #117 item 5, verbatim
「8365 同意」) — option B. Option A (strip the key and silently re-group) was not
taken. This card applies that ruling to the second route; it re-opens nothing.

**One measured difference from the `ListView` twin, and it is not cosmetic.**
This branch floors the lane at the **literal** `'status'`
(`groupByField || groupField || 'status'`), where `ListView` floors at
`detectStatusField(objectDef)`. So with the stray key alone, this route answers
`'status'` — measured on this tree, including against an object that declares no
`status` field — where the twin would answer `undefined`. The twin's assertion
for that arm was therefore **measured here rather than copied**, and both rows
are pinned so that "aligning" the two routes by swapping in the detector reddens
instead of passing quietly.

Level justified by measurement, not intuition:

- **Nothing stops rendering** — no crash, no new refusal at runtime; the board
  keeps rendering, with a different (correct) lane.
- **Nothing stops type-checking** — the type face (`groupBy?: never` on the
  inferred authoring surface) already landed with PR objectui#9236.
- **What an author can author today is unchanged** — the key is already refused
  at every validating door, so no newly-authored document can legally carry it.

Untouched, deliberately: the contract half (already covers both routes), the
**live** legacy alias `kanban.groupField`, `groupBy` on the generated
`object-kanban` node (the canonical lane key `ObjectKanban` reads), and
`ListView` itself. The `restKanban` passthrough is kept — an undeclared sibling
key still rides through onto the node, pinned as a control.
