---
'@object-ui/plugin-view': minor
---

**`ObjectView` honours a spec-shaped named list view** (objectui#8254, the
renderer half objectui#7928's option A requires — decision batch #70,
2026-09-07 — before `ObjectViewSchema.listViews` is mirrored by reference onto
`ObjectListViewSchema`).

The protocol declares a named view's `columns` as `string[] | ListColumn[]`;
the local `NamedListView` declares only `string[]`. Two of the three routes out
of `ObjectView` end in a NAME slot — `ObjectGridSchema.fields`, and the `fields`
of the node `generateViewSchema` emits — whose consumers index each record by
every entry. The named-view segment reached both of them raw, so a named view
carrying the `ListColumn[]` half arrived as a non-empty field list naming
nothing: `ObjectKanban` skips its `highlightFields` fallback whenever that list
is non-empty, so the result rendered worse than an empty one. That is the same
boundary failure objectui#5269 answered for `table.columns`, and it is answered
the same way — `viewColumnFieldNames`, the presence-preserving twin of the fold
already applied to `table.columns`, using `columnIdentity`, this repo's single
converged reader for "which field does this column entry name".

The union slots on the same branches — `ObjectGridSchema.columns` and the
delegated `list-view` `columns` — keep taking the authored value raw, because
their declared shape holds it and narrowing there would drop a column's own
`label`. One value, two slots, each given the shape it declares.

**Behaviour that moves, spelled out.** A `string[]` named view is byte-identical
before and after. A named view whose `columns` entries resolve to no field
identity at all now reaches those two name slots as `[]` instead of as a
non-empty list of nameless entries — the fix, and the only visible change for
metadata that is not spec-shaped. Precedence does not move: an authored empty
`columns` still stops the `||` chain where it stopped before, deliberately
unlike the `table.columns` fold, whose fall-through to the deprecated
`table.fields` alias is a precedence decision belonging to that chain alone.

`filter` (spec rule objects, not the local tuple dialect), `sort`, `label` and
`data` needed no renderer change; they are pinned anyway, because "already
works" is the claim that rots without an instrument. The stale `as any` on the
named-view config's `label` read is gone with them — the protocol makes `label`
optional, and the read already degrades to the host's label without it.

**Conversion note for the mirror that follows.** `ObjectListViewSchema` is
strict and requires `columns`; the local dialect requires `label` and accepts
neither. When objectui#7928 lands the by-reference mirror, every authored named
view in this repo that omits `columns`, or writes the tuple filter dialect
(`[[field, op, value]]`) instead of rule objects, or carries a local-only key
(`options`, `showSearch`, `densityMode`, `color`, …) becomes an authoring
error rather than a silently-dropped key. The population was counted on
objectui#8254 across `apps/`, `examples/` and `content/` — a historical reading
taken on that card, not a live count and not re-derived here; re-run the census
described there before acting on it. The refusals concentrate in the
documentation examples, so the mirror needs a docs pass shipped with it.
