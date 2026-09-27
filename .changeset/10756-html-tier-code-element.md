---
'@object-ui/components': minor
'@object-ui/core': minor
'@object-ui/types': minor
'@object-ui/fields': minor
'@object-ui/cli': minor
---

feat(core,components): the html tier registers and declares `code` — `<code>inline</code>` on a `kind:'html'` page renders its text instead of the `field:code` editor

`renderers/basic/html-elements.tsx` called `code` "registered elsewhere", but the
only bare `code` registration was the `field:code` widget's namespace fallback: a
code editor reading `value`, with no declared inputs and no child slot. The
console's html-tier compile whitelists `ComponentRegistry.getKnownTypes()`, so
`<code>inline</code>` on an html page compiled, resolved to the editor, and the
authored text was dropped — while `pre`, `strong` and `em` rendered their
children through the passthrough, and `span` through its own renderer. The
published manifest (objectui#10735) left `code` undeclared for the same reason,
so the objectstack gate refused the tag the renderer mis-drew.

**What moves for a consumer.**

- `@object-ui/components` — `code` joins the `TAGS` loop of `html-elements.tsx`:
  registered `ui:code`, sanitised like its siblings, declaring `className` and the
  `children` slot. An html author's `<code>` now renders a real `code` element with
  its text.
- `@object-ui/fields` — **BREAKING (authoring): the bare `code` key no longer
  resolves to the code-editor widget.** `code` joins `FIELD_TYPES_SKIP_FALLBACK`,
  so the widget is registered `field:code` only. A node authored as bare
  `{ "type": "code", "value": … }` now renders the html tier's `code` element (it
  draws `children`, not `value`); in a registry without `@object-ui/components`
  the bare key resolves to nothing. Migration: `{ "type": "code" }` becomes
  `{ "type": "field:code" }`. Form fields of type `code` resolve through the
  `field:` namespace and render the same editor as before. Released as `minor`
  under objectui's version policy; a breaking change never declares `major`.
- `@object-ui/core` — `code` joins `HTML_TIER_INTRINSICS`, so `getPublicConfigs()`
  projects it stamped `tier: 'html'` and the regenerated `sdui.manifest.json`
  grows by one entry (the html tier declares 48 tags where objectui#10735
  declared 47); `div` and `kbd` stay undeclared.
- `@object-ui/types` — `HtmlElementSchema` (zod and TS) names `code`, keeping the
  JSON-surface declaration equal to the registration, as the objectui#8499 pin
  requires — so `AnyComponentSchema` (and `objectui validate`) now accepts
  `{ "type": "code" }`, which it refused before.
- `@object-ui/cli` — `packages/cli/src/utils/known-schema-types.ts` regenerates
  from the registrations and gains `ui:code`, so `objectui validate` and
  `objectui check` recognise it as a known schema type (the objectui#9533 and
  objectui#6416 precedent).

The `kind:'react'` scope skips stamped entries, so no `Code` wrapper is injected
on react pages. The framework's tracked manifest regenerates at its next
`.objectui-sha` bump (objectstack#20112's port list); nothing there changes here.
