---
'@object-ui/types': minor
---

`JoinedReportBlock` is now the spec's own type, derived from the installed `@objectstack/spec` instead of hand-written (objectui#10940). It is `JoinedReportBlock` from `@objectstack/spec/ui`, the input shape of `JoinedReportBlockSchema`. `JoinedSpecReport.blocks` is now the spec's own `Report.blocks`, made required. It is on the parsed tier, like `SpecReport` itself, so each element is the spec's parsed block, which can be assigned to `JoinedReportBlock`.

Through `@objectstack/spec` 17.4.0 the spec erased this block to `unknown`, so objectui published its own interface. That interface described the legacy inline-query block. Spec 17.5.0, installed since objectui#11073, types the block as the ADR-0021 dataset-bound block in a closed schema. The spec refuses every key that is only in the old interface. The published type follows the spec, member by member:

- **Removed (narrowing):** `objectName`, `groupingsDown`, `groupingsAcross`, `filter` and `chart`. The spec's schema refuses all five, and refuses `chart` by name (objectstack#20161). The `[k: string]: unknown` index signature is gone too, so a literal typed `JoinedReportBlock` no longer accepts an undeclared key.
- **Changed concept:** `columns` was a required array of column objects (`{ field, label?, aggregate? }`). It is now an optional array of dimension names (`string[]`) for the across axis of a matrix block.
- **Narrowed:** `label` and `description` still accept a plain string. Their object form is now the spec's inline locale map, where every value is a string. The legacy `{ default, translations }` object is no longer accepted.
- **Added (widening):** `dataset`, `rows`, `values`, `runtimeFilter` (a `FilterCondition`) and `order` (`{ by, direction? }[]`).
- **Unchanged:** `name` (a required string) and `type` (optional `'tabular' | 'summary' | 'matrix'`, defaulting to `tabular`).

⚠️ This is breaking for TypeScript code that builds or reads legacy inline-query blocks. It is marked `minor` under this repository's version-alignment rule. Nothing changes at runtime: `isJoinedSpecReport` is untouched, and when this change was made no renderer in this repository typed its blocks with either type (the dataset-bound renderer uses its own local shape).
