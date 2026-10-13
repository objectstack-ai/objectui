---
"@object-ui/console": minor
---

The console bundle is built against `@objectstack/*` 18.0.0-next.0 (objectui#12030). Its `@objectstack/client`, `@objectstack/lint` and `@objectstack/spec` ranges are `devDependencies`, but the published `dist` bundles them, so the shipped console now carries the 18 prerelease line and the `@object-ui/*` changes that follow it.
