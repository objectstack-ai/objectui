---
'@object-ui/app-shell': patch
---

A long api name no longer cuts a Studio item's title to a few characters (objectui#12791).

In Studio's item header the machine-name chip kept its whole width, so beside a long api name the item's label could shrink to something like "Service T…". The title and the chip now share the row in order. The title keeps at least 200 px, and the chip shows at least 14 characters (or its whole name, if shorter). The title then grows to its whole label, and the chip to its whole name. On a narrow row the chip truncates first, its full name in a tooltip on hover or keyboard focus. The title truncates last, and the row never overflows. The kind chips after the api name stay whole, and the meta and status folds are unchanged.

No export, prop, type or language-pack key changes.
