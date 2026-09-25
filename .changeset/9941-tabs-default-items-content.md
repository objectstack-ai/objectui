---
'@object-ui/components': patch
---

The shipped `ui:tabs` registration's `defaultProps.items` now spell `content`, the
child key the published `TabItemSchema` declares, instead of the undeclared `body`
(objectui#9941).

All three seeded items spelled `body` and omitted `content`, so the default an
author drops on a canvas was refused by the validator this repository publishes
for it — `invalid_type ["content"] expected nonoptional, received undefined`,
measured against the built schema, with the lit control that the same item spelled
`content` parses green with keys `value,label,content`.

⚠️ No rendered output moves. At this change, `tabs.tsx` reads `item.content` first and
falls back to `body` through an `any` cast, so the same nodes move from the fallback arm onto
the primary one; the repair is at the parse and the rendered markup is unchanged
(asserted, not assumed). What changes for an author is that copying the shipped
default into authored metadata now validates.

The fallback arm itself is untouched and `TabItemSchema` is untouched — widening
the published accept set to admit `body` would pre-empt the `body`-dialect
question open on objectui#9871.

⚠️ **Dated note, 2026-09-25 — the fallback arm is retired and `TabItemSchema` refuses `body` — objectui#9590.**
Later in this same release, `tabs.tsx` draws `item.content` and nothing else, and
`TabItemSchema` refuses an item-level `body` by name, pointing at `content`. The
paragraphs above are kept as the reading of this change.
