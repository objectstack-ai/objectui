---
'@object-ui/components': patch
---

fix(components): the date pickers and every `Calendar` read the display locale (objectui#10722)

`useDisplayLocale()` is what every date renderer formats with, and the `Intl`
faces have read it since objectui#10442 and objectui#10668. The date-fns and
react-day-picker faces never did. They take a date-fns `Locale` object, not the
BCP-47 tag the hook returns, and with none they answered in date-fns `enUS` under
every display locale and every UI language: under a `de-CH` display locale the
form date picker read `March 4th, 2020`, and its calendar `March 2020` over
`Su Mo Tu …`.

Now the form date picker (`type: 'date-picker'`), the `DatePicker` component and
every `Calendar` mounted without a `locale` (the `ui:calendar` renderer, both
pickers' popovers, and the ones `CalendarView` and `DashboardFilterBar` mount)
read the display locale: `4. März 2020`, and `März 2020` over `Mo Di Mi …`.

- **The week start follows the locale.** A calendar under a display locale whose
  week begins on Monday (`de`, `fr`, `en-GB`, …) now starts on Monday. That is
  the display locale's own reading; an `en-US` session still starts on Sunday.
- **`format` keeps its meaning.** `DatePickerSchema.format` is still a date-fns
  pattern and is still honoured as written. Its textual tokens (`PPP`, `MMMM`,
  `EEEE`, …) are now spelled in the display locale; a numeric pattern such as
  `yyyy-MM-dd` reads as before.
- **A `locale` a caller passes to `Calendar` still wins.**
- **English sessions read exactly as before.** `en` and `en-US` resolve to the
  same `enUS` every face read until now.

The tag is resolved against date-fns's own locale codes: as given, then with the
region and script CLDR's likely subtags give it, then its bare language (`de-CH`
reads `de`, `zh` reads `zh-CN`). A tag date-fns has no locale for reads `enUS`.
Each locale is loaded on demand, one `import()` per locale, so no locale is in
this package's bundle and an app fetches only the one its session reads. The
first paint of a session whose locale has not loaded yet reads `enUS`, then
re-renders once the locale arrives; later mounts read it straight away.
