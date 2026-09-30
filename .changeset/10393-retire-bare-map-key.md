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
  longer contains bare `map`, so the check now reports `map` as an unknown
  schema type in a file it recognises. ⚠️ `view:map` stays on
  that list, because the opt-in protocol placeholder (`registerPlaceholders()`
  in `@object-ui/components`) registers it — in the console a `view:map` node
  renders that placeholder panel, not a map, and `objectui check` does not report
  it as an unknown schema type in a file it recognises. A bare
  `{ "type": "view:map" }` with no structural key is listed in `check`'s advisory
  did-not-validate list instead, because `view:map` is on the known-type list and
  `AnyComponentSchema` has no arm for it; that line does not say the node renders
  a placeholder. Search documents for `view:map` directly.

⚠️ **Dated note, 2026-09-25 — `objectui check` flags `map` only in a file it
recognises — objectui#10606.** This entry first said, unscoped, that the check now
flags bare `map`. `check` checks the `type` of each file it recognises, and a file
whose root carries an ObjectUI structural key (`children`, `className`, `body`, …)
is recognised by that key alone. A file with none of those keys is parsed against
the schema and recognised only if it validates; one that does not validate is
listed by name when its root `type` is on that known-type list, and is otherwise
counted as skipped. `map` is no longer on it, so `{ "type": "map" }` is
counted as skipped ("no ObjectUI recogniser admitted") and gets no unknown-type
line, while `{ "type": "map", "className": "h-64" }` gets one. `check` exits
non-zero on unreadable JSON only; the verdict is `objectui validate`'s: it refuses
`{ "type": "map" }` at `type` (`invalid_union`) and exits non-zero.

The `@object-ui/plugin-map` README now describes one registered type, and its
sentence claiming a bare array under `data` reaches the in-memory adapter is
corrected: a bare array under `data` is not a record source on the map
(objectui#8348), so inline rows belong under `staticData`. The same false claim
is corrected on the two docs pages that carried it, `plugins/plugin-map.mdx`
and `fields/location.mdx`.

**One pending entry in this same release is superseded in part.** The
objectui#10392 / #10394 entry (`10392-registration-record-source-inputs.md`)
says `object-map`, `map` and `object-gantt` gained `data` / `staticData`
inputs. It now reads as of its own change and carries a dated note naming this
card: `map` declares nothing after this retirement, while `object-map` and
`object-gantt` keep both inputs.
