---
'@object-ui/types': minor
'@object-ui/components': minor
---

`CalendarSchema.defaultValue` / `.value` cross the JSON/TS boundary once (objectui#10293, objectui#7759 ruling D1-(iii)).

- `@object-ui/types`: the declaration is now `Date | string`, the same set the zod mirror accepts. JSON authors an ISO 8601 date string; TypeScript callers may still pass a `Date`. Breaking for TypeScript only: the `Date[]` arm is gone from the declaration, so a `Date[]` passed to a `multiple`-mode calendar no longer type-checks. The mirror never accepted a list, and the renderer still forwards one unchanged at runtime.
- `@object-ui/components`: the `ui:calendar` renderer coerces a string `value` / `defaultValue` to a `Date` at its read site, through `toDisplayDate` from `@object-ui/core`. A date-only string such as `2026-09-15` now selects the 15th in every time zone. Before, it selected the 14th west of UTC. `Date` values and date-time strings select the same day as before.
