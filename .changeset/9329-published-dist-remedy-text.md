---
---

Internal only — no package release.

`pnpm check:published-dist`'s `tooling-in-published-output` hint told a reader whose
package had shipped a `*.tsbuildinfo` build record that they could "leave it at its
default (the package root)". Re-derived from TypeScript's own
`getTsBuildInfoEmitOutputFilePath` over all 94 tracked tsconfigs: of the 32 incremental
projects, 19 set an `outDir` with no `rootDir` and would derive their record INSIDE that
`outDir` — 18 of them inside a published build output directory. The parenthetical was
therefore advice that, followed literally by a reader in the affected shape, reproduces
the finding it is the remedy for.

The hint now states the derivation instead of a fixed location: the default is the
tsconfig's own path with a `.tsbuildinfo` extension, remapped from `rootDir` into
`outDir`, so it is the package root only when no `outDir` is set or when `rootDir`
happens to rebase it back out. Gate logic, thresholds and every `tsconfig.json` are
untouched — the diff is one string literal (objectui#9329).
