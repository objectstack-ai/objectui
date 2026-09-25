---
'@object-ui/plugin-calendar': patch
'@object-ui/plugin-map': patch
'@object-ui/plugin-gantt': patch
---

fix(plugin-calendar, plugin-map, plugin-gantt): the registrations' `inputs` agree with the record-source rule

All three blocks read their records from one of `data`, `staticData` and
`objectName` (in that order), and their `@object-ui/types` zod schemas enforce
"one of the three" through `requireRecordSource`. The designer-facing `inputs`
on the registrations disagreed with that rule in two ways:

- `object-calendar` and `calendar` still declared `objectName` as required, so
  the html tier's validator reported a `missing-required-prop` error on a
  calendar authored on `staticData` or `data`, which the schema accepts and the
  renderer draws. `objectName` is now declared without `required`, and its
  description states the rule, as objectui#7470 did for map and gantt
  (objectui#10392).
- `object-map`, `map` and `object-gantt` did not declare `data` or
  `staticData`, so the validator reported a block authored on either as an
  unknown prop. Both are now declared, on the schema's own arms: `data` is a
  `{ provider, … }` data-source configuration (an object, so a bare array there
  now draws a type diagnostic, matching the schema), and `staticData` is an
  array of records. Each description says what the renderer does with the key,
  including that the map does not implement the `api` provider
  (objectui#10394).

The renderers' read order and the zod schemas are unchanged. The
`@object-ui/plugin-gantt` README sentence that listed the registration's inputs
is updated.
