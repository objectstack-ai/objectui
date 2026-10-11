---
'@object-ui/i18n': minor
'@object-ui/components': patch
---

A paged table's first, previous, next and last page buttons have accessible names (objectui#12124).

The `data-table` pager, which every paged `ObjectGrid` draws, showed four icon buttons whose only content was a chevron, so a screen reader announced four unnamed buttons and could not tell them apart. Each button is now named in the viewer's language: "First page", "Previous page", "Next page" and "Last page" in English. Sighted use is unchanged.

Added: four language-pack keys, `table.firstPage`, `table.previousPage`, `table.nextPage` and `table.lastPage`, in all ten packs, and the same four rows in the renderer's English defaults for a host with no `I18nProvider`. No export, prop or type member is added.
