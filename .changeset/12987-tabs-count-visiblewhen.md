---
'@object-ui/components': patch
---

`page:tabs` no longer counts a related list the viewer cannot see (objectui#12987). A tab's derived badge sums the `record:related_list` blocks under it; a list whose own node-level `visibleWhen` is false, or that sits under a container whose `visibleWhen` is false, is now left out of the sum and is not probed. The gate is decided the way the tab body decides it when it draws the block: the same evaluator, with the page's row as `record`, `user` / `current_user` and page variables as `page`. A predicate that cannot be evaluated is fail-open, as in the body, so that list is still counted. An authored `count` on the tab is unchanged and still wins.
