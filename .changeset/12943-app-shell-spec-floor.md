---
"@object-ui/app-shell": patch
---

Raise `@object-ui/app-shell`'s `@objectstack/spec` floor from `^18.0.0-next.2` to `^18.0.0-next.3` (objectui#12943).

The Packages page refuses an installed-package row that carries no `source`, and types the row from `InstalledPackageAtEitherStage['source']` (`@objectstack/spec/api-assembled`). `18.0.0-next.3` is the first release that declares that member on the row and whose paired runtime serves it. `18.0.0-next.2` declares no `source` there, so a spec or runtime resolved at `next.2`, which the old range admitted, would have the page refuse every row. The new floor admits only releases that carry it.

What an install resolves does not change: the lockfile already resolved `18.0.0-next.3`. No other package's `@objectstack/*` range moves.
