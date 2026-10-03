---
'@object-ui/types': minor
---

`@object-ui/types` declares TypeScript types for three node types its zod face already validates: `DetailSectionNodeSchema` (`detail-section`), `AppSchemaRendererNodeSchema` (`app-schema-renderer`) and `CloudPlanStatusSchema` (`cloud:plan-status`), each the twin of the zod arm of the same name (objectui#11515).

**Clause-②: yes (widening)** — the TypeScript face's declared surface widens to match what the zod face already publishes: three new exported types, each a member of `AnySchema` (`DetailSectionNodeSchema` through `ViewComponentSchema`). No zod schema, validator verdict or runtime behaviour changes.

**What changed, in observable terms.**

- `SchemaByType<'detail-section'>`, `SchemaByType<'app-schema-renderer'>` and `SchemaByType<'cloud:plan-status'>` resolve to the new types; each was `never`.
- `DetailSectionNodeSchema` declares the ten section members the arm picks from `DetailViewSectionSchema` (`title`, `description`, `icon`, `fields`, `collapsible`, `defaultCollapsed`, `columns`, `showBorder`, `headerColor`, `hideEmpty`), each `DetailViewSection`'s own member by reference, `fields` required.
- `AppSchemaRendererNodeSchema` declares `schema` (the app document, `AppComponentSchema`), `basePath` and `mobileNavMode` (`'drawer'` | `'bottom_nav'`).
- `CloudPlanStatusSchema` declares a required `properties` bag holding `plan: string` and no other key. The arm also refuses an empty `plan`, which the type cannot state.
- On all three, `body` and `children` are `?: never`, the twins of the arms' by-name refusals.
- Each type is a `zod-mirror-parity` pair with its arm. `cloud:plan-status` measures clean. The other two carry the reading their by-reference member already carries one level up: `fields` (the `DetailViewField` `options` divergence) and `schema` (the app document's wider reading through `NavigationItemSchema`'s `z.ZodType<any>`).
