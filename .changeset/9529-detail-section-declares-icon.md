---
'@object-ui/plugin-detail': minor
---

An authored `detail-section` node now takes `icon`, and draws it.

`DetailSection` draws `section.icon` before the title in both of its header
branches, but the `detail-section` registration did not declare `icon` among
its `inputs`, and the node adapter folds only declared names into the section
it hands the component. So an author who wrote `icon` on the node was warned
`unknown-prop "icon"` by the JSX-page compiler's validator — which judges an
authored page against these same `inputs` — and the header drew no icon.

The registration now declares `{ name: 'icon', type: 'string' }` (a Lucide icon
name such as `map-pin`), and the adapter folds it like the other declared
inputs. A non-string `icon` now draws `type-mismatch` instead of `unknown-prop`.

**Clause-②: yes** — the authoring surface of `detail-section` widens by one
key, `icon`, which the renderer already honoured. No other key's verdict moves:
`name`, which the block neither declares nor reads, still draws `unknown-prop`.
No exported symbol is added, removed, renamed or retyped — the package entry
re-exports neither `DetailSectionNode` nor `DETAIL_SECTION_NODE_INPUTS`. The
tag is outside the public block tier, so the generated `sdui.manifest.json` and
`sdui-intrinsics.d.ts` never carried it and do not change.
