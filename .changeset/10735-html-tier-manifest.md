---
'@object-ui/core': minor
'@object-ui/sdui-parser': minor
'@object-ui/components': minor
---

feat(core,sdui-parser): the published manifest declares the html tier's registered intrinsic elements, marked `tier: 'html'` — `div` stays out

A `kind:'html'` page may author the everyday HTML tags its renderer registers —
the flow/inline set of `html-elements.tsx` (h1–h6, p, a, lists, emphasis,
figure/img/hr/br, time, address, cite, q), `span`, `table`, `label` and the seven
sectioning tags — and the console has rendered such pages all along. The
published `sdui.manifest.json` never said so: it was the curated `PUBLIC_BLOCKS`
vocabulary alone, so the objectstack CLI gate, which whitelists an html page's
tags from that manifest, refused every plain HTML tag as `forbidden-tag` on
pages the renderer accepts (200 ledgered findings over the three shipped showcase
pages). The maintainer ruled A on objectstack#20112: the producer declares the
set, exactly as the registry declares it, and `div` stays deprecated.

**What moves for a consumer.** `ComponentRegistry.getPublicConfigs()` — the
read both manifest producers serialise — now returns the curated tier AND the
html tier's intrinsic elements, the latter from the new `HTML_TIER_INTRINSICS`
roster (`@object-ui/core`) and each stamped `tier: 'html'` in the projection.
`manifestFromConfigs` carries that one value into a new optional
`ManifestComponent.tier` (`@object-ui/sdui-parser`), so the regenerated
`sdui.manifest.json` grows by the roster (47 entries, each with its registered
`inputs` and its child slot declared exactly where the registration renders a
child list — the void tags `img` / `hr` / `br` declare none) and
`sdui-intrinsics.d.ts` types them. A reader that whitelists tags by key — the
objectstack gate — needs no change and accepts the tags. A reader that means the
CURATED vocabulary filters on the stamp: `generateBlockList` now sections the
html tier under its own count, and the `kind:'react'` JSX scope skips stamped
entries (`@object-ui/components`, `react-page.tsx`), so no `P` / `A` / `Img`
wrapper is injected into react pages — on that tier a lowercase `<p>` is React's
own element.

**What does not move.** `PUBLIC_BLOCKS` is unchanged and the two rosters are
pinned disjoint; every curated manifest entry serialises byte-identically
(`tier` is written as exactly `'html'` or omitted). `div` is not declared: the
gate keeps refusing `<div>` on an html page, and `box` remains the JSON
surface's replacement. `code` is not declared either — the bare `code` key is
the `field:code` widget's namespace fallback, not an element renderer — nor is
`kbd`; both are recorded, with reasons, in the console's exclusion ledger.
No registration changes; `html-elements.tsx` is untouched.

The manifest the framework ships regenerates from objectui's built tree at the
pin (its `gen-sdui-manifest-node.mjs`); its lockstep copy of `manifestFromConfigs`
must take this port for the stamp to reach that file — until then the tags are
declared there without the marker, which the gate treats identically.
