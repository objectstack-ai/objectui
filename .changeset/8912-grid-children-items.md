---
---

Repair the three teaching surfaces that authored a `grid` node's child list as
`items` — a key the `grid` renderer never reads, so the root README's flagship
example drew an empty grid (objectui#8912). The root `README.md` "Basic Usage"
fence, `content/docs/guide/schema-rendering.md` and
`content/docs/guide/schema-playground.md` now spell it `children`, the key
`GridSchema` declares and `grid.tsx` reads. Documentation and test only: neither
the renderer nor `GridSchema` moves, and no package is released by this change.
