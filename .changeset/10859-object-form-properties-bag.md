---
'@object-ui/types': minor
---

feat(types): an authored `object-form` takes its props in the spec's `properties` bag; the flat spelling is refused by name (objectui#10859, batch 4)

**BREAKING (authoring):** an `object-form` node that writes its props on the node itself is now refused by `safeValidateSchema`, `validateSchema` and the strict authoring face, and so by `objectui validate`. Move each prop into the node's `properties` bag:

```json
{ "type": "object-form", "properties": { "objectName": "account", "mode": "create", "fields": ["name", "rating"] } }
```

Nothing changes at render time: `SchemaRenderer` hoists every `properties` key onto the node before `ObjectForm` runs, so the bag node draws what the flat one drew, and a node built in code keeps working with its flat keys.

**Clause-②: yes** — the accept set narrows (a flat `object-form` node that parsed is refused) and widens (a spec-shaped bag node that was refused parses). Released as `minor` under the objectui narrowing rule, with this banner.

**Why.** `@objectstack/spec`'s `ComponentPropsMap['object-form']` row is the published declaration of an authored `object-form` node's props, and the spec's own strict `PageComponentSchema` refuses a prop written on the node as mis-layered (ADR-0089 D3a). The arm here was the flat mirror of the TypeScript `ObjectFormSchema`, so the two validators disagreed both ways: the objectstack showcase's wizard page, written in the bag, was refused (`objectName` `invalid_type`, `mode` `invalid_value`), and the flat node `os validate` refuses was accepted.

**What changed, in observable terms.**

- `@object-ui/types/zod` exports `ObjectFormBlockSchema`, built the way `ObjectMetricBlockSchema` is: `BaseSchema`, the `object-form` literal, and `properties`, which is the spec row by reference, so the row's members, value types and strictness judge the bag. It declares the node's `dataSource` binding (the spec's `ElementDataSourceSchema`), refuses the five handler keys `ObjectForm` reads off the node as runtime slots (objectui#6124), and refuses `body` / `children` (objectui#9256).
- Each member of the row written flat on the node is refused on both faces, with a message that names its bag member (`Did you mean \`mode\` → \`properties.mode\`?`). The refusal set is read off the row, so it follows the spec.
- `ObjectFormBlockSchema` reaches `AnyComponentSchema` through `ObjectQLPublicBlockComponentSchema`. `ObjectFormSchema` leaves `ObjectQLComponentSchema`.
- Inside the bag the spec row decides, and it differs from the flat mirror in a few places. `objectName` and `mode` are optional (a `dataSource` binding can name the object). `layout` takes `vertical` or `horizontal` only (the spec retired `inline` and `grid`; set `columns` for several columns). `recordId` takes a string or a number. `buttons`, `defaults`, `subforms` and `groups` are form-VIEW keys, not members of the row, so the bag refuses them; `buttons`, `defaults` and `subforms` stay authorable in an `object-view`'s `form` slot. The row types `sections` entries as `unknown`, so a section's own keys are not judged inside the bag.

**The same release's `.changeset/6152-object-form-unmirrored-members.md`** declared members on the flat mirror so that the strict face stopped refusing them on an authored node. On an authored node those members are now written in the bag, where the spec row judges them: every one of them except `buttons`, `defaults` and `subforms`, which the row does not declare. Those three stay authorable in an `object-view`'s `form` slot, which is built from the mirror, and a section there is still judged member by member.

**What did not move.** The TypeScript `ObjectFormSchema` and its zod mirror `ObjectFormSchema` stay published and unchanged in shape. They are the node as `ObjectForm` reads it after the hoist, and as code composes it (`ObjectView`, `RecordFormPage`, `ScreenView`, a host mounting `<ObjectForm schema={…}>`). The object-view `form` slot is still built from the mirror.
