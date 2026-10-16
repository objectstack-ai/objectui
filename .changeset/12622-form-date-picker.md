---
'@object-ui/fields': patch
'@object-ui/i18n': patch
---

Record forms draw `date` and `datetime` fields with the platform date picker instead of the browser's native date input (objectui#12622).

The picker is a text box in the display locale's format (`10/16/2026` in English, `2026/10/16` in Chinese), with a calendar popover, keyboard entry, a clear button, and Today / Tomorrow shortcuts. The native input took its placeholder and digit order from the machine, so an English console could show a Chinese machine's placeholder.

- **The value written is unchanged.** A `date` field writes `YYYY-MM-DD` and a `datetime` field writes an ISO instant, as the native inputs did. Clearing writes an empty value, as before. Typed text that names no date is not written: the box is marked invalid and a notice names the expected format.
- **Where it applies.** The form registration of `field:date` / `field:datetime` (what `registerField` / `registerAllFields` register) takes the picker, and so does `getLazyFieldWidget` (the action-param and bulk-action dialogs, objectui#12642). The detail inline editor (`InlineFieldInput`) and a form without `@object-ui/fields` registered keep the native input. The read-only face is unchanged.
- **New language-pack keys** in all ten packs: `fields.datePicker.today`, `tomorrow`, `clear`, `openCalendar` and `invalid`.
