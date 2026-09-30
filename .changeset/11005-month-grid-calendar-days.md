---
'@object-ui/plugin-calendar': patch
---

fix(plugin-calendar): a month-grid move keeps the wall-clock time across a DST change (objectui#11005)

The month grid moved an event by the milliseconds between the grabbed cell's local midnight and the drop cell's. Across a DST change that span is 23 or 25 hours. Under `America/Los_Angeles`, a 10:00 event moved onto or off November 1st or March 8th landed at 09:00 or 11:00. A span starting at local midnight, grabbed on a later day and moved, started at 23:00 of the day before the one it was dropped on. The calendar's own month-view quick-create writes such local-midnight instants.

- **Move.** The grid now counts the calendar days between the grabbed cell and the drop cell and moves the start and the end by that many days on the local calendar. Each keeps its hours, minutes, seconds and milliseconds, so a 10:00 event stays at 10:00 on the day it is dropped on, whatever DST change lies between. This deliberately changes the instant a drag writes into a `datetime` field; what a `datetime` field stores and how it is read are unchanged. In a zone without DST every day is 24 hours, so a move writes what it wrote before.
- **Drag of a span's end.** The right-edge handle moves the end by calendar days the same way. It already kept the end's hours, minutes and seconds; it now keeps its milliseconds too.
- **`date` fields.** A `date` value is read at local midnight of its day, so it now comes back at local midnight of the day it was dropped on, and `ObjectCalendar` writes that local day. The `ObjectCalendar` repair from objectui#10866, which moved a day event's stored day by the whole days the grid moved it, is removed: every day move it pinned writes the same day without it.
- The week and day views are unchanged. Their time grid places a moved event at its snapped time on the drop day's own clock, not by a day delta.
