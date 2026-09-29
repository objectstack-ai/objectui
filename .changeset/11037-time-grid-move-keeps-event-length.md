---
'@object-ui/plugin-calendar': patch
---

fix(plugin-calendar): a week or day view move keeps the event's own length and grab point (objectui#11037)

The week and day views draw an event that crosses midnight as one piece per day, clipped at midnight, and a short event as a piece at least 15 minutes tall. A move took its length and its grab offset from the grabbed piece. So a 22:00 to 02:00 event dragged by its first piece to 10:00 was handed to `onEventDrop` as 10:00 to 12:00, and `ObjectCalendar`'s default drop handler writes what it is handed. Grabbed by its second piece, the event's start went where its midnight had been grabbed. A 5-minute event came back 15 minutes long.

- **Length.** A move now keeps the event's own `end - start`, as elapsed time, so a `datetime` event keeps its real length. On the night a DST change falls in, the wall clock shows that length an hour longer or shorter: a 4-hour event placed at 22:00 on the night the clocks fall back reads 22:00 to 01:00.
- **Grab point.** The grabbed point's offset is measured from the event's own start, so the point under the pointer stays under the pointer. A 22:00 to 02:00 event grabbed at its own 00:00 and dropped at 10:00 is written 08:00 to 12:00.
- **Crossing midnight.** An event that crosses midnight is placed where it is dropped, so it can stay overnight; before, it was held to end by midnight of the drop day. An event drawn wholly inside one day is still held inside the drop day, as before.
- The drag preview is labelled with the whole event's times and drawn over the part of it that falls on the drop day.
- An event with no end is still handed an end one hour after its new start. All-day and date-only events sit in the all-day row, which has no drag, so nothing about them changes. The month grid and the resize handles are unchanged.
