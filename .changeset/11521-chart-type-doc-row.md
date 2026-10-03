---
---

Docs and a test only, no package released. The `chartType` row of the `ChartSchema` table in
`content/docs/api/schema-reference.md` taught `"heatmap"`, which the `chart` node refuses at
`chartType` on both faces, and left out the declared families beyond its seven. The row now lists the
`@objectstack/spec` `ChartType` set. A new pin in `@object-ui/types` reads that set off
`ChartSchema.chartType`'s zod enum at test time and holds the row equal to it, so the row follows the
installed spec (objectui#11521).
