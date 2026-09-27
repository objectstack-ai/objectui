---
'@object-ui/plugin-dashboard': patch
---

The dashboard date filter's "Custom…" item opens the range calendar again, and
the calendar stays open (objectui#10843).

Two defects, both measured in Chromium. With a custom range stored, the
select's value already is the "Custom…" item, and Radix Select reports a pick
only when it changes the value, so picking it again did nothing: a stored range
could not be reopened for editing. From a preset the pick did open the
calendar, but the select then returned focus to its trigger, and focus leaving
the calendar's popover dismissed it as soon as the select finished closing.

"Custom…" now opens the calendar from its own activation (pointer, touch,
Enter or Space), whether the value changes or not, and only after the select
has closed, so the calendar keeps focus. A stored range reopens on the month of
its first day. Closing the calendar with Escape returns focus to the date
select. Closing the select without picking "Custom…" (Escape, a click outside)
still opens nothing, and picking a preset commits it as before.
