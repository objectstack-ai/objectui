---
'@object-ui/components': minor
'@object-ui/app-shell': minor
---

The record header's favorite star draws only where the host wires a toggle, and the console record page no longer draws one (objectui#12427).

- **`page:header` record chrome (`@object-ui/components`).** The star beside the record title now draws only when the record context carries `onToggleFavorite`. Before, the chip drew a star on every record header whose `showStar` was not `false`, and on a host that wired no toggle that star flipped on its own local state and stored nothing. Such a host now shows no star; the metadata editor's record-page preview is one. A host that does wire `onToggleFavorite` keeps its star, which mirrors `isFavorite` as before, and an authored `showStar: false` still hides it there. `RecordContextValue` is unchanged: `isFavorite` and `onToggleFavorite` stay the way a host opts in.
- **Console record page (`@object-ui/app-shell`).** `RecordDetailView` no longer hands the record context `isFavorite` / `onToggleFavorite`, so its header draws no star. The record's favorites entry is the one in the header's ⋯ overflow, ahead of Share, which adds or removes the `record:` favorite shown in the sidebar's Favorites section. An automation that clicked the header star by its "Add to favorites" button name now opens the ⋯ overflow and chooses the menu entry of the same name.
