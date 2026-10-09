---
'@object-ui/types': minor
---

An `element:repeater` node may omit `properties.object` when its `dataSource.object` names the object. The zod arm `ElementRepeaterBlockSchema` now applies the same `object` waiver as the spec's props gate (objectui#12056).

`ComponentPropsMap['element:repeater']` requires `object`. The spec's props gate in `@objectstack/lint` (`suppliedByDataSource`) does not report a missing `object` on any component whose `dataSource.object` is a non-empty name. `ElementNumberBlockSchema` already applies that waiver. The repeater arm did not, so it refused the node the Studio page designer now writes: `properties: {}` beside `dataSource: { object: … }`. The arm now applies the waiver the same way `element:number`'s does. The bag is the spec row with `object` alone made optional, and a node refinement puts the requirement back wherever no binding names the object.

- **WIDENS, both zod faces.** The strict face (`StrictAnyComponentSchema`, which `objectui validate` and `objectui check` run) and the tolerant face (`safeValidateSchema`) used to refuse such a repeater at `properties.object`, whatever its `dataSource` said. Both now accept it when `dataSource.object` is a non-empty string.
- **Still refused at `properties.object`.** A bag with no `object` is refused when the node has no binding that names one: no `dataSource`, or a `dataSource.object` that is empty or not a string. The refusal is a `custom` issue with `params.code` `ELEMENT_REPEATER_OBJECT_REQUIRED`, and its message names both remedies. A `properties.object` of the wrong type is still refused by the row itself.
- **TypeScript.** The inferred `ElementRepeaterBlockSchema` type now types `properties.object` as optional, and so does the authoring type `PublicBlockNodeOf<'element:repeater'>` derived from it.

**Clause-② yes (widening):** a strict face widens to the spec gate's rule. No export is added or removed.
