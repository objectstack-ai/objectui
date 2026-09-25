---
'@object-ui/plugin-detail': minor
---

An authored `detail-section` node now takes `hideEmpty`, and it reaches the section.

`DetailSection` hides a section whose fields are all empty when
`section.hideEmpty` is `true`, but the `detail-section` registration did not
declare `hideEmpty` among its `inputs`, and the node adapter folds only declared
names into the section it hands the component. So an author who wrote
`hideEmpty` on the node was warned `unknown-prop "hideEmpty"` by the JSX-page
compiler's validator — which judges an authored page against these same
`inputs` — and an all-empty section still drew its heading and skeleton.

The registration now declares `{ name: 'hideEmpty', type: 'boolean' }`, and the
adapter folds it like the other declared inputs. On this node, `true` hides an
all-empty section (no heading, no skeleton); omitted or `false`, the section
keeps its heading and label skeleton — the behaviour an unauthored node already
had, now stated in the input's description rather than changed. A non-boolean
`hideEmpty` now draws `type-mismatch` instead of `unknown-prop`.

The omitted default is the node's own. `record:details` still resolves an
omitted `hideEmpty` to `true` on its own authored sections, which never pass
through this node; `detail-view` sections, like this node, apply no default.
What `true` and `false` mean is the same on all three.

**Clause-②: yes** — the authoring surface of `detail-section` widens by one
key, `hideEmpty`, which the renderer already honoured. No other key's verdict
moves: `name`, which the block neither declares nor reads, still draws
`unknown-prop`. No exported symbol is added, removed, renamed or retyped — the
package entry re-exports neither `DetailSectionNode` nor
`DETAIL_SECTION_NODE_INPUTS`. The tag is outside the public block tier, so the
generated `sdui.manifest.json` and `sdui-intrinsics.d.ts` never carried it and
do not change.
