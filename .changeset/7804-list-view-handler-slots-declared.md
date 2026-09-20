---
'@object-ui/types': minor
---

Declare the five handler keys the `'list-view'` renderer reads (objectui#7804,
the `ListViewSchema` slice).

The zod arm `type: 'list-view'` selects now declares `onAddRecord`,
`onBulkAction`, `onDensityChange`, `onNavigate` and `onPageSizeChange` as
objectui#6124 RUNTIME SLOTS: a named refusal on the JSON face, a callable twin
on the TypeScript face.

**Breaking, and measured.** `BaseSchema` ends `.passthrough()`, so a key an arm
does not declare is not refused — it stops being judged and the value is KEPT.
`SchemaRenderer` then spreads every non-metadata top-level key of the node into
the component props bag, so an authored value reaches the read site. Measured on
the unmodified arm: each of the five parsed GREEN with `{"action":"toast"}`
surviving into the parsed output, while `ListView` went on reading and INVOKING
it — `props.onAddRecord?.()` behind the toolbar's add-record button,
`props.onBulkAction?.(action, rows)` behind a bulk-action button,
`props.onPageSizeChange(newSize)` on the pager's `select`, and
`schema.onNavigate` / `schema.onDensityChange` handed to `useNavigationOverlay`
and `useDensityMode`. After this change all five are refused BY NAME with the
objectui#6124 guidance (issue `code: 'custom'` at the key's own path) and the
message points at the node-type spelling. `onRowClick`, still undeclared on the
same arm, is still accepted and still KEPT on the same document — the control
proving the probe distinguishes a refusal from a parser rejecting everything.

A version shipped as `minor` because this package ships inside the `fixed`
group `.changeset/config.json` enumerates, where any `major` would carry every
member with it, so `major` is unavailable
(`scripts/check-changeset-no-major.mjs`); the accept-set move is the breaking
part.

**The TypeScript face is narrowed too, and only where it should be.** Unlike
every earlier slice of this card, this arm FEEDS its own declared type:
`ListViewSchema` is `z.input` of the mirror intersected with
`ListViewRuntimeProps`. A refusal arm's `z.input` is `never | undefined`, which
ANDs a runtime declaration down to `undefined` — so declaring the five would
have silently killed `onNavigate` and `onDensityChange` on the TypeScript face
while every gate stayed green. The intersection now gives the runtime half
precedence (`ListViewAuthored`), so:

- `ListViewSchema['onNavigate']` and `['onDensityChange']` are unchanged —
  still the function types `ListViewRuntimeProps` declares, still supplied on
  the node by hosts such as `@object-ui/app-shell`'s `ObjectView`.
- `ListViewSchema['onAddRecord']`, `['onBulkAction']` and `['onPageSizeChange']`
  are now DECLARED on `ListViewRuntimeProps` with the signatures `ListViewProps`
  in `@object-ui/plugin-list` already carried, where before they were typed only
  by `BaseSchema`'s passthrough index signature — `unknown`, a declaration
  nobody wrote and nobody can read. `ListView` reads all three off its props
  bag, and a host fills that bag either by passing the React prop or by putting
  the key on the node, where `SchemaRenderer` spreads it in; this declaration is
  the second path's contract. Same repair as the `ObjectGallerySchema` pair one
  slice earlier, for the same spread.

**A published interface therefore WIDENS as well as narrowing.** Three members
are added to `ListViewRuntimeProps`. Nothing that compiled before stops
compiling — `unknown` accepted any host handler and the declared signatures
accept the ones `ListViewProps` already held hosts to — but the surface is
larger, and it is stated here rather than left to be discovered.

**Migration.** Nothing in the corpus has to change: no authored `'list-view'`
document in this repository, its examples or its docs writes any of the five —
they were only ever reachable as host-supplied functions. A React host keeps
supplying them exactly as before. A document that *did* author one was never
running anything: it was being handed an object where a function was expected.

Per key, not per prefix: the five reach the renderer on two different faces —
two off the node, three off the props bag — and each disposition was assigned
from its own channel, not from its siblings'.
