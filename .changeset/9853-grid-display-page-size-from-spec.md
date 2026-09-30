---
'@object-ui/plugin-grid': minor
'@object-ui/plugin-list': minor
'@object-ui/plugin-kanban': minor
---

A page size with nothing declared is now the one `@objectstack/spec` declares for
`pagination.pageSize`, on every surface that has a pager; a fetch that has no
pager keeps its own fetch batch, which does not follow it (objectui#9853).

"Page size" now means one page, and only where there is a pager. The grid,
the list and the board read the display default from the spec (`PaginationConfigSchema`)
instead of keeping numbers of their own, so it is declared once, in the protocol.
`@objectstack/spec` 17.5.0 declares **50**. The views that fetch one window and
page nothing keep a fetch batch of their own, with the value they had, so no
view loses records it could reach before.

⚠️ **Visible change where no page size is declared.** Measured on the renderer
with `@objectstack/spec` 17.5.0. Declare `pagination: { pageSize: N }` (or, on a
board, `limit`) to keep an old count:

| surface (nothing declared) | before | after |
|:--|--:|--:|
| `object-grid` that fetches its own rows: rows per page, and the `$top` of each page fetch | 50 | 50 (unchanged) |
| `object-grid` over inline `data`: rows per page | 10 | **50** |
| grouped `object-grid`: groups per page | 10 | **50** |
| grouped `object-grid` over a data source that groups on the server: rows per group page (`$top`) | 50 | 50 (unchanged) |
| `list-view`, grid view (paged on the server): rows per page, and `$top` | 100 | **50** |
| `list-view`, every view it does not page (kanban, calendar, gallery, timeline and the rest, and a grouped grid): the one fetch's `$top` | 100 | 100 (unchanged) |
| `object-kanban` with no `limit`: the board's `$top` | 100 | 100 (unchanged) |

What changed underneath:

- **`@object-ui/plugin-grid`.** `ObjectGrid` falls back to the spec's display
  default on every page it shows, with no local number behind it: if a future
  spec stops declaring the default, the module throws at load instead of
  inventing one. The old "server window" constant is renamed
  `DEFAULT_FETCH_BATCH_SIZE` and keeps its value. Since grouping moved to the
  server, it is read only when the grid groups a window of rows in the browser
  because the server does not group it (a grouping key the principal may not
  read), and never as a page size. The grouped view's rows-per-page selector
  also lists the size in force when it is not one of its fixed steps.
- **`@object-ui/plugin-list`.** `ListView` splits its undeclared fallback by
  whether the view pages. The grid view, which it pages on the server, falls
  back to the spec's display default. Every other view falls back to a fetch
  batch of 100, the value it had. A declared `pagination.pageSize` sizes the
  window on every view, as before. With no declared size, switching between the
  grid view and an unpaged view now changes the window, so the list fetches
  again: one request, whose `$top` is the fetch batch. That qualifies the
  objectui#10512 note in this same release, which says a switch into a dataset
  chart with no user filter set issues no new request: it still holds when a
  page size is declared. A refused page size still warns, and the warning names
  the fallback that view actually used.
- **`@object-ui/plugin-kanban`.** The board's default `limit` is renamed from
  `DEFAULT_KANBAN_LIMIT` to `DEFAULT_KANBAN_FETCH_BATCH_SIZE` and stays 100. Its
  diagnostic for a refused `limit` now calls it the board's fetch batch.

The display default follows the `@objectstack/spec` a host installs. A host
that resolves an older spec gets that spec's default, on every surface alike.

Released as `minor`, not `major`: this repository keeps its major aligned with
`@objectstack/spec`, so the behaviour change is spelled out here instead.
