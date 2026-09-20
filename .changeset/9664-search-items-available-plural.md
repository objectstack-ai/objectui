---
'@object-ui/i18n': patch
'@object-ui/app-shell': patch
---

Full-page search now agrees with its own number while browsing: at exactly one
searchable item the header reads `1 item available`, not `1 items available`
(objectui#9664).

The header is one ternary with two branches. The query branch already chose its
key on `totalCount === 1` — `search.resultsCount` against
`search.resultsCountPlural`. The browse branch beside it asked for
`search.itemsAvailable` at every count, and that key had neither a plural family
nor a sibling to fall to, so `en` shipped the disagreement in the default
language; `de`, `es`, `fr` and `pt` read the same way (`1 Elemente verfügbar`,
`1 elementos disponibles`, `1 éléments disponibles`, `1 itens disponíveis`).

`search.itemsAvailableOne` is the singular half, added to all ten packs, and the
browse branch now picks between the two on `allItems.length === 1`. That is this
repo's two-key plural convention — the one `common.itemCount`/`itemCountOne` and
`detail.reactionCount`/`reactionCountOne` already use — and deliberately not an
i18next `_one`/`_other` family: full key parity across ten packs caps a family at
base plus `_one` plus `_other`, so every CLDR category a pack does not spell out
falls through to the base key, which on this key is the plural. Russian meets
that at 2 to 4 and Arabic at 2, 3 to 10 and 11 to 99. Choosing the key in the
component keeps `Intl.PluralRules` and `fallbackLng` out of the path: both halves
exist in every pack, so no count in any language can reach English.

`zh`, `ja` and `ko` carry the same string in both halves because the counter word
holds the number and there is no separate singular form; `ru` does too, because
its phrasing states no noun to agree with.

One translation changed rather than being added: `ar` wrote both numbers into one
string as a parenthesised marker. Its key can no longer be reached at one item, so
the singular half of that marker was dead weight while the parentheses still
rendered at every count the key does serve. It now uses the same noun pair that
`ar`'s `common.itemCount`/`itemCountOne` already uses.
