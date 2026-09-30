---
'@object-ui/app-shell': minor
---

`ConditionBuilder` now takes a caller-supplied **subject vocabulary** instead of hardcoding a
record-scoped one.

The builder built every row subject as `record.` + field name, plus a fixed `record.id` /
`user.*` / `org.*` context list. That is correct for all five files that mount it today — six
mount sites, since `ActionDefaultInspector` mounts it twice — because every one of them is a
record-scoped site. It is wrong for a **flattened**-scoped site such as the flow designer's
entry condition, where the trigger record's fields *are* the top-level evaluation context
(bare `status`) and the prior values arrive as `previous.FIELD`. This repo's own
`flow-scope.ts` already computes that distinction (`fieldPrefix: onStart ? '' : 'record.'`,
`includePrevious`), and objectstack's `packages/formula/src/validate.ts` defines the two
scopes.

⚠️ **Dated note, 2026-09-29 — the mount count above has since moved — objectui#6226.**
"all five files that mount it today — six mount sites" above held when this change landed
(`88b15fddc`). Later in this same release objectui#6226 (PR objectui#6668) mounted it in
`FlowNodeConfigField` for the flow Start node's entry condition, a flattened-scope site
that passes its own `subjects`. Re-measured for objectui#10979 on `main` at `2eaf5be27`,
six non-test files mounted `ConditionBuilder`, at seven sites, so "every one of them is a
record-scoped site" no longer held either. `.changeset/flow-entry-condition-builder.md`
(PR objectui#6668) states what ships; the text above is kept as the reading of this
change.

A new optional `subjects` prop declares what a site actually binds:

- `fieldPrefix` — defaults to `'record.'`; `''` declares a flattened scope.
- `includePrevious` — also offer `previous.FIELD` per field, plus the whole-record `previous`
  token, which is what makes the create-path idiom `previous == null` **selectable** rather
  than something the author has to recall from help text.
- `context` — replace the context subjects, so a flattened site does not inherit `record.id`,
  a root it does not bind. Offering it there would make this editor emit the one spelling its
  own sibling ref-check flags as out of scope.

Declared, never inferred: the component does not guess a site's scope from the value it is
handed. **A caller that declares nothing gets exactly the previous behaviour** — the option
list, the `record.` prefix on a compiled row, and the single-quoted value spelling are all
pinned positively against that default, so changing it fails rather than re-baselines.

**Double-quoted string literals now round-trip into row mode.** `unfmtValue` stripped only
single quotes while `fmtValue` re-emitted only single quotes, so `status == "done"` could
never survive the builder's byte-for-byte adoption check and was handed to the raw CEL editor
— even though double quotes are what the entry-condition placeholder teaches and what every
shipped example flow uses. Each row now remembers the quote character it was parsed with and
re-emits that one, so the author's own spelling is preserved rather than normalised, and the
byte-for-byte safety rule is kept exactly as it was rather than loosened. Rows built in the
builder still emit single quotes, unchanged.

Measured against the shipped corpus — every start-node entry condition in objectstack's
example apps plus the HotCRM example from objectui#6226 — row-mode adoption goes from 3/17 to
15/17. The two that remain on raw mode are `&&` mixed with a parenthesised `||` group: a
grammar limit of the row model, unrelated to subjects, and out of this card's scope.

The component is not re-exported from the package index, so no external caller can pass the
new prop yet; the wiring that will (objectui#6226) is a separate card. Scored `minor` for the
added capability rather than `patch`, since the widening is real even while its only future
caller is in-repo.
