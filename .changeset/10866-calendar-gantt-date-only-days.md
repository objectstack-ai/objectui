---
'@object-ui/plugin-calendar': patch
'@object-ui/plugin-gantt': patch
'@object-ui/types': patch
---

fix(plugin-calendar,plugin-gantt): a stored date-only day shows on that day in every viewer zone, and a `date` field is written back as a calendar day (objectui#10866, slice 1)

The calendar and the gantt read a record's `YYYY-MM-DD` value with the engine's own `Date` parse, which reads it as UTC midnight. West of UTC a task due on the 5th therefore showed on the 4th, in both views. Moving it then wrote `toISOString()` into the field: a UTC instant stored in a `Field.date`.

- **Reads.** Every date-only read in the two plugins now goes through `toDisplayDate` from `@object-ui/core`, which reads the value at local midnight of the day it names. In the calendar these are the object calendar's event start and end, and the `calendar-view` node's events and its authored `currentDate`. In the gantt they are the task start, end and baselines, a marker authored as a day, and the day typed into the inline editor. A value with a time keeps its instant.
- **Writes.** A calendar drop, a calendar quick-create and a gantt drag now write a field declared `date` as the local calendar day, `yyyy-MM-dd`. A `datetime` field keeps its instant. When no object schema is available to say which type a field is, the stored value's own shape decides, which is the same split the read makes; a calendar quick-create has no stored value, so there it still writes the instant.
- **Gantt `timeZone`.** A chart with a business `timeZone` re-bases every instant into that zone. A date-only day is not re-based: its bar and its marker stand on that day of the chart's calendar for every viewer, and a drop writes the day of the chart's calendar that the bar was dropped on.
- **Gantt working calendar.** `skipWeekends` / `holidays` now count the chart's own calendar days (local midnight, the same keys the day columns already folded by) rather than UTC days. The UTC floor put a rescheduled successor on the previous day in every zone except UTC once date-only values read as local days. `@object-ui/types` updates the `holidays` description to match.

The timeline, charts, formula date functions and i18n helpers are later slices of objectui#10866.
