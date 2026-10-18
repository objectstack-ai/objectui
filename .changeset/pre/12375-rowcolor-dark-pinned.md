---
'@object-ui/plugin-grid': patch
'@object-ui/components': patch
---

A grid row coloured by `rowColor` now reads in the dark theme, and its colour covers the whole row (objectui#12375).

- **Dark theme.** Each of the 23 colour names used to resolve to one light-only fill (`bg-red-100` for `red`), so in the dark theme the row's light text sat on a light fill and was close to unreadable. Each name now resolves to a light and a dark tint. The light tint is the same `-100` shade as before. The dark tint is the surface shade the badges use: `-950` at 40%, or `-800` at 50% for the grey names (`gray`, `grey`, `slate`, `zinc`, `stone`, `neutral`). The row keeps the theme's text colour.
- **The whole row.** The selection checkbox, the row number, the frozen columns and the right-pinned actions column now show the row's colour too. Before, they kept the page background, so a coloured row had gaps at both ends. These cells stay opaque, so content scrolling beneath them does not show through.
- While a coloured row is hovered or selected, the whole row takes the hover or selection fill, as the middle of the row already did.

A `rowColor` value written as a `bg-*` class still passes through unchanged. It colours the row but not its pinned cells, and suiting it to the dark theme is up to the author.

`@object-ui/components`: the data table reads a row tint from the `--os-row-tint` custom property, which a `rowClassName` may set. It paints that tint into the row's sticky cells. Nothing is added to either package's exports.
