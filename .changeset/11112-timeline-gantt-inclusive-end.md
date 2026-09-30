---
'@object-ui/plugin-timeline': patch
'@object-ui/types': patch
---

fix(plugin-timeline,types): a gantt-variant timeline draws a date-only end through the end of that day (objectui#11112)

- **A date-only `endDate` is inclusive.** A bar authored `2024-01-01` to `2024-01-31` now fills January and ends exactly where the February column begins. It used to end at the start of January 31st, one day short of its column. A bar that starts and ends on the same day is now one day wide, where it was zero wide. An end with a time part, or given as a number or a `Date`, is still an instant, and the bar ends exactly there, so a task that starts and ends at the same instant is still a zero-width bar at that instant.
- **The computed axis reaches the end of every bar.** On an `hour` axis, the axis a gantt computes from its bars now runs through the last day of a date-only end, and to the hour of an instant end. It used to stop after the first hour of the last day, so those bars ran off the chart. A `minDate` / `maxDate` the author pins is still exactly the author's range, and the other scales gain no column.
- The bar tooltip still prints the end as authored.
- `TimelineGanttItemBar.endDate` in `@object-ui/types` now documents the inclusive reading, on both the TypeScript type and its zod description. What it accepts is unchanged.
