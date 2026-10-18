---
'@object-ui/components': patch
'@object-ui/plugin-view': patch
---

List filters on `date` and `datetime` fields draw the platform date picker, the face record forms, action dialogs and grid cells already draw (objectui#12743). The native input took its placeholder and digit order from the machine's locale, not the console's.

- **Where it applies.** `FilterBuilder`'s value editor for a `date` / `datetime` row, both bounds of a `between` row included (the console list toolbar's Filter panel renders it), and `filter-ui`'s `date` and `date-range` filters. `time` rows keep the native input.
- **How it gets there, with no new dependency.** Both resolve the `field:date` / `field:datetime` widget from `ComponentRegistry` at render time, the way the form renderer resolves `field:<type>`. `@object-ui/fields` registers the picker there behind its lazy loader, so `@object-ui/components` still does not import `@object-ui/fields`, `@object-ui/plugin-view` gains no dependency, and the picker stays in its own chunk. A host that does not load `@object-ui/fields` keeps the native input.
- **The value written is unchanged.** A `date` row writes `YYYY-MM-DD`; a `datetime` row writes the zoneless local `YYYY-MM-DDTHH:mm` the native `datetime-local` input wrote; `filter-ui` writes `YYYY-MM-DD`.
- **A typed day is applied.** The picker reads its text on blur and on Enter. A pointer press outside the editor while it holds focus blurs it first, so the text is read before a popover or drawer that hosts the filter closes on that press. Escape discards.
- **No public surface changes.** No type member, prop, export, dependency or language-pack key is added or removed.
