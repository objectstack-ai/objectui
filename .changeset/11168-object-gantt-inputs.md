---
'@object-ui/plugin-gantt': minor
---

feat(plugin-gantt): `object-gantt` publishes the eleven `@objectstack/spec` row keys its renderer honours (objectui#11168 slice 4)

The `object-gantt` registration now declares `navigation`, `label`, `skipWeekends`, `holidays`, `persistLayout`, `viewName`, `markers`, `criticalPath`, `showBaselines`, `readOnly` and `mobileReadOnly`. Each is a member of the spec's `ComponentPropsMap['object-gantt']` row, and each was measured through the real `SchemaRenderer`, `ObjectGantt` and `GanttView` before it was declared (objectui#11111 decision 3 = B). All eleven are honoured, so the page validator no longer reports any of them as an unknown prop. Where the row's own describe is true of this renderer, the input's description starts with it word for word, followed by what the measurement added:

- `navigation`: absent opens the task's record in a drawer; `drawer`, `modal` and `popover` open that overlay; `split` opens the record beside the chart; `page` and a block without `mode` open the record page in the same tab, and `new_window` in a new tab; `none` and `preventNavigation` open nothing; `openNewTab` outranks every mode except `none`; `size` sets the overlay width. The gantt derives the record-page address from the page it is on and does not use a record navigator the host publishes, so a host that publishes one changes nothing. On the object's own list or view route that address is the record page; on any other page, such as a custom page, `/OBJECT/record/ID` is appended to the current address. On inline rows that name no object, no mode opens anything.
- `label`: a string, or an inline locale map resolved to the display locale, naming the exported PNG/PDF file after `gantt.exportFileName` and before the object's own label.
- `skipWeekends` and `holidays` (members: `yyyy-mm-dd` strings): working-day auto-schedule math, and the day view folds those days out of its axis. A non-empty `holidays` turns the working calendar on by itself.
- `persistLayout` and `viewName`: the `objectName:viewName` storage key; `persistLayout: false` removes the save-layout button and stores nothing.
- `markers`, `criticalPath`, `showBaselines` and `readOnly`.
- `mobileReadOnly`: on a chart narrower than 640px the chart's write paths are read-only unless `false`; the record drawer locks under `readOnly` alone, so a task's record still opens writable on a narrow chart.

The `gantt` input's description no longer names `percentageField`, which nothing reads and the spec refuses by name. It now starts with the row's own describe and states the three required members.

Nothing changes at render time: every key was already read. The README and the docs page say what each key does, including the record-page address above. The README no longer lists `{ provider: 'schema', schemaId }` as a source this chart reads: measured, a gantt carrying it queries `objectName` instead.
