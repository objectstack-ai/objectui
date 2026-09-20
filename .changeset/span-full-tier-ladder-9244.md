---
"@object-ui/components": patch
"@object-ui/plugin-form": patch
---

fix(form): a whole-row field now spans the whole row at **every** breakpoint tier, not only the widest

The form's column count is resolved per tier by container queries
(`grid-cols-1 @md:grid-cols-2 @2xl:grid-cols-3` is three column counts on one
screen), but the renderer emitted a single col-span class for the widest tier
that reached the target. A field authored `span: 'full'` — the spelling
`@objectstack/spec` declares as «whole row at any column count» and tells
authors to prefer — therefore took 1 of 2 cells at the middle tier, rendering
pixel-identical to authoring nothing at all (measured in Chromium at 285px of
a 586px grid). It now emits one class per multi-column tier, each clamped to
that tier's column count: `@md:col-span-2 @2xl:col-span-3`.

⚠️ **Existing forms will look different at intermediate container widths** —
that is the fix. A field that was silently narrow in a modal or drawer now
occupies the full row there, as its metadata always asked. Narrowest and
widest tiers are unchanged, and a `colSpan` smaller than the grid is
unchanged. Layouts hand-tuned around the old behaviour should be re-checked at
modal width.
