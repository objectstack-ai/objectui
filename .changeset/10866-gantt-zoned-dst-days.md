---
'@object-ui/plugin-gantt': patch
'@object-ui/types': patch
---

fix(plugin-gantt): a zoned chart reads and writes a stored day as that day on a DST change (objectui#10866, slice 5)

A gantt with a business `timeZone` draws every date through a shim that re-bases it into that zone, and hands every dropped date back through the shim's inverse. Since this card's first slice, earlier in this same release, `ObjectGantt` has handed a date-only day in as the shim's inverse of the day's local midnight, and read a dropped `date` field back through the shim. Each direction reads the two zones' offsets at the instant it is handed, so on a DST day of one zone and not the other the round trip missed by an hour. An `America/Los_Angeles` viewer of an `America/New_York` chart saw a stored `2026-03-08` drawn from 23:00 on March 7th, and a drop onto March 8th wrote `2026-03-07`; `2026-11-01` was drawn from 01:00. A `Europe/Berlin` viewer of the same chart saw `2026-03-29` drawn from 23:00 on March 28th, and a drop onto it wrote `2026-03-28`.

- **plugin-gantt.** `ObjectGantt` now inverts the shim exactly for a day: it hands the view the instant the shim maps onto the day's local midnight, and writes the day of the display date the dropped instant was translated from. A stored day is drawn from its own midnight and a drop writes the day it was dropped on, on a DST change of the chart's zone or the viewer's too. Where the shim draws no instant at that midnight, as when the chart's zone changes its clocks at 00:00, the day is drawn from the first instant after it, on that day. A `datetime` value goes through the shim unchanged, and a chart with no `timeZone` is unchanged.
- **types.** The `GanttConfig.timeZone` description said that near a DST change a day could be drawn, and a drop written, as the day before. It now says the day holds on a DST change too.
