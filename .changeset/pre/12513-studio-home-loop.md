---
'@object-ui/app-shell': patch
---

Studio's way home leads back to the Studio landing, and the two links that leave for Setup say so (objectui#12513).

- **The header's first button returns to the Studio landing** (`/studio`), where the author picks another package, a recent one or the organization's flows. It is titled "Studio home" and still asks before leaving unsaved pillar edits. The console home is one click further, through the landing's own top bar.
- **The package switcher's first row is "Studio home"**, above the package list. It asks before leaving unsaved edits, like the other rows.
- **The installed package card's link reads "Open in Setup"** with an outward arrow. It still opens the package's metadata directory in Setup, and its tooltip still explains environment overlays.
- **The empty Organization flows page links to Setup › Packaged automation**, the list its sentence names, through an "Open in Setup" link with an outward arrow. It offers no create button, since this scope creates nothing.

The new copy lives in the metadata-admin designer's own string tables (en and zh).
