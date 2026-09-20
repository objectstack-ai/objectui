---
'@object-ui/fields': patch
---

Retire the dead `SchemaRendererContext` tail of the dependent-record
resolution. `LookupField` and `useCascadingOptions` now resolve
`dependentValues ?? {}`.

Both widgets used to resolve the record a cascade gates on as
`dependentValues ?? ctx.formValues ?? ctx.data ?? {}`. Neither of the last two
members exists: `SchemaRendererContextType` declares exactly `dataSource`,
`debug`, `debugFlags` and `apiFetch`, and `SchemaRendererProvider` accepts no
other prop — so that tail was unsettable rather than merely unset, and resolved
the empty record for every host that has ever rendered these widgets. Retired
under ADR-0049 enforce-or-remove (objectui#7206, maintainer ruling letter C).

Nothing observable moves, and that is the point: no host could populate those
members, so no surface ever took that branch. What changes is that the one
correct way to supply a record is now the only way there is — a host passes
`dependentValues`, and a host that does not gets a visibly gated picker or a
gated option list, rather than an empty record a documented fallback was
supposed to have filled.

The prose describing that tail as a working "record scope" channel goes with
it, in the widgets' own docs and at the reader sites that quoted the chain. A
comment asserting a channel the code does not have is what the next author
copies: this one had already been read as a live host-supplied channel by two
separate dependent-lookup investigations (objectui#7165, objectui#7190), which
is why the retirement takes the comments with the reads.
