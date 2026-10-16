---
'@object-ui/plugin-list': patch
---

A list view's `date-range` user-filter chip draws the platform date picker on both bounds, and names them in the console's language (objectui#12784). It used to draw two native date inputs, which take their placeholder and digit order from the machine's locale, labelled with the English literals "From" and "To".

- **How it gets there, with no new dependency.** Each bound resolves the `field:date` widget from `ComponentRegistry` at render time, the seam the list Filter panel and `filter-ui` use since objectui#12743. `@object-ui/fields` registers the picker there behind its lazy loader. With no `field:date` widget registered, a bound keeps the native input.
- **The labels.** The bounds reuse the language packs' existing `filterBuilder.rangeStart` / `filterBuilder.rangeEnd` keys, which all ten packs already carry.
- **The value written is unchanged.** Each bound writes `YYYY-MM-DD`, and the chip writes `[]` when both bounds are empty, so the list query gets the same `>=` / `<=` conditions as before.
- **A typed day is applied.** The picker reads its text on blur and on Enter. A pointer press outside the bound while it holds focus blurs it first, so the text is read before the chip's popover closes on that press. Escape discards.

Clause-②: no — no prop, export, dependency or language-pack key is added or removed.
