---
'@object-ui/plugin-report': minor
---

refactor(plugin-report)!: retire the `spec-report` node type key; a spec report is embedded as `{ "type": "report", "report": { … } }` (objectui#11440)

**BREAKING (authoring):** the plugin no longer registers `spec-report` (and with it `plugin-report:spec-report`), an alias of `report` on the same `ReportRenderer` that carried the report under a `report` member. `ReportRenderer` now unwraps that member on a `report` node, and only there: `report` is the one spelling, with no alias fallback. `objectui validate` refused a `spec-report` node at `type`, and so did the strict authoring face. A node authored `type: "spec-report"` now renders the "Unknown component type" panel.

The `report` registration publishes `report` as an input, so the `sdui-parser` manifest and the designer offer it. `@object-ui/types/zod`'s `ReportNodeSchema` declares the same member (`.changeset/11440-report-node-wrapper.md`). The README and `content/docs/plugins/plugin-report.mdx` teach the `report` spelling and list two registered types, `report` and `report-viewer`.

Migration:

- `{ "type": "spec-report", "report": { … } }` → `{ "type": "report", "report": { … } }`, with the same `report` member. Measured with a dataset-bound report (`name`, `label`, `type: "summary"`, `dataset`, `rows`, `values`): the FROM document is refused with `invalid_union` at `type` by `objectui validate` and by the strict face; the TO document validates on both.
- A pre-9.0 stored report (the `objectName` / `columns` query form) under `report` still renders through the presentation bridge, but neither face accepts it in the TO document: the `@objectstack/spec` `ReportSchema` the member takes by reference refuses it under `report` (`objectName` as an unrecognized key, `invalid_type` at `report.columns.0`). Migrate it to a dataset binding (ADR-0021) to validate.

**Clause-②: yes** — a registration leaves the runtime (narrowing), released as `minor` with this banner.
