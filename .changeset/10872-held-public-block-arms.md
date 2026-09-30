---
'@object-ui/types': minor
---

`safeValidateSchema`, and so `objectui validate`, accepts the six ADR-0080 public blocks held back until `@objectstack/spec` carried a `ComponentPropsMap` row for each: `action:button`, `action:icon`, `action:group`, `action:menu`, `element:definition-list` and `element:repeater` (objectui#10872, batch 4). Their rows arrived in `@objectstack/spec` 17.5.0, measured at the renderers' read points (objectstack-ai/objectstack#20371).

**Clause-②: yes.** The accept set of `AnyComponentSchema` widens by six `type` literals, and `@object-ui/types/zod` exports six new schemas. Nothing that parsed before is refused now.

**What it was.** Each of these types is registered and curated as platform contract by ADR-0080, and `AnyComponentSchema` carried no arm for any of them. So every document naming one was refused with `invalid_union` at `type`. That included `action:button`, the node the validator's own handler-key refusals tell an author to write instead of an `onClick`.

**What changed, in observable terms.**

- `@object-ui/types/zod` exports `ActionButtonBlockSchema`, `ActionIconBlockSchema`, `ActionGroupBlockSchema`, `ActionMenuBlockSchema`, `ElementDefinitionListBlockSchema` and `ElementRepeaterBlockSchema`, each a member of `PublicBlockComponentSchema`. The strict authoring face (`StrictAnyComponentSchema`) accepts the same documents, closed to undeclared keys like every other arm.
- Each arm's `properties` bag is the block's spec row, read by reference: its members, value types and strictness are the spec's. The rows were measured at what the renderers read, not at what the registrations publish, so the validator refuses what no renderer reads:
  - a group-level `name` on `action:group`, with the spec's own prescription;
  - `size: "md"` on `action:group` and `action:menu`, whose renderers hand it to the Button primitive unmapped;
  - the strings `"1"` / `"2"` for `element:definition-list`'s `columns`, where the renderer compares the number `2`: write `columns: 2`;
  - a `label` on an `element:repeater` `fields` entry, which the list never prints.
- `element:repeater` requires `properties.object`: its renderer never queries without one, and it does not read the node's `dataSource`.
- `action:button` and `action:icon` also refuse two keys their renderers read off the node, each by name:
  - an authored `onClick`, a runtime slot for a host-supplied function (objectui#6124), as `ButtonSchema.onClick` is;
  - a flat `onSuccess`, with a message naming `properties.onSuccess`, where the spec row declares the post-success `{ navigate, openIn }` block. The spec's own page component refuses the flat spelling too.
- A prop written directly on the node rather than in `properties` is treated as on every other public block. The tolerant face passes a key `BaseSchema` does not declare, unjudged; the strict face refuses it. So the taught `{ "type": "action:button", "label": "Open details", "actionType": "url", "target": "/users/ada" }` validates through `objectui validate` as it runs today, while `StrictAnyComponentSchema` refuses its flat `actionType` and `target`, as `@objectstack/spec`'s `PageComponentSchema` does. The same node with its props in `properties` passes both faces.
- `record:line_items` is still refused at `type`: the spec has no row for it yet.
