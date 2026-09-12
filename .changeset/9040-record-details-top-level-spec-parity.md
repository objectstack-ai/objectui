---
'@object-ui/types': minor
---

`RecordDetailsComponentProps` now declares the three top-level keys
`@objectstack/spec` declares and `RecordDetailsRenderer` honours: `hideFields`,
`inlineEdit` and `showHeader`.

```ts
// now compiles — and always parsed
const props: RecordDetailsComponentProps = {
  hideFields: ['name'],   // string[]  — omit fields already shown elsewhere
  inlineEdit: false,      // boolean   — force the inline-edit affordance off
  showHeader: true,       // boolean   — draw the detail body's own heading
};
```

A widening only: no key changes type and nothing is removed, so no authored
document that compiled before stops compiling.

Every other layer already declared these. `@objectstack/spec` accepts all three
(measured on the installed pin, 17.4.0, against a control — an undeclared key is
refused with `unrecognized_keys` on the same instrument); `RecordDetailsRenderer`
reads all three; and `@object-ui/plugin-detail`'s registry manifest publishes
all three as inputs (objectui#3808, objectui#4668). This published TypeScript
face was the one layer that refused them, so a spec-valid, renderer-honoured,
registry-published document got `TS2353` — the same reverse-direction defect
objectui#8583 fixed on `sections[]`, one level up.

⚠️ The retired `layout` on the same interface is NOT removed here. The contract
refuses it by name (ADR-0087 D2 tombstone, removed in `@objectstack/spec`
17.0.0), so it remains a published key `tsc` accepts and publish rejects.
Removing it is a retirement with its own obligations — it breaks an in-repo
consumer that triage scoped out of objectui#9040 — and it needs its own change
and its own FROM/TO changeset. The divergence is now signposted at the
declaration and pinned by `record-details-top-level-9040.test.ts` so it cannot
rot into a stale comment.
