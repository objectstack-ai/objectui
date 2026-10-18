# objectui#12197 — visual evidence (never merged)

Screenshots of the five product-page blocks, drawn by the console preview
gallery (`apps/console/preview-gallery.html?only=product_blocks`, add
`&theme=dark` for dark mode) through the real `SchemaRenderer`, with no backend.
Taken from branch `claude/issue-12197-generic-product-blocks` at `07b6fc8`.

| block | light | dark |
|---|---|---|
| hero | hero-light.png | hero-dark.png |
| stat | stat-light.png | stat-dark.png |
| usage-bar (a used/limit bar, an over-limit bar, an unlimited one) | usage-bar-light.png | usage-bar-dark.png |
| checklist (`collapsedWhenDone` set, one step open) | checklist-light.png | checklist-dark.png |
| tile-grid (three tiles and the add tile) | tile-grid-light.png | tile-grid-dark.png |
| hero, usage-bar and checklist bound to `dataSource: { provider: 'api', … }` against an in-memory answer | bound-light.png | bound-dark.png |

This branch exists only to host these files; it is not meant to be merged.
