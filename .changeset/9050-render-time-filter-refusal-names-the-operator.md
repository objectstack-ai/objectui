---
'@object-ui/core': minor
'@object-ui/plugin-detail': minor
'@object-ui/plugin-form': minor
'@object-ui/plugin-grid': minor
'@object-ui/i18n': minor
---

A render-time filter refusal now renders a named "this view's filter is malformed" state instead of throwing out of render (objectui#9050).

`convertFiltersToAST` refuses eleven authored shapes with a `FilterOperatorError`, and
`toFilterNode` delegates to it from four call sites that are not on the wire path:
`RelatedList`, `LineItemsPanel` and `ObjectGrid` read it from a render-time `useMemo`
(where a throw is a render error, with no `classifyLoadError` to turn it into "the
filter is malformed"), and `ObjectGrid`'s deprecated `defaultFilters` leg reads it
inside the load effect, which caught the refusal but reported it under "Error loading
grid" over the converter's English paragraph.

What changes:

- `@object-ui/core` gains `toFilterNodeSafely`, whose result is a UNION — `{ ok: true,
  node }` or `{ ok: false, refusal }`. The refusal is deliberately NOT representable as
  `undefined`: `undefined` means "no filter", i.e. every row, which is the silently
  unconstrained query objectui#9001 closed. A caller must narrow before it can build a
  query.
- `FilterOperatorError` now carries `operator` and `field` as data, and
  `filterRefusalSubject` picks the token a diagnostic names. The eleven messages
  deliberately share no idiom, so recovering that token by pattern would be a twelfth
  dialect. `operator` is the spelling the AUTHOR wrote, never a canonical form
  substituted for it; it is absent on exactly the two arms that judge a comparand
  written with no operator in it, where `field` is the only handle.
- The three render-time readers keep the refusal as a value, send nothing, and render a
  state that names the operator. The subtree around them is unaffected — on the
  schema-rendered path a `SchemaErrorBoundary` already contained the throw, so what is
  new there is the DIAGNOSIS in place of a generic "Component failed to render"; mounted
  directly, which every one of these components supports through its package entry,
  there was no boundary at all and the throw reached the host.
- `view.malformedFilter` is added to all ten locale packs and to the three affected
  `createSafeTranslation` tables.

⛔ Not changed: which shapes convert. The converter's accept set is byte-identical —
this is a delivery change, not an acceptance one. Where the protocol's own parse accepts
an input this layer refuses, that gap is the protocol's to close and is filed against
`@objectstack/spec` rather than papered over here.
