---
'@object-ui/layout': patch
---

fix(layout): the mobile tab bar draws only the entries its sidebar draws

`AppSchemaRenderer` with `mobileNavMode: 'bottom_nav'` drew its tab bar from the
navigation tree with no entry guard. An entry the author hid with `visible: false`,
or gated with `requiredPermissions` the viewer lacks, was hidden in the sidebar and
still drawn as a tab, and an `action` entry became a tab linking to the root. The
five-tab cap was applied before any guard, so a hidden entry also took the place of
one that should have shown.

The bar now asks the sidebar's own guard about every node, through
`hasVisibleNavigationItems` (the predicate the area list already uses, built on
`passesNavItemGuards`), with the same evaluator, permission checker, capability
checker and doc-target checker the sidebar gets. The guard runs before the cap, and a
group the viewer may not see takes its entries with it, as in the sidebar. An
`action` entry is drawn the sidebar's way, as a button that hands the whole item to
`onAction`, and is left off the bar when no `onAction` is wired, which is when the
sidebar hides it too.

These are UI visibility gates, not data access: a route behind a wrongly drawn tab
still answered with its own server-side checks.
