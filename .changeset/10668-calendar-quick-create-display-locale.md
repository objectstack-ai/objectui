---
'@object-ui/plugin-calendar': patch
---

The calendar's quick-create dialog now formats its date with the same locale as the month grid (objectui#10668).

`ObjectCalendar`'s quick-create dialog used its `locale` prop as is. When no host passed one, that was
`undefined`, so the dialog's date and time followed the machine's locale while the grid beside it
followed the display locale. The dialog now uses the grid's rule: an explicit `locale` prop still wins,
and otherwise the dialog reads `useDisplayLocale()`. With an English UI and a `de-CH` display locale,
clicking 18 March now opens a dialog reading `On 18. März 2020`.
