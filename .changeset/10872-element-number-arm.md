---
'@object-ui/types': minor
---

`safeValidateSchema` — and so `objectui validate` — accepts `element:number`, the ADR-0080 public block held back from batch 1, in both of the binding forms `@objectstack/spec` accepts (objectui#10872, batch 2).

**Clause-②: yes** — the accept set of `AnyComponentSchema` widens by one `type` literal, and `@object-ui/types/zod` exports one new schema, `ElementNumberBlockSchema`. Nothing that parsed before is refused now.

**What it was.** `element:number` is registered, curated as platform contract by ADR-0080 and declared by the spec (`ComponentPropsMap['element:number']`), while `AnyComponentSchema` carried no arm for it — so every `element:number` document was refused with `invalid_union` at `type`, and `objectui validate` reported "Schema validation failed" for any page that placed one.

**What changed, in observable terms.**

- `@object-ui/types/zod` exports `ElementNumberBlockSchema`, a member of `PublicBlockComponentSchema`; the strict authoring face (`StrictAnyComponentSchema`) accepts the same documents, closed to undeclared keys like every other arm.
- The props live where the spec puts them: `properties`, read by reference from the block's `ComponentPropsMap` row — its members, value types, retired-key refusals and strictness. `{ "type": "element:number", "properties": { "object": "order", "aggregate": "count" } }` is accepted; a `format` outside `number` / `currency` / `percent`, or a record-form `filter` (the spec's migration `element-number-filter-rule-array`), is refused at that member, and an undeclared prop is refused by name (`unrecognized_keys` on `properties`).
- The spec's one waiver is mirrored: the row requires `object`, and a bag may omit it when the node's `dataSource.object` is a non-empty object name, as the spec's props gate (`validateComponentProps` in `@objectstack/lint`) waives it. `{ "type": "element:number", "dataSource": { "object": "order" }, "properties": { "aggregate": "sum", "field": "total" } }` is accepted.
- A bag that names its object nowhere is refused at `properties.object`, with a message naming both fixes (set `properties.object`, or bind `dataSource.object`). An empty or non-string `dataSource.object` supplies nothing. The waiver covers an omitted `object` only: a wrong one (`"object": 7`) is refused even beside a binding.
- `dataSource` is declared on the node as the spec's `ElementDataSourceSchema`, by reference — the schema `PageComponentSchema.dataSource` is — so its members and its alias refusals (`objectName` → `object`) are the spec's, and the strict face judges a `dataSource` rather than refusing it as undeclared.
- A node with no `properties` bag is not judged against the row, as for every other public block and as the spec's props gate does.
