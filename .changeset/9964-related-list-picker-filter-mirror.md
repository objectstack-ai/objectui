---
'@object-ui/types': minor
'@object-ui/plugin-detail': patch
---

`record:related_list` `add.picker.filter` is declared as the contract's rule array on
the authoring face, not as `unknown` (objectui#9964).

`RecordRelatedListComponentProps.add.picker.filter` mirrored
`@objectstack/spec`'s `RecordRelatedListProps.add.picker.filter` — declared there as
`z.array(ViewFilterRuleSchema).optional()`, "Restrict which records the picker
offers" — as `unknown`. The only consumer of that key has typed it `ViewFilterRule[]`
on purpose since objectui#3831: `RelatedList` hands the value to
`RecordPickerDialog`'s `baseFilter` verbatim, and its own comment states why the
tighter type is deliberate ("a looser type here is where a wrong shape would hide").

So one key carried two declarations, with the looser one on the face an author — or
an AI writing metadata — reads: `unknown` offers no shape guidance for a key whose
consumer demands a specific shape. Nothing could report the divergence either,
because `record-related-list.tsx` reached the block through four `(schema as any).add`
reads; a cast unwraps the declaration at its own read site, so no compiler ever
compared the two.

**The mirror moved, and the consumer's guard stayed.** `@objectstack/spec` declares
the array form, so the component agrees with the protocol and the mirror was the side
that disagreed — the contract-first direction this repo's #0.1 requires. Tightening
here narrows nothing an author could publish: the protocol's `strictObject` refuses
every other shape at parse today, so this is a narrowing being undone rather than an
authoring surface being narrowed. A TypeScript consumer that annotated a variable with
this interface and assigned a non-array filter to it now fails to compile — the
publish call it was heading for would have failed anyway.

All four `(schema as any).add` reads are gone with it, so the declaration reaches the
renderer: a wrong-shaped picker filter is now refused where it is written rather than
carried to the dialog. The change is inert at runtime — `unknown` and
`ViewFilterRule[]` are the same zero bytes — which is why the pin for it compiles
snippets and reads diagnostics instead of rendering anything, and why the guard that
kept the old cast ledgered is what went red when the cast was removed.
