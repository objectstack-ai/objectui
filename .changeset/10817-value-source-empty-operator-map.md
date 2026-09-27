---
'@object-ui/core': patch
---

`ValueDataSource.find` now refuses an object `$filter` that carries an EMPTY operator
map — `{ created: {} }`, alone, beside other keys, or inside a `$and` / `$or` member —
instead of silently dropping that field's constraint (objectui#10817).

**Before.** The object-dialect matcher read `{ created: {} }` as an operator map with
zero operators, so the field added no constraint. `{ status: 'a', created: {} }`
answered the same rows as `{ status: 'a' }`, and `{ created: {} }` answered every row,
with no console line. The ObjectStack path refuses the same filter: `@objectstack/spec`
ruled `{ field: {} }` REJECTED wherever it appears (objectstack#5240, recorded on
`FilterConditionSchema`), and `convertFiltersToAST` refuses it alone (objectui#9164) and
beside a key that lowers (objectui#10788).

**After.** Before any row is matched, the object arm walks the filter's field entries
and the members of `$and` / `$or`. A field whose condition is an object with no own
keys is handed to `toFilterNodeSafely` on its own, so the converter alone decides what
an empty operator map is, in its own wording. If the converter refuses it, the whole
filter answers no rows (`data: []`, `total: 0`) and the converter's reason is logged
once — the envelope the array arm already uses for a rule its lowering refuses
(objectui#10767). `find` still never rejects. `{ $or: [{ status: 'b' }, { status: 'a',
created: {} }] }` answers no rows, not the `'b'` rows.

**Also refused, by the same routing.** Any other object with no own keys that is not a
plain object or a `Date` — a `RegExp`, `Map`, `Set`, `URL` or a class instance with no
own fields — has no own keys either. The converter refuses it as an exotic comparand
(objectui#8567), so this face now refuses it too, with the converter's wording, instead
of dropping the constraint: `{ status: 'a', created: /x/ }` used to answer the same rows as `{ status: 'a' }`.

**Unchanged.** `{ status: 'a' }`, a real operator beside the key, the `{}` whole filter
and a `null` condition answer as before. A `Date` comparand is not refused: the
converter lowers it, so it reaches the matcher exactly as before, where its constraint
still vanishes (objectui#10829). Every other refusal
on this face — an operator the matcher does not implement, an array comparand, `$not` —
is still excluded per node with its own sentence; when the same filter also carries a
condition the walk refuses, only that refusal is logged — `{ status: ['a'], created: {} }`
logs `created`'s refusal, where the converter names `status`.

**Clause-②: no** — the value face now refuses, in its own exclude-and-log envelope, a
shape objectstack#5240 ruled refused, and comparands the spec's
`ACCEPTED_FILTER_COMPARAND_TYPES` rules out (objectui#8567); on this face both only
ever dropped a constraint. No declared surface moves and no export is added.

**Migration.** A filter carrying `{ field: {} }` returned more rows than it said. It is
now a named refusal. Give the field an operator, or delete the key.

⚠️ **Dated note, 2026-09-27 — a `Date` condition now matches the rows holding that instant — objectui#10829.** Later in this same release a `Date` condition in an object `$filter` is read as implicit equality, and two `Date`s compare their instant in both arms, so `{ status: 'a', created: someDate }` answers the status-`'a'` rows whose `created` is a `Date` of that instant, the same rows as its lowered array, rather than the rows of `{ status: 'a' }`. "where its constraint still vanishes (objectui#10829)" above is this change's reading, not the release's. The rest of this entry is kept as the reading of this change; the objectui#10829 entry states what that input now answers.
