---
'@object-ui/types': minor
---

The `page` node and the spec page-kind nodes (`record` / `home` / `utility`) chain `@objectstack/spec`'s `checkPageRequiresKind` (objectui#11717), as they already chain `checkPageSourceCompleteness`. A page that writes `requires` on a kind the platform does not compile at save is now refused at `requires` with the spec's own message, as the spec refuses it since 17.7.0. That covers `react`, `full` and `slotted` pages, and a page with no `kind`, an empty list included. `requires` stays legal on `html` and `jsx` pages, where the platform derives it from the compiled source. This narrows the accepted documents. The fix: delete the key.
