---
'@object-ui/types': minor
'@object-ui/plugin-ai': minor
---

Retire `carousel` from `AIRecommendationsSchema.layout` and from the
`ai-recommendations` designer enum (objectui#10330, ADR-0049 enforce-or-remove).

**Breaking, deliberately, and scored `minor` per this repo's convention** (a
`major` in the fixed group would push every package off `@objectstack`'s cadence;
`scripts/check-changeset-no-major.mjs` enforces it).

- FROM `layout?: 'list' | 'grid' | 'carousel'` TO `layout?: 'list' | 'grid'`.
  A TypeScript node that sets `layout: 'carousel'` is now a compile-time error.
- The `ai-recommendations` registration no longer offers `Carousel` in its
  `layout` enum, so the designer stops suggesting it.

The value was declared and offered but never implemented: `AIRecommendations`
renders only `grid` specially, so `carousel` always rendered as a list, with no
warning. Runtime behaviour does not change. A stored JSON node that still carries
`layout: 'carousel'` renders the list layout, exactly as before.

Migration: replace `layout: 'carousel'` with `layout: 'list'` (what it rendered)
or `layout: 'grid'`.
