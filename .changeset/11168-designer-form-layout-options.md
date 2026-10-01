---
'@object-ui/app-shell': patch
---

The page-block inspector no longer offers `Inline` and `Grid` for an `object-form`'s `layout` (objectui#11168 slice 3, objectui#7759 group C). `@objectstack/spec` 17.5.0 refuses both values, and both rendered as `Vertical`, so the designer was writing values that publish refuses. The two option labels (en, zh) are removed with the options.
