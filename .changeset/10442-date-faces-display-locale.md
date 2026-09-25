---
'@object-ui/components': patch
'@object-ui/app-shell': patch
'@object-ui/plugin-gantt': patch
'@object-ui/plugin-calendar': patch
---

Four more date faces now follow the display locale, not the UI language (objectui#10442).

Each one takes its locale from `useDisplayLocale()` instead of the UI language. With an English UI and
a `de-CH` display locale, a date that used to read `3/4/2020` now reads `4.3.2020`. With no display
locale declared, the display locale falls back to the UI language, so these dates render as before.

- `data-table` (`@object-ui/components`): the ISO date and datetime cells.
- The record page's History tab (`@object-ui/app-shell`): the `date` and `datetime` values in each
  field diff.
- `ResourceWorkload` (`@object-ui/plugin-gantt`): the column labels and the cell tooltips. With no
  language at all it used to fall through to the machine's locale; it now gets the display locale's
  own last resort.
- `CalendarView` (`@object-ui/plugin-calendar`): the default locale for the header, the weekday
  columns and the day cells. An explicit `locale` prop still wins over the display locale.
