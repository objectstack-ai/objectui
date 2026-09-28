---
'@object-ui/plugin-calendar': patch
'@object-ui/plugin-gantt': patch
'@object-ui/types': patch
'@object-ui/core': patch
---

fix(plugin-calendar): a day event moved across a DST change writes the days it was dropped on (objectui#10866, slice 4)

- **plugin-calendar.** The month grid moves each date of an event by the milliseconds between two local midnights, the grabbed cell's and the drop cell's, and a date-only value is read at local midnight of its day. So when a DST change lay between one of an event's dates and where it landed, but not between the two cells (or the other way round), that date came back an hour off local midnight; at 23:00 of the day before, the write took the day before. Under `America/Los_Angeles` a span of `date` fields moved across November 1st or March 8th could be written a day short at its start or its end. A move of an event whose start, and end when it has one, are both stored calendar days now writes each `date` field as its stored day moved by the whole days the grid moved it. Every other write is unchanged: a `datetime` field still writes the instant the grid hands back, and the grid's own arithmetic does not change.
- **plugin-gantt, types.** The business `timeZone` prose (`GanttConfig.timeZone`, `GanttViewProps.timeZone` and `makeTzShift`) said persisted data stays real instants. A `date` field under a zoned chart has been written as a calendar day since this card's first slice; the prose now says so, and says that near a DST change of the chart's zone or the viewer's the shim can place a day's midnight an hour early, onto the day before. Documentation only.
- **core.** The `DATEADD` / `DATEDIFF` / `DATEFORMAT` docblock names how a mixed `DATEDIFF`, one day and one instant, reads each argument when it counts months or years. Comment only.
