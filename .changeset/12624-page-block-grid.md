---
'@object-ui/components': minor
'@object-ui/app-shell': minor
---

App pages lay a region's blocks out on a 12-column grid, and the page description sits under its title (objectui#12624).

- **Block grid.** A page region's blocks used to stack one per row, so four metric tiles drew four full-width stripes. They now sit on a 12-column grid. A block's span comes from its kind, not from a key on the block: metric tiles (`element:number`, `statistic`, `object-metric` and the dashboard metric widgets) span 3, charts (`chart`, `object-chart`, `bar-chart`) span 6, and every other block spans 12. From 1280px up the spans apply as named; from 768px to 1279px tiles span 6 and charts 12; under 768px every block spans 12. So four tiles share one row at 1280px and take two rows at 1024px. A `sidebar` or `aside` region beside `main` keeps its blocks full width. On the `dashboard` template each region is still a cell of the region grid and lays its own blocks out the same way.
- **Container grid.** A `page:card` or `page:section` lays its list of children on the same grid. The container is one block of its region and spans 12. Its children take their kind's span and fold the same way, so a card holding four `object-metric` tiles (a Sales Home KPI card) shows them in one row at 1280px and two rows at 1024px. Children that are not tiles still stack full width. Inside a rail region they stay full width too.
- **Description under the title.** When a titled `page:header` owns the page's heading, the page drew its `description` above the regions, so above the title. The header now draws it under the title and subtitle. The page still has one `h1`.
- **Studio page designer.** Each block card in a region, and each child card of a `page:card` or `page:section`, shows the span the page gives it, read-only (`3/12`, `6/12`, `12/12`).

Nothing an author writes is added: there is no `span` key, and `@objectstack/spec` declares none. `@object-ui/components` adds `pageBlockSpan`, `isPageRailRegion`, `PAGE_BLOCK_SPANS` and the `PageBlockSpan` type to its entry, so the designer reads the renderer's table instead of a copy. The designer's new string lives in its own string tables (en and zh).
