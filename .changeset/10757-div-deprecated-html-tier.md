---
'@object-ui/components': minor
'@object-ui/core': patch
'@object-ui/sdui-parser': patch
---

feat(components): `div` is deprecated on the html tier too — a `kind:'html'` page that authors `<div>` is refused at compile time, and the error names `box`

Executes the maintainer's ruling A on objectstack#20112 ("`div` stays
deprecated") in the renderer. Until now the published manifest left `div` out of
the html tier, so `os validate` refused a `<div>` page as `forbidden-tag`, while
the console compiled and rendered the same page. `div`'s registration declared
the deprecation for the JSON surface only, and its renderer exempted nodes the
html parser emitted (objectui#4000).

**What moves for a consumer.**

- **BREAKING (authoring): a `kind:'html'` (or legacy `kind:'jsx'`) page that
  authors `<div>` or `<ui:div>` no longer renders.** The html compile fails, and
  like every compile error this fails the whole page: the console shows the
  "HTML page failed to compile" panel. Each refusal is the parser's
  `forbidden-tag` sentence, followed by the declared replacement guidance, which
  names `box`. Migration: retype `<div>` to `<box>`. `box` renders the same
  element with the same `className` and no layout of its own.
- `div`'s registration now declares `deprecated.surfaces: ['json', 'html']`, so
  `ComponentRegistry.deprecationFor('div', 'html')` answers the declaration
  (with the unchanged `replacement`) instead of `undefined`. The html compile
  derives what it refuses from `deprecationFor(type, 'html')`, the registration's
  declaration, rather than from a list of tag names.
- The `div` renderer no longer exempts nodes carrying html-tier provenance, and
  its dev-build notice now says it applies to JSON-authored nodes and html pages
  alike. The migration bullets are unchanged.
- `span` is unchanged: it is still deprecated on the JSON surface only, and it
  still compiles on html pages.

Semver: `minor`, not `major`, per this repository's version-alignment rule. The
breaking semantics are stated above.

**Published declaration text (prose only, no behaviour change).**

- `@object-ui/core`: the emitted `dist/registry/Registry.d.ts` carries the
  rewritten `ComponentDeprecation` and `deprecationFor` docblocks, where `span` is
  now the worked example of a json-only deprecation and `div` is stated to name
  both surfaces. `dist/registry/html-tier-intrinsics.d.ts` carries the rewritten
  `HTML_TIER_INTRINSICS` docblock: its `div` bullet and the sentence describing the
  console's html-tier whitelist.
- `@object-ui/sdui-parser`: the emitted `dist/provenance.d.ts` carries the
  rewritten file-header sentence, where `span` is now the example of a tag that
  stays html-tier vocabulary.
