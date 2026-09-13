---
'@object-ui/fields': minor
'@object-ui/i18n': minor
---

A `lookup` reference that resolved to nothing now gets **one** answer instead of
two opposite ones (objectui#8695), carrying objectui#8434's ruling to the second
renderer that had the same defect.

`LookupCellRenderer` split a single epistemic state — *a reference this screen
did not resolve* — by the **shape of the string**. `isLikelyOpaqueId` sent
opaque-looking ids to a muted `—` and sent everything else to confident bare
text. Measured with `reference_to: 'sys_user'`, `'Ada Lovelace'` rendered
`<span class="block max-w-full truncate" title="Ada Lovelace">Ada Lovelace</span>`
— **byte-identical** to what a `text` cell prints for the same string — while
`'01HQZX9K2M4N6P8R'` rendered a muted `—`. So the name-shaped case stated a
confident fact the screen did not have (a dirty row read exactly like a clean
one), and the opaque case destroyed the raw id, which objectui#8434's triage
named as "the only clue for diagnosing existing dirty rows". Two opposite
failures, one state.

Both now render the affordance objectui#8434 settled on: the raw value kept
**visible**, beside a muted marker glyph and a stated sentence, keyed as
`detail.unresolvedLookupReference` in all ten locale packs. `master_detail` and
`tree` route through the same renderer and get the same answer, as does the
multi-value chip shape — including the `+N` overflow chip's `title`, which now
lists the values it hides instead of a row of dashes.

**The sentence is epistemic, not ontological, and it is a sibling of the `user`
one rather than the same key.** At least six causes reach this arm and the
renderer distinguishes none of them: never fetched, in flight, the resolver
threw, the resolver answered with no record, it answered with a record no
display field could name, and — for array entries after the first — never asked.
`useLookupName` returns `string | undefined`, dropping the `pending`/`err`/`ok`
discriminator its own cache holds. Several of those also cover a record the
viewer may simply not be allowed to read, and "cannot read" versus "does not
exist" is a boundary this renderer cannot see across. So it states only what is
true of all of them: this screen did not resolve it. The `user` pack value ends
"was not resolved to a user", which is false on a lookup pointing at any other
object, hence a separate key.

**Why `minor` and not `patch`.** The test this lane applies is whether EXISTING
STORED DATA renders differently, and here some of it is not broken data.
`LookupCellRenderer` auto-resolves only the FIRST primitive of an array
(`primaryPrimitiveId`, and `resolveLabel` returns a name only when
`val === primaryPrimitiveId`) — a documented cheapness policy, not a defect. So
on a multi-value `lookup` holding perfectly clean ids, entries 2..n were never
asked and now wear the unresolved marker where they previously printed a bare
id or a dash. That is a visible change to a working screen over correct data,
which is the line between the two levels; the name-shaped and opaque-shaped
single-value cases would each have been `patch` on their own, since both were
already wrong. `@object-ui/i18n` is `minor` for the ordinary reason: a key is
ADDED — `detail.unresolvedLookupReference`, across all ten packs (the `user`
sentence `detail.unresolvedReference` already shipped with objectui#8434).

**Nothing else moves.** A reference resolved by an expanded record, by the
author's `options`, or by the fetch-on-demand resolver renders exactly as before,
unmarked; an empty cell keeps `EmptyValue`; the affordance sits inside
`ReferencedRecordLink`, so an unresolved reference is still navigable
(objectui#4336). Display only — no query, sort, export or save path reads a cell
renderer's output. `isLikelyOpaqueId` stays exported (removing it would be a
breaking change) but no longer decides how anything is drawn.
