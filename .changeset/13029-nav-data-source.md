---
'@object-ui/layout': minor
'@object-ui/app-shell': minor
'@object-ui/types': patch
---

A navigation entry's API `dataSource` is read, and its `visible` sees the selected value as `data` (objectui#13029).

The spec lets a navigation entry declare `dataSource: { provider: 'api', read: { url }, path? }` (`BaseNavItemSchema.dataSource`). Only the entry's `visible` reads the value, as `data` (for example `data.total == 1`). The label, the target and `children` do not.

- `@object-ui/layout`: `VisibilityEvaluator` takes an optional second argument, the entry whose `visible` it judges. The item guard passes it on every path it serves: the rows, the derived area visibility and the Favorites section. The default evaluator reads no binding, so it hides an entry that declares one. An entry without the key renders as before.
- `@object-ui/app-shell`: the sidebar, the `nav:menu` block and the command palette share one `visible` evaluator. It reads each binding the app's navigation declares through the page element's reader (`readElementApi`, with the host's signed-in `apiFetch`). The entry is hidden while the read is pending, after it fails, when `path` selects nothing, or when the spec refuses the binding. An entry without the key is evaluated as before, with no request and no wait.
- `@object-ui/types`: the `dataSource` describe and doc on the navigation item now state what the console does with it. The accept set is unchanged.
