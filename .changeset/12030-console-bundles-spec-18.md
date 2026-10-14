---
"@object-ui/console": minor
"@object-ui/runner": minor
---

The console and the runner bundles are built against `@objectstack/*` 18.0.0-next.0 (objectui#12030). In both, the `@objectstack/*` ranges are `devDependencies`, but each package is an app build whose published `dist` bundles them, together with the `@object-ui/*` packages it compiles from source. So the shipped console and runner now carry the 18 prerelease line and the `@object-ui/*` changes that follow it.
