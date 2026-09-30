---
'@object-ui/types': minor
---

`safeValidateSchema` — and so `objectui validate` — accepts one more registered node type: `object-timeline` (objectui#10859, batch 3).

**Clause-②: yes** — the accept set of `AnyComponentSchema` widens by one `type` literal, and `@object-ui/types/zod` exports one new schema. Nothing that parsed before is refused now: every document naming `object-timeline` was refused at `type`, at the root and at every child slot.

**What it was.** `object-timeline` is an ADR-0080 public block registered by `@object-ui/plugin-timeline`, and since `@objectstack/spec` 17.5.0 the spec declares its props as the `ComponentPropsMap['object-timeline']` row. `AnyComponentSchema` carried no arm for it, so every document naming it was refused with `invalid_union` at `type`.

**What changed, in observable terms.**

- `@object-ui/types/zod` exports `ObjectTimelineBlockSchema`, built the way `ObjectMetricBlockSchema` is: `BaseSchema`, the `type` literal, and `properties`, which is the spec row by reference, so the spec's members, value types and strictness apply to the bag unchanged. The row's defaults (`timeline.scale`, the `navigation` members) are removed at the import boundary, so a parse writes nothing into the document (objectui#8317).
- The node also declares `dataSource`, the spec's `ElementDataSourceSchema` by reference — the per-element binding the renderer reads through `ElementDataSourceGate`, declared the same way on the other gate-wrapped arms (objectui#11070). `body` and `children` are refused by name: the renderer reads neither content channel (objectui#9256).
- `ObjectMetricBlockSchema` and `ObjectMasterDetailFormBlockSchema` declare the same `dataSource` binding, by the same construct: both registrations are gate-wrapped and read it. Both arms are new in this release (`.changeset/10859-pivot-object-block-zod-arms.md`), so this only shapes what they accept on arrival: a bound node parses on both faces, and the key is judged as the binding, so an adapter name (`dataSource: 'objectstack'`) is refused.
- `ObjectTimelineBlockSchema` reaches `AnyComponentSchema` through `ObjectQLPublicBlockComponentSchema`, beside `object-metric` and `object-master-detail-form`. The strict authoring face (`StrictAnyComponentSchema`) derives from it and accepts the same documents, closed to undeclared keys. As on those two blocks, a prop written flat on the node instead of inside `properties` is not judged against the spec row: a key `BaseSchema` does not declare passes the tolerant face unjudged and is refused by name on the strict face.
