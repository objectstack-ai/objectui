---
'@object-ui/types': minor
'@object-ui/plugin-detail': minor
---

Retire `icon` from the `record:highlights` `fields[]` entry, across all three layers that
carried it (objectui#9280).

**Breaking, deliberately.** `{ name: 'amount', icon: 'dollar-sign' }` on a
`record:highlights` entry no longer type-checks. Nothing that worked stops working: the key
was never authorable in the first place, and this change is what makes `tsc` say so.

`@objectstack/spec` `RecordHighlightsProps.fields[]`'s object arm declares exactly
`name`/`label`/`type`/`readonly` behind a `never` catchall — it is `$strict`, so an unlisted
key is REFUSED, not stripped, and the refusal takes the WHOLE document with it. Re-measured
on this branch against the installed pin (17.4.0) rather than inherited from the card, with
three controls in the same pass so the instrument is not blind:

```
fields[] object-arm keys : ["label","name","readonly","type"]   catchall: never ($strict)
{ fields: [{ name:'x', label:'L' }] }      GREEN                          <- CONTROL
{ fields: [{ name:'x', icon:'star' }] }    RED  invalid_union at fields.0
{ fields: [{ name:'x', zzzNonsense:1 }] }  RED  invalid_union at fields.0  <- CONTROL
{ fields: ['x'] }                          GREEN                          <- CONTROL
```

A declared key parses green, so the arm is not refusing everything; an arbitrary key is
refused with the SAME code as `icon`, so `icon` was not special-cased; the bare-string arm is
untouched, so only the object arm moved.

FROM → TO, per layer:

- `packages/types/src/record-components.ts` — `RecordHighlightsComponentProps.fields[]`'s
  object arm: `{ name; label?; icon?; type?; readonly? }` → **`{ name; label?; type?; readonly? }`**.
  The key is **removed, not tombstoned**: the contract's arm is `$strict`, so the refusal an
  author needs already exists upstream and arrives named (`invalid_union` at the entry). A
  `?: never` tombstone buys nothing here — it is the remedy for a non-strict mirror that
  would otherwise strip in silence, which is not this arm.
- `packages/plugin-detail/src/renderers/record-highlights.tsx` — the entry normalizer stops
  copying `icon: f?.icon` into the normalized entry. That read was **unreachable**, not
  merely unused: no author could feed it past the `$strict` arm, and `HeaderHighlight`
  renders no `.icon` on the far side either, so the copy had no consumer in either
  direction.
- `packages/plugin-detail/src/index.tsx` — the registry manifest's `fields` input description
  sketched the entry as `{name,label?,icon?,type?,readonly?}` → **`{name,label?,type?,readonly?}`**.
  The `inputs` ARE the published contract (`gen-manifest.ts` serializes them into
  `sdui.manifest.json` and `sdui-intrinsics.d.ts`), so leaving the sketch standing would have
  gone on teaching AI and human authors a key that gets the whole document refused at publish.

**Migration.** Nothing in this repository has to change. An in-repo census over every
`record:highlights` region (109 regions, all tracked files) scores an entry-level `icon`
**0**, against `readonly` **23** in the same pass over the same regions — the instrument was
not blind. If you author `icon` on a highlight entry in your own metadata, delete it: it was
already causing the publish to refuse the document whole. Whether a highlight chip *should*
be able to carry an icon is a separate question this change does not answer — the route for
that is an upstream `@objectstack/spec` widening, on its own card, ⛔ never a redeclaration
here.

⚠️ `sections[].icon` on `RecordDetailsComponentProps` is a **different key on a different
face** and is **unaffected**: the contract declares it and `DetailSection` genuinely draws
it. Two keys sharing a word in one file are not the same key.

Pinned in `packages/types/src/__tests__/record-highlights-fields-icon-9280.test.ts` across
three instruments that do not see the same thing — a `tsc` `@ts-expect-error` leg with a
`{name,label}` control that stays green, `safeParse` legs against the installed spec
artifact, and a source-text read whose lit control is that very `sections[].icon` member, so
an empty result on the highlights arm is a reading rather than a matcher that cannot match.
`packages/plugin-detail/src/__tests__/recordHighlightsInputs.spec-parity.test.ts` gains the
REVERSE direction it was missing: it already failed when a spec entry key went undocumented,
and now also fails when the description advertises an entry key the spec refuses.
