---
'@object-ui/plugin-timeline': patch
---

fix(plugin-timeline): a gantt-variant timeline draws its headers and bars on one continuous axis, so each bar lines up under its header (objectui#11079)

- **Bars now sit under their headers.** The header row was one equal-width column per unit from the first date to the last date inclusive, while the bars were measured on the span from the first date to the last date, one unit shorter. So every bar after the first sat off its column: on a day axis over October 5th to 7th, the bar starting on the 6th was drawn halfway across the chart under a column that starts at one third. Both are now drawn on one axis, from the start of the first unit to the end of the last. A bar that starts on a day, a month or a quarter begins exactly where that unit's header begins.
- **Each header is as wide as its unit is long.** Hour, day and week columns are equal. A month column is as wide as its days, so February is narrower than January, and a quarter or a year is as wide as its days. Across a daylight-saving change a day column is 23 or 25 hours wide, as the day is.
- **Each unit starts on its boundary.** A month axis from January 15th to April 10th now has an April column, and one from January 31st no longer skips February. `generateTimeScaleHeaders`, which the package exports, returns these labels.
- A task that starts and ends at the same instant is a zero-width bar at that instant, as it already was on any plan with two distinct dates. A plan whose only dates were one such day used to draw that bar across the whole chart.
