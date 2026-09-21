---
'@object-ui/react': patch
---

fix(react): the refused-`data` dev warning can be reset between tests

The dedupe `Set` behind the objectui#9571 / objectui#9758 diagnostic — "the
authored `data` key was NOT passed to the component as a React prop" — lived in
`SchemaRenderer.tsx` with nothing able to clear it, while every other dev
diagnostic in this package's `utils/` directory pairs its `Set` with an exported
test-only reset. `propsBagDiagnostic.ts` states the consequence in its own
reset's docblock: the second test to assert the same warning reads the first
test's dedupe entry and sees silence, "a green run that checked nothing". The
absence direction is the dangerous one — a test asserting this warning did NOT
fire for a `type#id` an earlier test already warned for is green whatever the
renderer does, and it reports that green as coverage.

The `Set`, the emit and a new `__resetRefusedDataPropWarnings` now live in
`utils/refusedDataPropDiagnostic.ts`, beside the siblings whose idiom they
follow. `index.ts` re-exports `SchemaRenderer.js` with a star, so a reset
exported from where the `Set` used to sit would have become a member of this
package's published entry for the sake of a test affordance; the entry is
unchanged by this change, and so are the warning's text, its dedupe key and both
`__DEV__`-gated call sites.

The pin renders one `type#id` across three `it()` blocks — the warning fires,
fires again in the next block, then draws silence for host-supplied rows beside
a control that proves the channel could still speak. Ablating the reset's body
turns the last two red; the absence assertion alone stays green under it, which
is the defect it exists to refuse.
