---
'@object-ui/types': minor
---

The page schemas no longer import or attach `@objectstack/spec`'s page-parse judge of a view-data component's retired `api` binding, which objectstack#23784 removed from the spec (objectui#12666). objectstack builds this repository's console against its own spec tree, and that build failed with a missing export.

What `PageNodeSchema` and `PageKindNodeSchema` (and `safeValidateSchema` for `page`, `home`, `record` and `utility` nodes) accept changes in one place: an `object-grid`, `object-map`, `object-gantt` or `object-tree` under `slots`, at any depth, whose `properties.data` names `provider: 'api'` is now accepted, as objectstack `main`'s own `PageSchema` accepts it. The platform refuses that binding with the component-props rule (`validateComponentProps`) when the page is saved, validated with `os validate` or built with `os build`. Under `regions`, the `object-grid`, `object-map` and `object-gantt` arms still refuse it themselves. Nothing is added to the package entry.
