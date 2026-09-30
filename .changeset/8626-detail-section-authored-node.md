---
'@object-ui/plugin-detail': patch
---

An authored `detail-section` node now renders. It used to draw an error banner.

The registration declares eight FLAT inputs — `title`, `description`, `fields`,
`collapsible`, `defaultCollapsed`, `columns`, `showBorder`, `headerColor` —
while `DetailSection` declares a single `section` OBJECT prop and reads
`section.*` only. `SchemaRenderer` spreads a node's non-metadata keys as React
props, so an authored node arrived as `title` / `fields` / … and `section`
arrived `undefined`.

Not merely inert. `DetailSection`'s first statement is
`React.useState(section.defaultCollapsed ?? false)`, so the render THREW and
`SchemaErrorBoundary` put its orange banner on the page in place of the block —
measured end to end through the real `SchemaRenderer` and the real registry:

```
Component "detail-section" failed to render
Cannot read properties of undefined (reading 'defaultCollapsed')
```

The tag is now registered against a seam adapter that folds those eight
declared inputs into the `section` object the component reads — the same shape
of repair this package already uses for `field:permission-facet-link`
(`withFieldCarrier`, objectui#3307).

**The authoring surface did not move, deliberately.** The other available
repair — re-declaring the eight as a nested `section` input — would have
changed what authors may write, and the flat shape is both published and
authored: a manifest built the way `PageRenderer` builds the JSX-page
compiler's gives the flat eight ZERO diagnostics and REFUSES `section`
(`unknown-prop`, plus `missing-required-prop "fields"`), this package's README
documents a flat `detail-section` node inside `tabs[].content`, and
objectui#6955's landed pin asserts that same flat surface. Folding at the seam
invalidates none of them.

`DetailSection` itself is byte-identical: every in-repo caller passes
`section={…}` as a direct JSX child and is untouched.

Superseded in this release by objectui#9529 and objectui#10485: the
registration now declares ten flat inputs, not eight — the eight above plus
`icon` (objectui#9529) and then `hideEmpty` (objectui#10485) — and the adapter
folds all ten. The count of eight above describes the tree this entry was
written against; the live list is `DETAIL_SECTION_NODE_INPUTS`, held against
the registration in both directions by the fold-parity row of
`detailSectionAuthoredNode-8626.test.tsx`.
