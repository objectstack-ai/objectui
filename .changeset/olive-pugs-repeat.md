---
'@object-ui/plugin-detail': minor
---

fix(plugin-detail): `record:related_list` redaction now reaches the auto-derived columns

Redacting **every** authored column used to switch redaction off. The block
filtered its authored `columns` against `redactFields`, handed `RelatedList` the
empty result, and `RelatedList` read an empty array as "no columns were
authored" — falling through to auto-derivation, which the block's redaction list
never reached. The redacted field came back, and the fallback could surface
fields the author never listed at all.

`RelatedList` now takes the list as a `redactFields` prop and applies it on every
path that decides columns — the authored array, the `highlightFields` prominence
set and the heuristic field walk — so one policy filters all three. An authored
array emptied by redaction falls through to the derived set exactly as it already
did, and that set is now filtered too.

Field-level security is unchanged: it was, and remains, enforced independently on
every path.
