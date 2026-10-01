---
'@object-ui/types': patch
'@object-ui/plugin-calendar': patch
---

`object-calendar` is taught with its `calendar` block, not with flat field-name keys (objectstack-ai/objectui#8831).

`@objectstack/spec` refuses `startDateField`, `endDateField`, `titleField`, `colorField` and `allDayField` written flat on an `object-calendar` node, and its diagnostic prescribes `calendar: { startDateField, endDateField, titleField, colorField, allDayField }`. Since 17.5.0 the spec's `CalendarConfigSchema` declares all five, `allDayField` included. objectui's published faces still taught the flat spelling as something to write, so an author who followed them was refused at publish.

- `@object-ui/plugin-calendar`: both `object-calendar` examples in the README write the five keys inside `calendar`, and the README says what the flat spelling is: the runtime handoff `ObjectView` and `ListView` emit, which `getCalendarConfig` reads only when the node has no `calendar` block. The five-key sentence for `calendar-view` stays and now says it is about that element: `CalendarViewSchema` has no `calendar` block, so the flat keys are its only spelling.
- `@object-ui/types`: the `.describe()` text and the TypeScript docblocks of `ObjectCalendarSchema`'s five flat members call them the read-only handoff and point at `calendar.KEY`. The `calendar` member's text calls the block the authored spelling. The `allDayField` member of the `calendar` block no longer calls the key objectui-local, because 17.5.0 declares it.

Descriptions and documentation only. No accept set moves: the flat members stay declared on both faces, with the same types, because the renderer still reads them.
