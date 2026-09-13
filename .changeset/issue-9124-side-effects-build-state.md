---
---

Internal, no published package changes: `scripts/check-side-effects-array.mjs` now decides whether a published form is a second build FORMAT from the manifest's own subpath structure rather than from `fs.existsSync`, so the gate returns the same verdict on a built and an unbuilt checkout (objectui#9124).
