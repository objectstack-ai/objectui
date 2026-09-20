---
'@object-ui/types': minor
---

`ObjectGallerySchema.filter` is typed as the destination its own docblock names
— `QueryParams['$filter']` — on both faces, the TS interface in `objectql.ts`
and the zod mirror in `zod/objectql.zod.ts` (objectui#9309).

It was `filter?: unknown` under the docblock "Query filter, forwarded verbatim
as `$filter`", and `$filter` is `Record<string, any> | FilterArray`
(`QueryParams`, `data.ts`). The declaration therefore named a destination it did
not type: an author told to forward the value verbatim got a type error on the
key the sentence had just told them to forward, and the way through was `as` —
which un-checks the destination's real type at that call site too. The
declaration is now an INDEXED ACCESS on `QueryParams`, not a copy of its arms,
so the two cannot drift.

Accept-set change on the published surface, stated plainly:

- NARROWS, both faces. `unknown` is the widest type there is, so every value the
  new declaration refuses used to compile: `filter: 'stage=won'` and
  `filter: 42` are type errors now, and the mirror refuses them at parse time
  instead of waving them through. Breaking for any TypeScript consumer that
  assigned a non-object value to this key.
- The two object arms are unchanged and both still compile: the ObjectQL
  field-keyed record (`{ age: { $gt: 18 } }`) and the spec's `FilterArray`
  sugar (`[['status', '=', 'active']]`).
- No runtime behaviour changes. The value still travels to `$filter`
  byte-for-byte; `plugin-list`'s `ObjectGallery` is the one consumer and its
  forward is unchanged.

The mirror moved in the same change for a measured reason: `zod-mirror-parity`'s
`Unconstrained< T >` excludes an `unknown` mirror slot from its
`WiderThanDeclared` comparison by definition, so a narrowed TS face beside a
`z.unknown()` mirror is a split that nothing in the suite would have reported.
