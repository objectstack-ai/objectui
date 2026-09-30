---
'@object-ui/types': patch
---

The `'agenda'` retirement text now points at a record a reader can open
(objectui#10701). Three zod `describe` strings — `CalendarViewSchema.view`,
`ObjectCalendarSchema.defaultView`, and the list-view `calendar` config's
`defaultView` — cited issue numbers that answer 404; they now end
`('agenda' was retired)`, because that sentence stands without a pointer. The
`CalendarViewMode`, `CalendarViewModeSchema`, `CalendarViewSchema` and
`ObjectCalendarSchema.defaultView` docblocks, and the `CalendarViewMode` row of
the schema reference, now cite the two landing commits instead: `b55a34647`
(`CalendarViewMode`) and `ed8df3e50` (`defaultView`).

Wording only: no accepted value, type or runtime behaviour changes. The same
pointer repair in `@object-ui/plugin-calendar` (the docblock above the shared
`object-calendar` inputs) is comment-only and declares no release.
