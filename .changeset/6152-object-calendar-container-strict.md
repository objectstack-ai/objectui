---
'@object-ui/types': minor
---

feat(types)!: the `object-calendar` element's `calendar` container is the `@objectstack/spec` 17.7.0 slot by reference, and its `.passthrough()` is gone (objectui#6152, round 9)

Clause-②: no

**Narrowed (breaking).** `@objectstack/spec` 17.7.0 types `ComponentPropsMap['object-calendar'].calendar`
as a strict copy of the list view's calendar block: `startDateField` required, `endDateField`,
`titleField`, `colorField` and `allDayField` optional, and any other key refused with
`unrecognized_keys`. `@object-ui/types` kept the container as the list view block `.partial()` plus
`.passthrough()`, so it accepted two things the spec refuses. It now takes the row's own member by
reference, on the zod `ObjectCalendarSchema` and, through the derived `ObjectCalendarBlockConfig`,
on the TypeScript interface:

- A key outside the five, inside the block, is refused. That includes `calendar.defaultView`:
  `ObjectCalendar` reads the view mode from the node's own `defaultView` and never from the block,
  so write `defaultView: 'week'` on the node.
- A block without `startDateField` is refused at `calendar.startDateField`. `ObjectCalendar`
  returns the block whole, so such a block mounted a calendar that placed no event.
- `ObjectCalendarBlockConfig` no longer has an index signature, and its `startDateField` is
  required, so a typed literal with either shape is now a compile error.

The retired `calendar.dateField` / `calendar.endField` keep their by-name refusal (objectui#8355),
which names the key to write instead. A census pin in this package's tests re-derives, on every
run, that each `object-calendar` container authored in this repository's examples, docs and
READMEs parses on the narrowed container.

What did not move: the list view's own `calendar` block, which keeps `.passthrough()` and
`defaultView`, and the renderers' reads.
