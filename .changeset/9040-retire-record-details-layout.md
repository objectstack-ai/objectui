---
'@object-ui/types': minor
---

**BREAKING** — `RecordDetailsComponentProps` no longer declares `layout` (objectui#9040 item 1).

**FROM** `layout: 'stacked' | 'inline' | 'compact'` **TO** *nothing* — the key is
removed, and there is no replacement key.

```ts
// before
const props: RecordDetailsComponentProps = { columns: '2', layout: 'stacked', sections: [...] };
// after
const props: RecordDetailsComponentProps = { columns: '2', sections: [...] };
```

**Nothing that worked stops working.** `@objectstack/spec` retired this key in
17.0.0 (objectstack#6946, ADR-0087 D2) because its published `auto` | `custom`
semantics were never implemented, and it refuses the key BY NAME — the tombstone
is still a declared member, so an author gets `invalid_type` at `layout`
carrying the removal prescription, not a bare `unrecognized_keys`. This face
offered a THIRD spelling on top of that, `stacked` | `inline` | `compact`, so no
value it ever accepted could reach a published document. `tsc` said yes; the
platform rejected the document whole. This change is what makes `tsc` say so.

Re-measured on this branch against the installed pin (17.4.0) rather than
inherited from the card, with controls in the same pass so the instrument is not
blind:

```
{ layout: 'stacked' } | { layout: 'inline' } | { layout: 'compact' }   RED  invalid_type at `layout`
{ layout: 'auto' }    | { layout: 'custom' }                          RED  invalid_type at `layout`
        …all five carrying "was removed in @objectstack/spec 17.0.0 (ADR-0087 D2)"
{ columns: '2' } · { fields: [...] } · { hideFields: [...] }           GREEN   <- CONTROL
{ inlineEdit: true } · { showHeader: true }                           GREEN   <- CONTROL
{ layoutt: 'compact' }                                                RED  unrecognized_keys   <- CONTROL
```

Live keys parse green, so the schema is not refusing everything; a near-miss
typo of the same key gets the OTHER code, so `layout` is refused by name rather
than swept up as an unknown.

**What replaces it: what you author.** `sections` renders the explicit groups;
omitting it falls back to the object's `highlightFields`. That was already the
only thing choosing the body — `RecordDetailsRenderer`'s dead `layout` branch
went in objectui#3818, and `@object-ui/plugin-detail`'s registry manifest
deliberately publishes no `layout` input. This declaration was the last live
holdout of the spelling.

**Migration, in this repository: three consumers, and no two instruments see the
same ones.** No authored document had to change — a region census over every
`record:details` occurrence in every tracked file scores an authored `layout`
**0**, against `columns` **21**, `sections` **44** and `fields` **49** in the
same pass over the same regions, so the instrument was not blind. What did have
to change was three pins in `@object-ui/types`:

- `packages/types/src/__tests__/p1-spec-alignment.test.ts` wrote
  `layout: 'stacked'` on this interface and read it back. Both lines are gone,
  with the reason stated at the site and a live-key read-back put in their
  place so the leg is not quietly shrunk. Its `RecordHighlightsComponentProps`
  neighbour keeps its own `layout` — a different key on a different face.
- `packages/types/src/__tests__/record-details-top-level-9040.test.ts` ledgered
  the divergence as OPEN. Those legs become the retirement's own: a `keyof`
  absence assertion (with a declared key read through the identical form as its
  control), a `@ts-expect-error` literal, and a new source-text leg.
- `packages/types/src/__tests__/record-highlights-layout-9187.test.ts` read this
  declaration as TEXT, using its three-value `layout` as the lit control for a
  two-member assertion about the sibling. That control MOVED to
  `RecordChatterComponentProps.position` — a three-value union the contract
  genuinely declares — as that file's own instruction required. It was never to
  be deleted outright, and it is not.

⚠️ **`tsc` names only the first two.** The third is a source-text read, which no
type checker can see, and vitest is blind to the first two because it strips
types. A survey that stopped at the type checker would have shipped a red test
file. That reading is recorded in the retirement pin rather than here, so it is
re-derived rather than remembered.

⚠️ The census behind this removal covers this repository only. A TypeScript
consumer of `@object-ui/types` outside it that wrote `layout` is not observable
from here, and gets a compile error (TS2353) naming the key — which is why the
FROM/TO is spelled out above. Such a consumer was already having its documents
refused at publish.

⚠️ `layout` on `RecordHighlightsComponentProps` one interface down is a
**different key on a different face** and is **unaffected**: `@objectstack/spec`
declares `RecordHighlightsProps.layout` as `z.enum(['horizontal','vertical'])`,
and objectui#9187 pins those two values. Two keys sharing a word in one file are
not the same key. `sections[].defaultCollapsed` and the body-wide `columns` are
likewise untouched.
