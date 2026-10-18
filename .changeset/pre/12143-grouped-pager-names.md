---
'@object-ui/plugin-grid': patch
---

A grouped grid's own first, previous, next and last page buttons have accessible names (objectui#12143).

A grouped `ObjectGrid` with more than one page of groups pages them with a pager of its own, not the `data-table` pager objectui#12124 named. Its four buttons showed a chevron and nothing else, so a screen reader announced four unnamed buttons and could not tell them apart. Each button is now named in the viewer's language, with the words the data table pager uses: "First page", "Previous page", "Next page" and "Last page" in English. Sighted use is unchanged. No language-pack key is added: the names read the four `table.*` keys objectui#12124 added, and the grid's English defaults for a host with no `I18nProvider` gain the same four rows. No export or prop changes.
