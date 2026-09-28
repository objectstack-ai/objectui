---
'@object-ui/plugin-grid': minor
'@object-ui/i18n': minor
---

A grouped grid now says, where the group counts are, that it grouped a **page**
(objectui#7189).

`useGroupedData` buckets the rows the browser already holds and computes every
per-group aggregate from that same array, so both the set of groups and every
number in a group header are properties of the fetched page, not of the query.
That is a correct implementation of client-side grouping and is **unchanged**
here — what was missing is any statement that client-side grouping is what you
are looking at. Measured on a 186-record store distributed 86 / 61 / 31 / 7 / 1
across five business units with a 100-row page: with contiguous rows the grid
rendered **two** group headers (`86`, `14`) and three units were absent from
the screen entirely; with interleaved rows all five resolved but every count
was a page slice (31 / 31 / 30 / 1 / 7). Nothing on screen said either.

The paging footer is not a statement about what was grouped, and it
demonstrably did not prevent the wrong reading — a wrong number invites a
second look, an absent row invites none. So the disclosure goes where the
authoritative-looking number is:

- a short `Partial` marker beside **every** group count, at every nesting
  depth, carrying the full sentence as its `title` and its accessible name;
- one line directly above the group list, inside the grouped region rather
  than in the footer: *"Grouped over the first 100 of 186 records. Group counts
  are page-scoped, and a group whose records all fall beyond the loaded rows is
  missing here."*

The trigger is the strongest thing the component can actually know, and the
wording never outruns it. With a real match total to compare against
(`resolvedTotalMatching` — the one derived value the pager and both bulk-bar
sites already read, reached either from the grid's own fetch or from a host's
`rowCount`) it states the fact with both numbers. With no total but a window
that came back full it may only say *"more may match"* — the same inference
`plugin-list`'s own footer draws when no total is known. Rows handed in inline
are not a page and are never marked, and **a grouped grid whose result set fits
in one page shows nothing at all**: the marker is conditional, which is what
makes it worth reading.

Server-side grouping — the durable fix — is deliberately NOT part of this. It
is an API-surface decision still open on objectui#5560, and nothing here builds
toward it or changes the fetch.

`@object-ui/i18n` carries the three new `grid.grouping.*` strings across all
ten locale packs; `GroupRow` gains two optional props (`partialLabel`,
`partialTitle`) and is otherwise unchanged. No metadata schema key was added:
the condition is derived from data the grid already has.

⚠️ **Dated note, 2026-09-28 — grid grouping is now server-side where the data
source can answer the group header query — objectui#7189, PR objectui#10878.**
The paragraphs above describe this change as it was written. Later in this same
release three of their sentences stopped describing the grid: that
`useGroupedData` buckets the rows the browser already holds, so the set of
groups and every header number are properties of the fetched page; that
client-side grouping is **unchanged** here; and that server-side grouping is not
part of this, is still open on objectui#5560, and that nothing here builds
toward it or changes the fetch. Maintainer ruling A on objectui#7189 settled that
question. On a data source that declares `queryGroupHeaders`, a grouped grid
that fetches its own rows now takes its groups, every group count and every
per-group aggregation from the query, and pages each group's rows on the
server; its counts are the query's own, so the `Partial` marker and the notice
described above never render there. On a data source without
`queryGroupHeaders`, the grid still groups the page it fetched in the browser,
as described above, and the marker and the notice are kept there. The rest of
this entry is kept as the reading of this change; the
`7189-server-side-grid-grouping` entry states what a grouped grid does now.

⚠️ **Dated note, 2026-09-28 — the `Partial` marker is retired before release —
objectui#10881.** Later in this same release the marker and the notice described
above were retired, with the three `grid.grouping.partial*` strings and
`GroupRow`'s `partialLabel` / `partialTitle` props that carried them (maintainer
ruling F). A grouped grid that fetches its own rows over a data source that
declares no `queryGroupHeaders` no longer groups the page it fetched: it
refuses grouping with an error naming that member. So the last sentences of the
note above — that on such a source the grid still groups the page it fetched,
and that the marker and the notice are kept there — no longer describe the
grid. The rest of this entry is kept as the reading of this change; the
`10881-grouping-needs-header-query` entry states what ships.
