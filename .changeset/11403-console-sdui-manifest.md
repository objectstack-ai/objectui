---
'@object-ui/console': minor
---

The console build now writes `dist/sdui.manifest.json`, the SDUI component manifest of the Console it built (objectui#11403).

A host serving this Console registers that file under `@objectstack/metadata-protocol`'s `SDUI_MANIFEST_SERVICE`, and its metadata save door judges page sources against it (ADR-0080 §5). Until now the build wrote no such file, so a host serving `dist` as-is had no manifest of its own: it printed one boot line and judged no page save.

`pnpm build` runs a new `build:sdui-manifest` step after `vite build`. It loads the console's full registry eagerly under Node (`dev/manifest-registry.ts`, the same module the `dev/manifest-dump.html` page loads) and calls the existing generator, `buildArtifacts` in `packages/sdui-parser/scripts/gen-manifest.ts`. The shipped file is that generator's `sdui.manifest.json`, byte for byte, for the console's own registry. The published `dist` gains this one file only: the generator's other two outputs (`sdui-intrinsics.d.ts`, `sdui-blocks.md`) are written to a scratch directory and discarded.

The step reads the workspace packages' built `dist`, which the console's `tsc` step already needs and which turbo builds first. Callers that run `vite build` directly (CI's E2E builds, `vercel.json`) do not run it.
