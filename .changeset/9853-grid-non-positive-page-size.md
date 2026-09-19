---
'@object-ui/plugin-grid': patch
---

Refuse a non-positive `pageSize` at all three of `ObjectGrid.tsx`'s read points,
instead of giving two different answers for one authored value (objectui#9853).

One authored `pagination.pageSize` (or the deprecated flat `pageSize`) reaches
three read points in this block, and they disagreed about a non-positive number.
The flat display size read it with `||`, so `0` was falsy and fell through to a
default; the grouped-page seed and the server-window seed read it with `??`, so
`0` was not nullish and survived as a real page size.

What the surviving `0` actually did, measured in the real renderer over a
seven-row fixture rather than inferred: the server-window seed sizes the fetch,
so `$top: 0` went out on the wire and the grid asked the server for nothing.
A plain table drew "No results found", and a grouped one rendered zero group
rows. This happens **with or without `grouping`** — the issue's framing that a
flat table renders normally until `grouping` is added does not survive the
measurement, because the seed that breaks it feeds the fetch either way. The
`Infinity` page count the arithmetic predicts is likewise not reachable on
screen: the grouped pager is gated on having groups, and with zero rows fetched
there are none, so it never renders.

All three points now read one resolver, mirroring the `rowHeight` resolver a few
lines above it — one resolver at every entry is what keeps the answer single.
A value the contract refuses is dropped, the site's own default is used, and one
`console.warn` on the channel this block already uses for "you declared it, the
renderer dropped it" names the member and the value. The warning is conditional:
an absent key and a usable page size both stay silent.

Refusing `0` is not this renderer choosing a meaning. `@objectstack/spec`
declares the pagination member a positive integer and its own suite pins the
refusal under the names `should reject zero pageSize` and `should reject
negative pageSize`; the `limit` this block's data-source mapping lowers
`pagination.pageSize` into is declared positive as well. Negative and
non-integer values are refused on the same rule — those are the ones the old
`||` spelling passed straight through at the flat site, since they are truthy.

The three fallback literals are now named constants, so the divergence between
them (a page of rows, a page of groups, a fetch window) is declared rather than
incidental. Whether the flat and server-window defaults should be the same
number is **not** decided here: the same grid with no authored `pagination`
shows one of them while it fetches its own rows and the other when it does not,
which is a visible inconsistency, and changing either literal changes what every
undeclared grid renders. That question is handed back on the issue.
