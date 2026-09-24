---
'@object-ui/plugin-charts': patch
---

fix(plugin-charts): the legend swatch carries its series colour as a custom property

`ChartLegendContent` painted each swatch with an inline `backgroundColor`, the
colour-bearing property AGENTS.md's styling carve-out names as forbidden. The
swatch now publishes the author-declared colour as `--color-bg` and a static
`bg-(--color-bg)` utility consumes it, the same shape the tooltip indicator in
the same file already uses, so the theme keeps control of the rule. The
rendered colour is unchanged.
