---
'@object-ui/plugin-gantt': patch
---

fix(plugin-gantt): a gantt move shifts a task's end by the calendar days it shifts the start, keeping each value's time of day across a DST change (objectui#10866, slice 6)

On the day, week, month, quarter and year scales a drag snaps to whole days. The start moved by calendar days, but the end followed it by the elapsed milliseconds of the start's move, and a summary's group move carried every task beneath it by that same span. Across a DST change of the viewer's zone that span is a whole number of days plus or minus an hour. Under `America/Los_Angeles`, a `date` task from October 29th to October 31st moved three days wrote `end_date` `2026-11-02` where the drop reads November 3rd; a `datetime` end that crossed the change when its start did not moved its wall-clock time by an hour; a task under a moved summary could start on the day before the one it was dropped on. An edge drag past the other edge stopped 24 hours from it, which on a DST day is 23:00 of the day before, or 01:00.

- **Move.** A drag now counts the calendar days its snapped start moved and moves the start and the end by that many days on the local calendar. Each keeps its hours, minutes, seconds and milliseconds, as objectui#11005 ruled for the calendar's month grid, so a `date` task keeps its length in days and a 10:00 start stays at 10:00. This deliberately changes the instant a drag writes into a `datetime` end across a DST change; what a `datetime` field stores and how it is read are unchanged.
- **Edge drags.** The end handle already moved the end by calendar days, keeping its time of day. An edge dragged past the other edge now stops one calendar day from it.
- **Group move.** Dragging a summary moves the summary and every unlocked task beneath it by the same calendar days, and the live preview draws what the drop writes.
- **Unchanged.** In a zone without DST every day is 24 hours, so a drag writes what it wrote before. The shift-band scale (`timeSegments` in day view) moves by bands on an elapsed-time axis and is unchanged.
