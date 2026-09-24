---
'@object-ui/sdui-parser': minor
'@object-ui/components': minor
'@object-ui/layout': minor
'@object-ui/types': minor
---

fix(sdui-parser,components,layout,types): containment is the declared `children` slot, not `isContainer` (objectui#9910)

`validateTree`'s `not-a-container` diagnostic now reads exactly one declaration:
an input named `children` in the component's registration `inputs` (the shape
`{ name: 'children', type: 'slot' }` that `tooltip`, the four `page:*`
containers and the five page kinds already carried). `isContainer` is no longer
consulted and is not a fallback — new exports `acceptsChildren` and
`CHILD_LIST_KEY` in `@object-ui/sdui-parser` spell the predicate, and the
retired `body` dialect follows the same reading.

Why: the flag was hand-kept and drifted from the renderers four times; after
objectui#6771 converged a dozen `schema.body` readers onto `children`, and with
objectui#6804 ruling the flag OFF for that population (it means layout
containment, and declaring it deletes a public tag from every react page's JSX
scope), the diagnostic landed FALSE on the one key `button`, `badge`, `alert`
and the `sidebar-*` parts render. The maintainer ruled declare-and-pin
(2026-09-24).

What is declared: every renderer under `@object-ui/components` and
`@object-ui/layout` that puts `schema.children` on the page — 65 registrations
measured bare plus `sidebar` and `sidebar-menu-button` in their provider
context — now declares the `children` slot; the 34 flow/inline HTML tags, the
seven sectioning tags, the layout primitives, `button` / `badge` / `alert` /
`toggle` / `span` (label and description fallbacks), `div`, `form`,
`scroll-area`, the ten `sidebar-*` parts and `page-header`. Nine public blocks
gain the slot in `sdui.manifest.json`; a `slot` input emits no JSX attribute, so
the generated `.d.ts` is unchanged. `isContainer` is kept everywhere it was
declared and re-described on every published face (`ComponentMeta`,
`WidgetManifest`, `ComponentMetaSchema`, the manifest types) as LAYOUT
containment — the react-page scope builder keeps reading it unchanged.

The runtime containment census is re-pointed from the flag to the input in both
directions (declared ⇔ actually renders, with named context probes for the
provider-scoped and portal renderers), `scripts/container-declaration-baseline.json`
is at zero, and a registration that is a layout container but renders no
authored list (`page:tabs`, `page:accordion`, `responsive-grid`) now draws the
TRUE `not-a-container` the flag used to silence.
