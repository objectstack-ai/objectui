---
"@object-ui/plugin-detail": patch
---

`record:quick_actions` maps an action's spec `variant` onto the `Button` vocabulary the way the record header and the row menu do: `danger` draws the destructive style and `primary` the default (filled) style, while `secondary`, `ghost` and `link` pass through. The block's own `variant` stays the fallback for an action that declares none (objectui#12986).
