---
'@object-ui/react': minor
---

`SchemaRenderer` now applies the objectui#9571 authored-`data` strip to the legacy
`props` alias bag as well, so all three authoring spellings of that key lose the React
prop seat on the object arm (objectui#9758, decision batch #167 item 2, letter 剥,
maintainer 「其他同意」).

**The carrier this closes.** objectui#9571 removed an authored `data` from
`componentProps` — the node's own non-metadata keys — for blocks whose published `data`
row is the `ViewData` OBJECT arm. But `createElement` spreads the legacy `props` alias
bag AFTER that strip, so an author who spelled the identical key
`props: { data: [ …rows… ] }` kept the seat the ruling had just taken away, and
`ObjectGrid` (`passedData`), `ObjectMap` (`dataProp`) and `ObjectGantt` still lifted it
with an unconditional `Array.isArray` ahead of the shared ladder. The arm predicate was
right; the corpus was one bag short. AGENTS.md #0.1: one key, one honoured spelling.

Both bags now go through one helper with ONE arm reading, so the question is asked once
instead of at two call sites that can drift apart.

**Unchanged, and refused on purpose.** The `data` PROP itself — `SchemaRenderer`'s own
React props are spread LAST and still win, which is how `plugin-list`'s `ListView` and
`ObjectView` hand down rows they already fetched. Nothing else the alias carries moves:
every other key under `props` is spread exactly as before, the objectui#5123 precedence
between `props` and `properties` is untouched, a degenerate non-object `props` still
contributes no keys, and blocks on the array arm or on no declared arm keep their
authored `data` prop verbatim. There is no validator refusal here: whether the `props`
alias exists at all is objectui#4795's pending question ②, which is the maintainer's.

**Diagnostics.** The development warning objectui#9571 added now fires for the alias
carrier too, once per node, naming the key, the arm and the spelling that works. Its
objectui#6708 neighbour — the notice that a `props` bag was not read — stops naming
`data` on this arm, because after this change both of its sentences are false for that
key: it is no longer spread as a React prop, and the remedy it recommends
(`properties: { data }`) loses the seat as well. It still names every other key the
alias drops on the same node. The objectui#4795 unevaluated-expression scan is
deliberately unchanged and still reports an authored `props: { data: '${…}' }`, because
that value is still in front of a user.

**Migration.** Author inline rows the declared way —
`data: { provider: 'value', items: [...] }` — or keep the deprecated `staticData: [...]`
array, which is unchanged. Both were already the only spellings `os validate` and the
save gate accepted.
