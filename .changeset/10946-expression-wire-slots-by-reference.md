---
'@object-ui/types': minor
---

A spec-shape conditional-formatting rule's `condition` and a bulk action's `visible` now declare the named view's own expression slots, read by reference from `@objectstack/spec` (objectui#10946).

- `SpecConditionalFormattingRule.condition` was `string`. It is now `string` or the protocol's `ObjectListViewSchema.conditionalFormatting[].condition` slot, which adds the `{ dialect, source }` envelope that `objectstack build` emits. The widening reaches every type built on the rule: `ConditionalFormattingRule`, `KanbanConditionalFormattingRule`, and the `conditionalFormatting` members of `ObjectGridSchema`, `ListViewSchema`, `ObjectKanbanSchema` and `NamedListView`.
- `BulkActionDef.visible` keeps its arm `ExpressionWire` (a string or `{ dialect?, source }`), which it now names instead of spelling inline. It gains the protocol's `bulkActionDefs[].visible` slot as a second arm. On the installed spec that envelope makes `source` optional and may carry `ast` and `meta`.
- The zod mirror moves with the type. The list view's and the kanban board's rule unions share one `condition` schema. `z.string()` is its first arm, so a string condition parses exactly as before: it is not canonicalized into an envelope, and `''` is still accepted. The spec's own slot schema is the second arm, taken by reference, so `safeValidateSchema` (what `os validate` and `os check` run) now accepts an envelope condition on `list-view` and `object-kanban` nodes and refuses one the protocol refuses.

Why: both members were narrower than the protocol declares and than the grid's evaluator reads. `resolveConditionalFormatting` and the bulk-eligibility fold both accept the envelope. So every relay of a named view into a grid needed a type assertion. `@object-ui/plugin-view`'s route-2 `ObjectView` loses its two. Nothing changes at runtime: no evaluator, renderer or relay changed behaviour. The compiled output of the removed assertions is unchanged.

The two spec lines differ, and these members follow the installed one. The published slot is `ExpressionInputSchema` (`source` or `ast`). Spec `main` narrows it to `EvaluatedExpressionInputSchema`, which requires a non-blank `source`. No engine evaluates `ast` today. So an `ast`-only envelope, which the installed slot admits, is evaluated as a fault: the formatting rule does not match, the bulk def qualifies no record, and the fault is warned.

**Breaking for TypeScript readers of these members, released as `minor`** under this repo's version-alignment rule (the fixed group's major follows `@objectstack`). Code that reads `rule.condition` as a `string`, or reads `def.visible.source` as a `string`, stops compiling. Narrow on `typeof` first, as the shared evaluator does. Code that writes these members compiles unchanged.

Pins: `spec-expression-wire-slots-10946.test.ts` in `@object-ui/types` covers the relays with no assertion, the zod twin's input equalling the TS member, envelope acceptance with string and empty-string controls, and the reference identity of the spec arm. `specExpressionWire-10946.test.tsx` in `@object-ui/plugin-grid` covers the real grid painting an envelope-matched row, the bulk fold reading `source` beside `ast`, and the `ast`-only fault on both.

**Note, 2026-10-01 (objectui#11322, shipping in this same release).**
The `ast`-only reading above changed for the bulk def after this entry was
written. The grid's selection bar now asks the action family's one "is a gate
declared?" definition (`hasDeclaredVisibilityGate`) before the bulk fold, as
the row menu and the toolbars already did, and that definition reads an
envelope with no `source` as no gate.
- An `ast`-only bulk `visible` is no gate: the button shows and every selected
  record qualifies, with no warning. The formatting rule's `ast`-only
  `condition` is unchanged: it does not match, and the fault is warned.
- `specExpressionWire-10946.test.tsx` pins the formatting fault and, for the
  bulk def, the no-gate answer.

So the sentences above that say the bulk def qualifies no record, and that the
test file pins the `ast`-only fault "on both", describe the tree at
objectui#10946, not the code in this release. See objectui#11322's changesets
for `@object-ui/plugin-grid` and `@object-ui/types`.

⚠️ **Dated note, 2026-10-03 — the kanban rule is no longer a union — objectui#11522.**
At this change the kanban board's rule was a union of two dialects (the native
`{ field, operator, value }` comparison and `{ condition, style }`), and the
sentence above that says "the list view's and the kanban board's rule unions
share one `condition` schema" describes that union. Now the kanban rule is ONE
object, the spec list view's `{ condition, style }` rule by reference, and the
native and flat-colour dialects are refused by name on `object-kanban`. It still
reads the same `condition` schema, so everything this entry says about the
condition (the `z.string()` first arm, the envelope, the `''` control, the
reference identity of the spec arm) still holds on `object-kanban`, and
`spec-expression-wire-slots-10946.test.ts` still pins it there, now reading
`condition` straight off the rule's shape. The rest of this entry is kept as
the reading of this change.

⚠️ **Dated note, 2026-10-03 — the list view's (and the grid's) rule is no longer a union either — objectui#11533.**
At this change the list view's rule, which `ObjectGridSchema` shares, was also a
union of two dialects (the native `{ field, operator, value, … }` comparison and
`{ condition, style }`), so the sentence above about "the list view's and the
kanban board's rule unions" described two unions. Now neither is one: the grid's
and the list view's rule is ONE object, the spec list view's `{ condition, style }`
rule by reference, with the native rule, its `expression` and a top-level colour
refused by name. It reads the same `condition` schema, so everything this entry says
about the condition (the `z.string()` first arm, the envelope, the `''` control,
the reference identity of the spec arm) still holds on `list-view` and
`object-grid`, and `spec-expression-wire-slots-10946.test.ts` now reads
`condition` straight off the list view's rule as well. `ConditionalFormattingRule`
is still built on `SpecConditionalFormattingRule`, so the widening this entry
describes still reaches it. The rest of this entry is kept as the reading of this
change.
