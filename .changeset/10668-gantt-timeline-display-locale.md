---
'@object-ui/plugin-gantt': patch
---

The gantt timeline now follows the display locale, not the UI language (objectui#10668).

`GanttView` takes its date locale from `useDisplayLocale()` instead of the UI language. This covers the
timeline's column and band headers, the toolbar's period label, the task list's start and end dates,
a bar's hover card, and the dates shown while a bar is dragged. With an English UI and a `de-CH` display locale, a week column that used to read
`3/2` now reads `2.3.`, the same locale `ObjectGantt`'s tooltips and `ResourceWorkload` already use in
the same chart. With no display locale declared, the display locale falls back to the UI language, so
the timeline renders as before. With no language at all, it used to fall through to the machine's
locale; it now gets the display locale's own last resort.
