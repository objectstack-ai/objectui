---
'@object-ui/types': minor
---

`DrillDownConfig.report`'s `{ name }` reference arm is retired on the TypeScript face, the tolerant zod face and the strict authoring face, and both zod faces refuse it by name (objectui#11517).

BREAKING (`@object-ui/types`): `DrillDownConfig.report` narrows to the dataset-bound report alone. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

- FROM: `report?: SpecReportInput | { name: string }`
- TO: `report?: SpecReportInput`, `@objectstack/spec`'s `ReportSchema` author shape by reference.

Why: the arm declared a named report reference that nothing resolved. The drill-down drawer draws a report only for a dataset-bound inline report, so a `{ name }` drill listed the records and drew no report, and no producer wrote one (this repository's examples, docs, console and package code, and `@objectstack`'s examples, measured at this change). There is no alias window. Migration: write the report inline and dataset-bound, `{ name, label, dataset, values, … }` with `rows` (and `columns` on a matrix) as dimension names, or a `joined` report whose `blocks` bind a dataset.

Accept-set change on `@object-ui/types/zod`, stated plainly:

- NARROWS, tolerant face (`DrillDownConfigSchema`, and `safeValidateSchema`, which `objectui validate` runs): a `drillDown.report` that failed the spec's `ReportSchema` and carried a string `name` used to parse as a reference, stripped to `{ name }`, and the document was reported valid. It is now refused. A bare `{ name }` is refused with a `custom` issue at the report, `params.code` `DRILL_REPORT_REFERENCE_RETIRED`, whose message names the retirement and the dataset-bound form to write; the spec's own issues (`label` first) are reported beside it. The pre-9.0 object-bound form (`objectName` plus column objects, retired by objectui#11506), which this face used to read the same way, is refused at the report's `objectName` with a message that names that retirement.
- NARROWS, strict face (`StrictAnyComponentSchema`): a bare `{ name }` used to validate there too, through the closed reference arm. It is now refused with the same named issue.
- Same accept set, new message: on the strict face the pre-9.0 form's `objectName` used to be refused as an unrecognized key, in the spec's words. It is now a declared refusal on the drill report: an `invalid_type` issue at the report's `objectName` that leads with the spec's own sentence and names objectui#11506.
- Unchanged: a dataset-bound inline report validates on every face with every key kept, and the drawer draws it as a report scoped by the drill filter. The drawer does not change: a stored value that never went through a validator, a `{ name }` among them, still lists the records.
- Output shape: `report` is no longer a union, so a parsed `drillDown.report` is the report as written; nothing is stripped to `{ name }`. Its `.describe()` text no longer offers a named reference.
