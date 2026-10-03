---
'@object-ui/types': minor
'@object-ui/plugin-grid': minor
---

**BREAKING for authors of `object-grid` and `list-view` row rules, released as `minor`.** `conditionalFormatting` on `ObjectGridSchema` (and so on the `object-view` `table` slot built from it) and on `list-view` takes ONE rule dialect, the spec list view's `{ condition, style }`: a CEL `condition` over the row's `record.*` and a CSS `style` map. The native dialect it used to take beside it is retired with no alias window and refused by name (objectui#11533), as objectui#11522 did for `object-kanban`.

| Rule on `ObjectGridSchema`, an `object-view` `table` or a `list-view` | Before | Now |
|---|---|---|
| `{ condition, style }` | accepted | accepted, unchanged |
| native `{ field, operator, value, backgroundColor?, textColor?, borderColor?, expression? }` | accepted on every face | refused at `field`, `operator`, `value` and at each colour key and `expression` written |
| `{ expression, backgroundColor }` (no native triple) | refused as a bare union failure | refused at `expression` and the colour key, naming the retirement |
| flat CEL `{ condition, backgroundColor }` (a colour beside `condition`, no `style`) | refused as a bare union failure | refused at the colour key, naming the retirement |
| `{ condition, style, backgroundColor }` | accepted by `safeValidateSchema` (the colour key was stripped from the parse, then painted by the grid anyway) | refused at the colour key |
| `{ condition, style, label }` (any other undeclared key) | accepted by `safeValidateSchema` | refused as an unrecognized key, with the spec rule's own message |

Each refusal message names the key, objectui#11533 and the `{ condition, style }` respelling, on `ObjectGridSchema`, `ListViewSchema`, `safeValidateSchema` and `StrictAnyComponentSchema` alike.

**Respelling.** `{ field: 'priority', operator: 'equals', value: 'high', backgroundColor: '#fee2e2' }` is `{ condition: "record.priority == 'high'", style: { backgroundColor: '#fee2e2' } }`. `not_equals` is `!=`, `greater_than` is `>`, `less_than` is `<`, `contains` is `record.f.contains(…)` and `in` is `record.f in [ … ]`. An `expression` predicate becomes the `condition`, written as CEL over `record.*` with no `${…}` wrapper. A top-level colour moves into `style`; `textColor` is `style.color`.

**Not judged here: an authored `object-grid` node's `properties` bag.** Its members are `@objectstack/spec`'s `ComponentPropsMap['object-grid']` row by reference (objectui#11276), and the installed spec types that row's `conditionalFormatting` as `unknown`, so the bag judges the member as the installed spec does. objectui does not narrow the spec's row.

**`@object-ui/types`.**

- `ConditionalFormattingRule` (exported from `@object-ui/types`) is now an interface that extends `SpecConditionalFormattingRule`, with `field`, `operator`, `value`, `expression`, `backgroundColor`, `borderColor` and `textColor` declared `?: never`. It used to be the union of `ObjectUIConditionalFormattingRule` and `SpecConditionalFormattingRule`. It types the `conditionalFormatting` members of `ObjectGridSchema` and `NamedListView`; the `ListViewSchema` type's member is the zod rule's input, with the same keys. Every published type built on those members follows, for example the rules parameter of `@object-ui/plugin-list`'s `evaluateConditionalFormatting`.
- `ObjectUIConditionalFormattingRule` is removed from `@object-ui/types`. Importing it is a compile error (TS2305).
- The zod rule the `ObjectGridSchema` and `ListViewSchema` mirrors (both on the `@object-ui/types/zod` barrel) share is module-private. It is the spec `ListViewSchema.conditionalFormatting` rule taken by reference and extended, not a union. It keeps the spec rule's strictness and its `style` map. Its `condition` is the same schema as before, so a string condition is still not canonicalized into an envelope and `''` is still accepted. The seven retired keys are retirement tombstones.

**`@object-ui/plugin-grid`.** The `object-grid` registration's `conditionalFormatting` input description now describes the one rule and names the retired spellings. `ObjectGridProps.schema.conditionalFormatting` follows the narrowed type.

**Not changed: what a grid or a list view paints.** The shared evaluator, `resolveConditionalFormatting` in `@object-ui/core`, keeps every arm as a compatibility read for rules already STORED in the native dialect, and nothing on the render path parses a stored view, so a grid or list view saved with a native rule still paints exactly as before. A `{ condition, style }` rule paints exactly as before too. Only the authoring faces narrowed.

Pins: `packages/types/src/__tests__/grid-list-view-conditional-formatting-11533.test.ts` pins every refusal on the six zod faces and carriers, the spec rule's identity and strictness, and the TS face. `gridRowDecorationMembers-8071.test.tsx` in `@object-ui/plugin-grid` pins a stored native rule refused at authoring and painted by the real grid, with its respelling as the control, and `ListView.storedRuleDialect-11533.test.tsx` in `@object-ui/plugin-list` pins a stored list view handing its native rules to its grid untouched.
