---
"@object-ui/plugin-charts": patch
"@object-ui/i18n": patch
---

charts: a sankey now names every node and colours its flows, and a funnel labels every stage. Sankey nodes were bare bars with no text and every link was one grey, so the chart could not be read without hovering. Each node now carries its name (to its right, or to its left in the last column so it stays on the chart), and each link is stroked in the palette colour of the category it flows into. Every link leaves the same root node, so colouring by source would paint them all one colour again. A funnel labelled each stage to the right of its segment, past the plot's edge, so only the narrowest stage's label showed. Labels now sit centred inside their segments, in foreground text with a background halo so a name wider than the narrowest segment stays legible. The sankey's "Showing N of M rows" footnote now comes from the locale packs under the new count family `chart.sankeyOmittedRows`, translated in all ten packs. The English text is unchanged (objectui#13404).
