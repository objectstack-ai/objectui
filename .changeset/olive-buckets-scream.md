---
"@object-ui/plugin-calendar": minor
"@object-ui/types": minor
---

fix(plugin-calendar): type `ObjectCalendar` at the published `object-calendar` schema, and declare the `calendar` container

`ObjectCalendarComponentProps.schema` was the union `ObjectGridSchema | CalendarSchema` — a grid's schema, plus a plugin-local interface absent from this package's barrel. Neither arm is the schema of the element this renderer is registered as, so twelve of the fifteen keys it reads off the node were undeclared on the union and had to be read through a cast. `ObjectCalendarSchema` already declared eleven of them.

- `ObjectCalendarComponentProps.schema` is now `ObjectCalendarSchema`. **Breaking for a React host that passed an `object-grid` node or a `type: 'calendar'` literal to `<ObjectCalendar>`** — neither was ever a node this renderer is registered for. `ObjectCalendarProps`, the deprecated alias, follows it.
- `ObjectCalendarSchema.calendar` is declared on both published faces, bound to `@objectstack/spec`'s `CalendarConfigSchema` plus objectui's own `allDayField`. The container is kept `.passthrough()`, so nothing that parsed before is refused now; what is new is value validation — `calendar: 42` and `calendar: { startDateField: 42 }` are refused where both were admitted unexamined.
- The `dateField` / `endField` alias rungs inside `getCalendarConfig` are retired. Nothing wrote them: no producer, fixture, test or doc in this repo, and `@objectstack/spec` refuses both by name at the flat position and inside `CalendarConfigSchema`. A node configured only through a retired spelling now draws the existing "Calendar configuration required" refusal instead of resolving.
