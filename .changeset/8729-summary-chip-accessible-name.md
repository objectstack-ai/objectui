---
'@object-ui/plugin-detail': patch
---

The record page's summary chip names its field by its LABEL, like every other band
of the page (objectui#8729).

The chips beside the record H1 carry no visible label, so `<field>: <value>` is the
whole of what a screen-reader user hears — and the name half was the raw stored
column. A record whose `owner_ref` column is authored as "Account Owner" announced
`owner_ref: Ada Lovelace`, so the one band that only a screen-reader user perceives
was also the one band exposing the database spelling.

Every sibling on the same page already resolves a label through one shared helper —
`HeaderHighlight` calls `fieldLabel(objectName, field.name, field.label)` and
`DetailSection` calls it with `field.label || field.name`. This chip now makes the
same call, so the chip and the highlight strip one band below name the same field
the same way, including under a translated session, where the resolver (not the
authored string) decides.

The chip is addressed by NAME (`summaryFields: ['owner_ref']`), so it resolves the
label it hands that helper from this render's own field resolution: the author's
view entry first, then the object schema, then the stored name as the floor — the
same precedence `enrichDetailField` states and the same floor `DetailSection`
spells. A field whose authored label already equals its stored name announces
byte-for-byte as before.

All three of the chip's name sites move together: the string branch's `aria-label`,
the percent branch's `aria-label`, and the renderer-backed branch's visually-hidden
prefix. The `data-summary-chip` attribute keeps the raw stored column — it is a
machine handle for tests and automation, not a name for a reader.
