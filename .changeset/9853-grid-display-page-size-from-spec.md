---
'@object-ui/plugin-grid': minor
---

`object-grid` with no declared `pageSize` now shows **25** rows (or groups) per
page — the default `@objectstack/spec` declares for `pagination.pageSize` — on
every page it renders (objectui#9853).

⚠️ **Visible change on grids that declare no page size.** Declare
`pagination: { pageSize: N }` to keep the old count:

| surface (no `pageSize` declared) | before | after |
|:--|--:|--:|
| grid that fetches its own rows (server-paged table), rows per page **and** the `$top` of each page fetch | 50 | 25 |
| grid over inline `data` (client-paged table), rows per page | 10 | 25 |
| grouped grid, groups per page | 10 | 25 |
| grouped grid, rows fetched to group (`$top`) | 50 | 50 (unchanged) |

The grid used to fall back to three local numbers, and one of them — named a
"server window" — sized both a fetch and the page the user sees. The display
default is now read from `@objectstack/spec` (`PaginationConfigSchema`), with no
local number behind it; the fetch batch is renamed `DEFAULT_FETCH_BATCH_SIZE`,
keeps its value, and is read only by the grouped view's fetch, never as a page
size. A declared `pageSize` is honoured exactly as before, and a refused one (zero,
negative, non-integer) still warns and falls back — now to 25.

Inside a `ListView`, the server-paged flat grid still takes its page size from the
list and does not change here. The list hands no page size to a grouped grid,
though, so a grouped list with no declared `pageSize` also moves from 10 to 25
groups per page. The grouped view's rows-per-page selector now also lists the
size in force when it is not one of its fixed steps, as the table pager already
did.

Released as `minor`, not `major`: this repository keeps its major aligned with
`@objectstack/spec`, so a behaviour change is spelled out here instead.
