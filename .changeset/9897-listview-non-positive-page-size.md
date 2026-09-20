---
'@object-ui/plugin-list': patch
---

Refuse a page size the contract already refuses before it reaches any of
`ListView`'s six consumers of the resolved value, instead of forwarding it to
the wire (objectui#9897).

One authored `pagination.pageSize` is resolved once in this view and then feeds
six places: the `$top` window it fetches, the `$skip` step that turns the page,
the has-more gate behind the "showing first N" cap, the page size handed down to
the child grid, the record cap printed in that banner, and the rows-per-page
control's own displayed value. The resolution was a bare `??` chain, and `??`
rejects only `null` and `undefined` — so an authored `pageSize: 0` was not
nullish and survived as a real page size into all six.

What the surviving value actually did, measured in the real renderer over a
twelve-row fixture rather than inferred from the sibling repair: `$top: 0` went
out on the wire, the data source was asked for nothing, nothing came back, and
the view drew its EMPTY STATE — the child grid never rendered at all, so there
was no table, no record-count bar and no pager, and nothing on screen named the
cause. A negative left the same way (`$top: -10`). A non-integer is worse than
silent: `25.5` reached the wire, became the child grid's page size, and turning
the page asked for a fractional `$skip`; at a size below the row count the
refused number was printed to the reader as the record cap ("showing first 2.5
records").

All of it now goes through one resolver, mirroring the shape objectui#9853
landed on `ObjectGrid` — one resolver at every entry is what keeps the answer
single. A value the contract refuses is dropped, this view's own default is
used, and one `console.warn` on the channel this component already uses for
"you declared it, the renderer dropped it" names the member and the value. The
warning is conditional: an absent key and a usable page size both stay silent.
The runtime choice is covered as well, not only the authored one — an author can
put a refused number in `pageSizeOptions`, and picking it used to overwrite a
perfectly good authored size.

Refusing these is not this renderer choosing a meaning. `@objectstack/spec`
declares the view pagination member a positive integer and its own suite pins
the refusals under the names `should reject zero pageSize` and `should reject
negative pageSize`; the `limit` this package's `ElementDataSourceMapping` lowers
`pagination.pageSize` into is declared positive as well.

The fallback literal is now a named constant. Whether it belongs next to
`ObjectGrid`'s own three defaults is **not** decided here — changing it changes
what every list with no authored `pagination` fetches, which is a product
decision rather than an execution seat's, and it is handed back as a question on
the issue.
