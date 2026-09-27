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
- `ui:calendar` opens on its day in `single` mode, on the first listed day in
  `multiple` mode and on `from` in `range` mode;
- the form date picker (`date-picker`) and `DatePicker` open on their value;
- the dashboard date filter's custom-range calendar
  (`@object-ui/plugin-dashboard`) opens on the range's `from`.

With no value, each still opens on today. A day that names no instant (an
unparseable `ui:calendar` day, or a range `from`) opens on today as before:
react-day-picker throws on an invalid `defaultMonth`, so it is never passed one.
The `Calendar` primitive itself is unchanged.
