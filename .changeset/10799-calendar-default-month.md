---
'@object-ui/components': patch
'@object-ui/plugin-calendar': patch
'@object-ui/plugin-dashboard': patch
---

fix: every `Calendar` picker opens on its selected date's month, not today's (objectui#10799)

react-day-picker opens on `month`, else `defaultMonth`, else today, and
`selected` does not move it. Five `Calendar` mounts passed `selected` only, so
a value outside the current month opened the picker on today's month: with
the calendar on 4 March 2020 and today in September 2026, the header of
`CalendarView` read `March 2020` while the popover under it opened on
`September 2026`, with no selected day in view.

Each mount now passes its first selected day as `defaultMonth`:

- `CalendarView`'s header date popover (`@object-ui/plugin-calendar`) opens on
  the date the header names, and follows Previous / Next between opens;
- `ui:calendar` opens on its day in `single` mode, on the first valid listed
  day in `multiple` mode (an entry that is not a date is skipped) and on `from`
  in `range` mode. It reads that month once, when it mounts: a value that
  changes afterwards does not move the month it shows;
- the form date picker (`date-picker`) and `DatePicker` open on their value;
- the dashboard date filter's custom-range calendar
  (`@object-ui/plugin-dashboard`) opens on the range's `from`.

With no value, each still opens on today. react-day-picker throws on an
invalid `defaultMonth`, so a day that names no instant is not passed as one: an
unparseable `ui:calendar` day, a range `from` that does not parse, and an
invalid `Date` a host hands `CalendarView` each open on today, as before. The
two date pickers are unchanged in this respect: an invalid value already fails
in their trigger's label, before any calendar mounts. The `Calendar` primitive
itself is unchanged.
