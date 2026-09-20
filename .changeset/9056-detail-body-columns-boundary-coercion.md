---
'@object-ui/plugin-detail': patch
---

fix(plugin-detail): coerce `record:details`' authored body width at the boundary

`@objectstack/spec` declares `RecordDetailsProps.columns` as a string enum,
while `DetailViewSchema.columns`, `DetailViewSection.columns`,
`applyDetailAutoLayout`'s `columns` parameter and the `DetailViewField.span`
written from it are all `number`. `RecordDetailsRenderer` passed the authored
value straight through, so those declared-`number` slots carried the string at
runtime — invisible to `tsc` because the synthesized node is annotated `any`.

The renderer now translates the contract's spelling into the internal node's
spelling at the one place they meet. No rendered class, grid width or
responsive behaviour changes: the output is byte-identical across every
authored width. The published `@object-ui/types` declarations are untouched —
neither the protocol nor the internal type is widened to meet the other.
