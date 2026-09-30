---
'@object-ui/plugin-calendar': patch
---

fix(plugin-calendar): a week or day resize of an overnight event keeps its other edge (objectui#11060)

The week and day views draw an event that crosses midnight as one piece per
day, clipped at midnight, and a short event as a piece at least 15 minutes
tall. The top resize handle sits on the event's first piece and the bottom
handle on its last. A resize rebuilt both edges on the grabbed piece's day,
the untouched one from that piece's clipped bound. So a 22:00 to 02:00 event
resized by its top handle to 21:00 was written 21:00 to 00:00, losing the two
hours past midnight, and resized by its bottom handle to 03:00 was written
00:00 to 03:00, its start moved to midnight. A press and release on the top
handle without moving cut the end to midnight too, and a 5-minute event resized
by its top handle came back ending 15 minutes after its old start.

The top handle now changes only the start and the bottom handle only the end.
The other edge is the event's own instant, handed to `onEventDrop` unchanged.
The dragged edge is placed as before, at the pointer's row on the grabbed
piece's day, snapped, and held one slot away from the kept edge wherever that
edge falls. The preview while dragging is labelled with the whole event's
times. A same-day event resizes exactly as before.
