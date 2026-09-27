---
'@object-ui/components': minor
'@object-ui/core': minor
'@object-ui/types': minor
'@object-ui/fields': minor
---

feat(core,components): the html tier registers and declares `code` — `<code>inline</code>` on a `kind:'html'` page renders its text instead of the `field:code` editor

`renderers/basic/html-elements.tsx` called `code` "registered elsewhere", but the
only bare `code` registration was the `field:code` widget's namespace fallback: a
code editor reading `value`, with no declared inputs and no child slot. The
console's html-tier compile whitelists `ComponentRegistry.getKnownTypes()`, so
`<code>inline</code>` on an html page compiled, resolved to the editor, and the
authored text was dropped — while `pre`, `strong`, `em` and `span` rendered their
children through the passthrough. The published manifest (objectui#10735) left
`code` undeclared for the same reason, so the objectstack gate refused the tag
the renderer mis-drew.

**What moves for a consumer.**

- `@object-ui/components` — `code` joins the `TAGS` loop of `html-elements.tsx`:
  registered `ui:code`, sanitised like its siblings, declaring `className` and the
  `children` slot. An html author's `<code>` now renders a real `code` element with
  its text.
- `@object-ui/fields` — `code` joins `FIELD_TYPES_SKIP_FALLBACK`: the widget is
  registered `field:code` only and no longer claims the bare `code` key. Forms
  resolve widgets through the `field:` namespace, so a field of type `code` renders
  the same editor as before; a JSON node authored as bare `{ "type": "code" }` now
  renders the element passthrough, not the editor — spell the widget `field:code`.
- `@object-ui/core` — `code` joins `HTML_TIER_INTRINSICS`, so `getPublicConfigs()`
  projects it stamped `tier: 'html'` and the regenerated `sdui.manifest.json`
  grows by one entry (the html tier declares 48 tags where objectui#10735
  declared 47); `div` and `kbd` stay undeclared.
- `@object-ui/types` — `HtmlElementSchema` (zod and TS) names `code`, keeping the
  JSON-surface declaration equal to the registration, as the objectui#8499 pin
  requires.

The `kind:'react'` scope skips stamped entries, so no `Code` wrapper is injected
on react pages. The framework's tracked manifest regenerates at its next
`.objectui-sha` bump (objectstack#20112's port list); nothing there changes here.
