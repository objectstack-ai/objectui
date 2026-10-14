---
'@object-ui/types': minor
---

An `element:repeater` node may omit `properties.object` when its `dataSource.object` names the object. The zod arm `ElementRepeaterBlockSchema` now applies the same `object` waiver as the spec's props gate (objectui#12056); superseded in 18, see objectui#12030: spec 18 retires the flat `object`, so the arm is the row by reference, a node may omit `properties.object` whether or not it binds one, and a `properties.object` is refused by name.

`ComponentPropsMap['element:repeater']` required `object` through 17.x. The spec's props gate in `@objectstack/lint` (`suppliedByDataSource`) does not report a missing `object` on any component whose `dataSource.object` is a non-empty name. `ElementNumberBlockSchema` already applies that waiver. The repeater arm did not, so it refused the node the Studio page designer now writes: `properties: {}` beside `dataSource: { object: … }`. The arm now applies the waiver the same way `element:number`'s does. The bag is the spec row with `object` alone made optional, and a node refinement puts the requirement back wherever no binding names the object. Both waivers and both refinements are gone in 18 (objectui#12030): the row has no flat `object` left to waive.

- **WIDENS, both zod faces.** The strict face (`StrictAnyComponentSchema`, which `objectui validate` and `objectui check` run) and the tolerant face (`safeValidateSchema`) used to refuse such a repeater at `properties.object`, whatever its `dataSource` said. Both now accept it when `dataSource.object` is a non-empty string.
- **Still refused at `properties.object` through 17.x.** A bag with no `object` was refused when the node had no binding that names one: no `dataSource`, or a `dataSource.object` that is empty or not a string. The refusal was a `custom` issue with `params.code` `ELEMENT_REPEATER_OBJECT_REQUIRED`, and its message named both remedies; retired in 18, see objectui#12030: the refinement and its code are deleted, so such a bag is accepted. A `properties.object` of the wrong type is still refused by the row itself, and since 18 so is any `properties.object`, by name.
- **TypeScript.** The inferred `ElementRepeaterBlockSchema` type typed `properties.object` as optional through 17.x, and so did the authoring type `PublicBlockNodeOf<'element:repeater'>` derived from it; since 18 (objectui#12030) both follow the row, which retires `object`, so a typed `properties.object: string` no longer type-checks.

**Clause-② yes (widening):** a strict face widens to the spec gate's rule. No export is added or removed.
