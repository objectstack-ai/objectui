---
'@object-ui/types': minor
---

`DashboardComponentSchema.dateRange` now takes `@objectstack/spec`'s
`DashboardSchema.dateRange` authoring shape by reference on both faces
(objectui#10334, objectui#7759 group F).

`dateRange` left `DASHBOARD_SPEC_EXCLUDED`, so the Zod validator and the
TypeScript interface both project the spec member instead of restating it.

**Breaking (validator only):** the validator used to accept any string as
`dateRange.defaultRange` and silently strip unknown keys inside `dateRange`.
It now gives the spec's verdict:

- a `defaultRange` outside `DATE_RANGE_DEFAULT_RANGES` (the spec's date presets
  plus `custom`) is refused with `invalid_value` at `dateRange.defaultRange`.
  Before, a typo such as `last_7_dayz` parsed green and then resolved to no
  default window at render time;
- any key other than `field`, `defaultRange` and `allowCustomRange` is refused
  with `unrecognized_keys` at `dateRange`. The spec's refusal names the
  canonical key for its known aliases (`preset` / `range` / `default` →
  `defaultRange`, `dateField` / `fieldName` → `field`, `allowCustom` /
  `custom` → `allowCustomRange`).

The TypeScript type is unchanged in effect: `defaultRange` was already bound to
the spec's `DateRangeDefaultRange`. The validator still writes no default into
a parsed document, as for every imported spec schema.
