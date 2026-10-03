---
'@object-ui/types': minor
---

`safeValidateSchema`, and so `objectui validate`, accepts `record:line_items`, the last ADR-0080 public block it refused at `type` (objectui#10872). `@objectstack/spec` 17.6.0 carries the block's `ComponentPropsMap` row, measured at the reads of `LineItemsPanel`, and the arm reads that row by reference.

**Clause-②: yes.** The accept set of `AnyComponentSchema` widens by one `type` literal, and `@object-ui/types/zod` exports one new schema, `RecordLineItemsBlockSchema`. Nothing that parsed before is refused now: every document naming `record:line_items` was refused before.

**What it was.** `record:line_items` is registered by `@object-ui/plugin-form` and curated as platform contract by ADR-0080, and `AnyComponentSchema` carried no arm for it. Every document naming it was refused with `invalid_union` at `type`, whatever the rest of the node said. The arm was held until the spec carried a row for the block.

**What changed, in observable terms.**

- `@object-ui/types/zod` exports `RecordLineItemsBlockSchema`, a member of `PublicBlockComponentSchema`. The strict authoring face (`StrictAnyComponentSchema`) accepts the same documents and is closed to undeclared keys, as on every other arm.
- The block's props live in `properties`, and the bag is the spec row: its members, value types and strictness are the spec's. `relationshipField` and `columns` are required there, and `childObject` is optional. A key the row does not declare is refused inside the bag, by name.
- A row member written on the node instead of in `properties` is refused by name on both faces, at its own path, with a message naming `properties.KEY`, as on every other public block.
- The node's `dataSource` binding is declared as the spec's `ElementDataSourceSchema`, read by reference. The block's registration wraps `ElementDataSourceGate`, which puts `dataSource.object` into `childObject`, so a bound node without `childObject` passes both faces. A binding that the spec refuses is refused at `dataSource`.
- A node-level `children` or `body` is refused by name on both faces. The block renders the grid of child records and reads neither key, and `@objectstack/spec`'s page component refuses a node-level `children` on it too.
