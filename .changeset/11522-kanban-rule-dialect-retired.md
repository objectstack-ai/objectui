---
'@object-ui/types': minor
'@object-ui/plugin-kanban': minor
---

**BREAKING for authors of `object-kanban` card rules, released as `minor`.** `object-kanban`'s `conditionalFormatting` takes ONE rule dialect, the spec list view's `{ condition, style }`: a CEL `condition` over the card's `record.*` and a CSS `style` map. The two other dialects it used to take are retired with no alias window and refused by name (objectui#11522).

| Rule on `object-kanban` | Before | Now |
|---|---|---|
| `{ condition, style }` | accepted | accepted, unchanged |
| native `{ field, operator, value, backgroundColor?, borderColor? }` | accepted on every face | refused at `field`, `operator`, `value` and the colour key |
| flat CEL `{ condition, backgroundColor }` (a colour beside `condition`, no `style`) | refused as a bare union failure | refused at the colour key, naming the retirement |
| `{ condition, style, backgroundColor }` | accepted by `safeValidateSchema` (the colour key was stripped from the parse, then painted by the board anyway) | refused at the colour key |
| `{ condition, style, label }` (any other undeclared key) | accepted by `safeValidateSchema` | refused as an unrecognized key, with the spec rule's own message |

Each refusal message names the key, objectui#11522 and the `{ condition, style }` respelling, on `ObjectKanbanSchema`, `safeValidateSchema` and `StrictAnyComponentSchema` alike.

**Respelling.** `{ field: 'priority', operator: 'equals', value: 'high', backgroundColor: '#fee2e2' }` is `{ condition: "record.priority == 'high'", style: { backgroundColor: '#fee2e2' } }`. `not_equals` is `!=`, `contains` is `record.f.contains(…)` and `in` is `record.f in [ … ]`. A top-level colour moves into `style`; `textColor` is `style.color`.

**`@object-ui/types`.**

- `KanbanConditionalFormattingRule` is now an interface that extends `SpecConditionalFormattingRule`, with `field`, `operator`, `value`, `backgroundColor`, `borderColor` and `textColor` declared `?: never`. It used to be the union of `SpecConditionalFormattingRule` and `KanbanNativeConditionalFormattingRule`.
- `KanbanNativeConditionalFormattingRule` is removed. Importing it is a compile error (TS2305).
- `KanbanConditionalFormattingRuleSchema`, the rule schema `ObjectKanbanSchema` applies, is a module export of this package's `src/zod/objectql.zod.ts`. It is not on the `@object-ui/types/zod` barrel or on any other entry of the package's `exports` map, so it is not an import a consumer can name. It is the spec `ListViewSchema.conditionalFormatting` rule taken by reference and extended, not a union. It keeps the spec rule's strictness and its `style` map. Its `condition` is the same schema the list view's and the grid's `{ condition, style }` arm reads, so a string condition is still not canonicalized into an envelope and `''` is still accepted. The six retired keys are retirement tombstones.

**`@object-ui/plugin-kanban`.** The `object-kanban` registration's `conditionalFormatting` input description now describes the one rule. `KanbanRendererProps.schema.conditionalFormatting` and the board's `ConditionalFormattingRule` follow the narrowed type.

**Not changed: what the board paints.** The shared evaluator, `resolveConditionalFormatting` in `@object-ui/core`, keeps every arm, because the grid's and the list view's rule union still declares them. A `{ condition, style }` rule styles a card exactly as before. A rule that a relay hands the board, for example a list view's, is painted as before too. Only the authored `object-kanban` member narrowed.

Pins: `packages/types/src/__tests__/kanban-conditional-formatting.test.ts` (turned around) pins both refusals on all three zod faces, the spec rule's identity and strictness, and the TS face. `ObjectKanban.structuredMembersReachTheirSinks-8313.test.tsx` and `objectFieldsIsAPropNotASchemaKey-7742.test.tsx` in `@object-ui/plugin-kanban` draw the respelled rules through the real board and assert the same cards are painted.
