---
'@object-ui/plugin-map': minor
'@object-ui/core': patch
'@object-ui/cli': patch
'@object-ui/console': patch
---

**BREAKING (node type key):** `@object-ui/plugin-map` no longer registers the bare
`map` node type key, and its namespaced twin `view:map` goes with it. A node
authored `"type": "map"` no longer resolves a renderer. Write
`"type": "object-map"` — the one spelling the plugin serves (objectui#10393,
executing the objectui#8008 family ruling of 2026-09-09 that retired the bare
`gantt` and `kanban` keys).

**Why.** The registry mounted a `map` node while the published declaration refused
it: `ObjectMapSchema.type` is the literal `'object-map'` and `AnyComponentSchema`
has no `map` arm, so `safeValidateSchema` answered a `map` node with
`invalid_union` while the html tier accepted it. Two faces, opposite verdicts.
No schema face ever declared `map` as a component node type, so there is no arm
to turn into a named refusal: unregistering is the whole retirement, exactly as
it was for `gantt`. After it, the html tier (`validateTree` over the live
registry) reports a `map` node as `unknown-component`, matching the Zod face.

**⛔ No stored document moves.** The string `map` names two different things at
two different layers, and only one of them is retiring:

| layer | value | who writes it | retired? |
| --- | --- | --- | --- |
| stored `NamedListView.type` / `defaultViewType` | `"map"` | `CreateViewDialog`, persisted per tenant | **no — untouched** |
| node type key | `map`, `view:map` | hand-authored JSON | **yes** |

`ObjectView` and `ListView` map a stored `map` view onto the node type they
render, and both already emit `object-map`, so every map view created through
the console keeps rendering. Nothing in a tenant database changes, and ⛔ nothing
should be migrated there.

**What moved with it.**

- `@object-ui/console` drops its lazy `map` / `view:map` registration stub; the
  lazy `object-map` stub is unchanged.
- `@object-ui/core`: `recordSourceDataArmForType` no longer lists the `map` and
  `view:map` rows, since no block is registered under either key.
- `@object-ui/cli`: the generated known-type list that `objectui check` reads no
  longer contains bare `map`, so the check now flags it. ⚠️ `view:map` stays on
  that list, because the opt-in protocol placeholder (`registerPlaceholders()`
  in `@object-ui/components`) registers it — in the console a `view:map` node
  renders that placeholder panel, not a map, and `objectui check` does not flag
  it. Search documents for `view:map` directly.

The `@object-ui/plugin-map` README now describes one registered type, and its
sentence claiming a bare array under `data` reaches the in-memory adapter is
corrected: a bare array under `data` is not a record source on the map
(objectui#8348), so inline rows belong under `staticData`.
