---
'@object-ui/types': minor
---

feat(types): an authored `object-map` takes its props in the spec's `properties` bag; the flat spelling is refused by name (objectui#10859, batch 5)

**BREAKING (authoring):** an `object-map` node that writes its props on the node itself is now refused by `safeValidateSchema`, `validateSchema` and the strict authoring face, and so by `objectui validate`. Move each prop into the node's `properties` bag:

```json
{ "type": "object-map", "properties": { "objectName": "store", "map": { "latitudeField": "lat", "longitudeField": "lng" } } }
```

Nothing changes at render time: `SchemaRenderer` hoists every `properties` key onto the node before `ObjectMap` runs, so the bag node draws what the flat one drew, and a node built in code (`ObjectView` and `ListView` flatten a stored map view this way) keeps working with its flat keys.

**Clause-②: yes (narrowing)** — the accept set narrows (a flat `object-map` node that parsed is refused) and widens (a spec-shaped bag node that was refused parses). Released as `minor` under the objectui narrowing rule, with this banner.

**Why.** `@objectstack/spec`'s `ComponentPropsMap['object-map']` row is the published declaration of an authored `object-map` node's props, and the spec's own strict `PageComponentSchema` refuses a prop written on the node as mis-layered (ADR-0089 D3a). The arm here was the flat mirror of the TypeScript `ObjectMapSchema`, so the two validators disagreed both ways: a document written in the bag was refused (the flat mirror found no record source on the node), and the flat node `os validate` refuses was accepted.

**What changed, in observable terms.**

- `@object-ui/types/zod` exports `ObjectMapBlockSchema`, built the way `ObjectFormBlockSchema` is: `BaseSchema`, the `object-map` literal, and `properties`, which is the spec row by reference, so the row's members, value types and strictness judge the bag. It declares the node's `dataSource` binding (the spec's `ElementDataSourceSchema`) and refuses `body` / `children` (objectui#9256).
- Each member of the row written flat on the node is refused on both faces, with a message that names its bag member (`Did you mean \`objectName\` → \`properties.objectName\`?`). The refusal set is read off the row, so it follows the spec. The flat mirror's two compatibility keys, `locationField` and `titleField`, are refused the same way and pointed at `properties.map.locationField` / `properties.map.titleField`.
- The record-source rule stays: the node needs one of `properties.data`, `properties.staticData` or `properties.objectName`, or the node's `dataSource` binding, whose `object` the renderer lands on `objectName`. A node with none is refused at the root (`RECORD_SOURCE_REQUIRED`), as the flat node was. A node bound only through `dataSource`, which the flat arm refused, now parses.
- `ObjectMapBlockSchema` reaches `AnyComponentSchema` through `ObjectQLPublicBlockComponentSchema`. `ObjectMapSchema` leaves `ObjectQLComponentSchema`.
- Inside the bag the spec row decides. The `map` block is the row's own `map` member (the same eight keys, closed), and a `map`-config key written beside it in the bag (`properties.locationField`) is refused with the spec's prescription to move it into `map`. `filter` takes the rule-array form only, and `navigation` is not judged member by member there.

**The same release's `.changeset/5157-object-map-config-strict.md`, `.changeset/6939-objectql-record-source-refinement.md` and `.changeset/11007-check-prints-key.md`** describe what the validators say about an `object-map` written flat. On an authored node those readings now happen in the bag: a typo in the `map` block is refused at `properties.map` (`objectui check` prints `Issue at properties → map: …` for it), and the record-source rule reads `properties.data`, `properties.staticData`, `properties.objectName` or the node's `dataSource`. The flat mirror they name still behaves as they say.

**What did not move.** The TypeScript `ObjectMapSchema` and its zod mirror `ObjectMapSchema` stay published and unchanged in shape. They are the node as `ObjectMap` reads it after the hoist, and as code composes it, or hands it to `<ObjectMap schema={…}>` directly.
