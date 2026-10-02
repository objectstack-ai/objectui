---
'@object-ui/types': minor
---

feat(types): the six `@object-ui/plugin-designer` node types validate; `ProcessDesignerSchema.variables` and `ReportDesignerSchema.parameters` leave the TypeScript face (objectui#10859, batch 7)

**BREAKING (authoring):** `ProcessDesignerSchema` no longer declares `variables`, and `ReportDesignerSchema` no longer declares `parameters`. Nothing reads either key: `ProcessDesigner` and `ReportDesigner` take neither as a prop, and a node that carried one drew exactly what it drew without it. Nothing in this repository authored either one.

Migration: delete `variables` from your `process-designer` nodes and `parameters` from your `report-designer` nodes. Neither reaches the screen, so removing it changes nothing a user sees. TypeScript code that read `schema.variables` or `schema.parameters` off one of these types now reads the `BaseSchema` index signature (`any`) instead of the old array type. The strict authoring face refuses either key as an unrecognized key on these nodes; `safeValidateSchema` passes it through, as it does any undeclared key.

**Clause-②: yes** — `@object-ui/types/zod` accepts six registered node types it refused at `type` before (a widening), and the TypeScript face narrows by two members. Released as `minor` under the objectui narrowing rule, with this banner.

**What changed, in observable terms.**

- `@object-ui/types/zod` exports `PageDesignerSchema`, `DataModelDesignerSchema`, `ProcessDesignerSchema`, `ReportDesignerSchema`, `ObjectManagerSchema` and `FieldDesignerSchema`, each a mirror of its TypeScript declaration in `designer.ts`, and the mirrors of the record types those nodes hold (`DesignerComponentSchema`, `DesignerCanvasConfigSchema`, `BPMNNodeSchema`, `ReportDesignerSectionSchema`, `ObjectDefinitionSchema`, `DesignerFieldDefinitionSchema` and the rest). They reach `AnyComponentSchema` through `DesignerUnionSchema`, so `safeValidateSchema`, `validateSchema`, the strict authoring face and `objectui validate` now judge a designer node by its own members instead of refusing it with `invalid_union` at `type`.
- Each arm requires what its declaration requires (for example `processName`, `nodes` and `edges` on `process-designer`), and refuses `body` and `children` by name, because none of the six components reads a content channel (objectui#9256).
- Four declared members that no designer reads are NOT on the arms: `autoLayout` on `data-model-designer`, `lanes` and `version` on `process-designer`, and `previewMode` on `report-designer`. They stay declared on the TypeScript face. The strict face refuses them as unrecognized keys, and the tolerant face passes them through unjudged.
