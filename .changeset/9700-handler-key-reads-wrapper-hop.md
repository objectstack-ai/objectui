---
---

Tooling only — `scripts/check-handler-key-read-sites.mjs` now takes a registration-wrapper hop
through a type-only cast, so a `schema={bound as DetailViewSchema}` attribute no longer hides the
component behind a wrapper from the census.

Nothing published moves. The two files under a released package's `src/` are COMMENT-ONLY edits:
a `DetailViewSchema` member docblock and a `plugin-detail` test docblock, both of which asserted
that this gate's hop "stops at the wrapper" — a claim this change falsifies. No zod member, no
runtime behaviour and no published contract field changes; the arm's accept set is byte-identical.
