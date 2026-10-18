---
"@object-ui/plugin-detail": patch
---

`@object-ui/plugin-detail` now declares `@objectstack/spec` `^18.0.0-next.3`, up from `^18.0.0-next.1` (objectui#12946).

Clause-②: no

Since objectui#12922 the published `dist/synth/buildDefaultPageSchema.d.ts` imports the type `SelectOptionKind` from `@objectstack/spec/data`. `18.0.0-next.3` is the first release that exports it; the `18.0.0-next.1` and `18.0.0-next.2` tarballs do not. The old range admitted both, so a consumer that resolved either got a type declaration that names an export its spec lacks. The range is the claim a package makes about what it works against, and it now admits only specs that carry the symbol.

A consumer whose `@objectstack/spec` resolves to `18.0.0-next.1` or `18.0.0-next.2` moves it to `18.0.0-next.3` or later. An install that resolves the newest `next` is unaffected.

This package is one of the two exceptions the `18.0.0-next.3` note names to its statement that every package keeps its `@objectstack/*` range; the other is `@object-ui/app-shell` (objectui#12943). No export, prop, key or schema of the package changes, and this change moves no other package's range.
