---
---

Docs/test-comment only: `packages/data-objectstack/README.md`'s cache bullet said concurrent
requests for the same uncached key "may result in multiple fetcher calls", which is the opposite
of what `MetadataCache.get` does — it coalesces them onto one in-flight promise and counts the
saving in `coalesced`. Corrected the bullet and the one stale test comment that repeated the same
claim. No published behaviour changes; `MetadataCache.ts` is untouched (objectui#8927).
