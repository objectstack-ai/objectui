---
'@object-ui/types': minor
---

feat(types): an authored `object-gantt` takes its props in the spec's `properties` bag; the flat spelling is refused by name (objectui#10859, batch 6)

**BREAKING (authoring):** an `object-gantt` node that writes its props on the node itself is now refused by `safeValidateSchema`, `validateSchema` and the strict authoring face, and so by `objectui validate`. Move each prop into the node's `properties` bag, and the field mapping into the bag's `gantt` block:

```json
{ "type": "object-gantt", "properties": { "objectName": "task", "gantt": { "startDateField": "start", "endDateField": "end", "titleField": "name" } } }
```

Nothing changes at render time: `SchemaRenderer` hoists every `properties` key onto the node before `ObjectGantt` runs, so the bag node draws what the flat one drew, and a node built in code (`ObjectView` and `ListView` flatten a stored gantt view this way, flat field keys and the toolbar's `search` term included) keeps working with its flat keys.

**Clause-②: yes (narrowing)** — the accept set narrows (a flat `object-gantt` node that parsed is refused) and widens (a spec-shaped bag node that was refused parses). Released as `minor` under the objectui narrowing rule, with this banner.

**Why.** `@objectstack/spec`'s `ComponentPropsMap['object-gantt']` row is the published declaration of an authored `object-gantt` node's props, and the spec's own strict `PageComponentSchema` refuses a prop written on the node as mis-layered (ADR-0089 D3a). The arm here was the flat mirror of the TypeScript `ObjectGanttSchema`, so the two validators disagreed both ways: a document written in the bag was refused (the flat mirror found no record source on the node), and the flat node `os validate` refuses was accepted.

**What changed, in observable terms.**

- `@object-ui/types/zod` exports `ObjectGanttBlockSchema`, built the way `ObjectMapBlockSchema` is: `BaseSchema`, the `object-gantt` literal, and `properties`, which is the spec row by reference, so the row's members, value types and strictness judge the bag. It declares the node's `dataSource` binding (the spec's `ElementDataSourceSchema`) and refuses `body` / `children` (objectui#9256). The row carries spec defaults; none is written into a validated document.
- Each member of the row written flat on the node is refused on both faces, with a message that names its bag member (`Did you mean \`objectName\` → \`properties.objectName\`?`). The refusal set is read off the row, so it follows the spec. `label` is the exception: the spec's page component declares a node-level display `label` of its own, so a `label` on the node is kept.
- The flat field-mapping keys the flat mirror declared (`startDateField`, `endDateField`, `titleField`, `viewMode` and the rest of `GanttConfig`) and its `dependencyField` alias are refused the same way, pointed at the bag's `gantt` block (`properties.gantt.startDateField`; `dependencyField` at `properties.gantt.dependenciesField`). Inside the bag the spec row refuses them too, with its prescription to move them into `gantt`.
- The record-source rule stays: the node needs one of `properties.data`, `properties.staticData` or `properties.objectName`, or the node's `dataSource` binding naming its object, which the renderer lands on `objectName`. A node with none is refused at the root (`RECORD_SOURCE_REQUIRED`), as the flat node was. A bag node bound only through `dataSource` parses.
- `ObjectGanttBlockSchema` reaches `AnyComponentSchema` through `ObjectQLPublicBlockComponentSchema`. `ObjectGanttSchema` leaves `ObjectQLComponentSchema`.
- `search` and `searchableFields` are not authored keys: a list view writes them onto the node it composes, and the spec row does not declare them. Written flat on an authored node they are unjudged by the tolerant face and refused by the strict one; in the bag the spec row refuses them.

**The same release's `.changeset/6475-gantt-block-face-declared.md`, `.changeset/6939-objectql-record-source-refinement.md`, `.changeset/9256-e3-residual-content-channels.md`, `.changeset/11070-strict-face-read-keys.md` and `.changeset/11117-datasource-objectname-waiver.md`** describe what the validators say about an `object-gantt` written flat. On an authored node those readings now happen in the bag: the `gantt` block is the row's own `gantt` member, with the same three required fields, and the record-source rule reads `properties.data`, `properties.staticData`, `properties.objectName` or the node's `dataSource`. The flat mirror they name still behaves as they say.

**What did not move.** The TypeScript `ObjectGanttSchema` and its zod mirror `ObjectGanttSchema` stay published and unchanged in shape. They are the node as `ObjectGantt` reads it after the hoist, and as code composes it, or hands it to `<ObjectGantt schema={…}>` directly.
