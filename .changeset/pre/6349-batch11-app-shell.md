---
'@object-ui/app-shell': patch
---

`DataSource` inside this package is now a re-export of `@object-ui/types`' `DataSource`, the one adapter contract, instead of an older and looser second declaration of it (objectui#6349, batch 11). The old copy was not published: the package entry never exported it, and no module imported it. The entry's exported names are unchanged, and nothing you import from `@object-ui/app-shell` changes shape.

No runtime behaviour changes.
