---
'@object-ui/types': minor
---

feat(types): the `report` node declares the `report` member that wraps a spec report (objectui#11440)

`@object-ui/types/zod` exports `ReportNodeSchema`, the `report` arm of `AnyComponentSchema` and of `ReportUnionSchema`: every `ReportComponentSchema` member, plus `report`, the `@objectstack/spec` `ReportSchema` taken by reference. It is the wrapper the retired `spec-report` alias carried (`.changeset/11440-retire-spec-report.md`), and `ReportRenderer` reads it: when `report` is present, the node renders that report and reads none of its own presentation members.

**Clause-②: yes** — the accept set moves in both directions. Measured with `objectui validate` (the tolerant face, `safeValidateSchema`) and with the strict authoring face (`StrictAnyComponentSchema`):

- **It widens on the strict face.** `{ "type": "report", "report": { "name", "label", "type": "summary", "dataset", "rows", "values" } }` was refused there with `report` as an unrecognized key; it validates now. The tolerant face accepted it before and accepts it now.
- **It narrows on the tolerant face.** That face used to accept any value under a `report` node's `report` key, unexamined; it now judges the value as the spec's `ReportSchema`, at its path. A pre-9.0 stored report (`objectName` / `columns`) is refused with `objectName` as an unrecognized key and `invalid_type` at `report.columns.0`; an object with none of a report's members is refused at `report.name` and `report.label`. Before this change `ReportRenderer` did not read that key on a `report` node: such a document drew the node's own presentation members and ignored it. Migration: drop the member, or make it a dataset-bound spec report (ADR-0021).
- A `report` node without the member, such as `{ "type": "report", "title": "Sales" }`, is judged as before.

`ReportComponentSchema` is unchanged. It is also the report record a `report-viewer` or `report-builder` holds, and neither reads a nested `report`, so the strict face still refuses `report` as an unrecognized key inside that record. The TypeScript interface `ReportComponentSchema` does not declare `report` either; `BaseSchema`'s index signature admits it, as before.
