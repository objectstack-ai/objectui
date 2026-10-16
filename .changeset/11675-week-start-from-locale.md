---
'@object-ui/i18n': minor
'@object-ui/plugin-calendar': minor
'@object-ui/plugin-timeline': minor
---

The calendar and the timeline start the week on the first day of the week of the user's locale (objectui#11675), instead of a fixed Sunday (calendar) and a fixed Monday (timeline). Under `en-US` both start on Sunday; under `en-GB` or `zh-CN` both start on Monday; under `ar-EG` both start on Saturday. There is no separate week-start setting: the first day comes from the locale the dates are already formatted with.

- **`@object-ui/i18n` exports `firstDayOfWeek(locale)` and its `WeekdayIndex` type.** It returns the first day of the week for a BCP-47 tag, numbered as `Date.prototype.getDay` numbers weekdays (0 is Sunday), which is also what react-day-picker's `weekStartsOn` takes. It reads the engine's `Intl.Locale` week info (`getWeekInfo()`, else the `weekInfo` accessor), including a `-u-fw-` keyword on the tag. Where the engine has neither, it reads CLDR's first-day table by the tag's region, or the region CLDR's likely subtags give it (`en` reads `US`, `zh` reads `CN`), and a region the table does not list reads Monday, CLDR's world default. A malformed tag throws the same `RangeError` that formatting a date with it would.
- **The calendar's weeks start on the locale's first day.** `CalendarView` (and `object-calendar` through it) reads the first day from its `locale` prop, else the display locale, and the month grid's rows, its weekday heads, the week view's columns, the header's week range, the day a span that wraps into a new row shows its title on, and the header's date popover all start there. The popover used to take date-fns's own week start for the tag, which is not CLDR's for every tag (date-fns reads `es-MX` as `es`, a Monday start, where CLDR starts Mexico's week on Sunday) and which read Sunday until the date-fns locale had loaded.
- **The object timeline's "This week" and "Next week" start on the display locale's first day.** The bucket bounds are also stepped on the local calendar now, so across a DST change the day after it is "Tomorrow" again, and the first day of next week no longer falls into "This week".

A host that relied on the calendar always starting on Sunday, or on the timeline's week always starting on Monday, now sees the locale's first day. The gantt variant's `week` axis is unchanged: it still counts plan weeks from the axis's first day.
