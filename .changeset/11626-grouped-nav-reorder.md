---
'@object-ui/layout': patch
'@object-ui/app-shell': patch
---

Drag-to-reorder works on a grouped sidebar menu, within each level (objectui#11626). `NavigationRenderer` had a sortable path only in its group-free arm. Every stock app's menu is grouped, so the console's `enableReorder` drew no grip anywhere a user could reach.

**`@object-ui/layout`.** With `enableReorder` on, each group's children are now a sortable list of their own, and so is each run of top-level entries between two groups. An entry moves within its level only. It never moves into or out of a group, because which group an entry sits in is the app's structure, not a personal order. A move is reported through the existing `onReorder(reorderedItems)`, always with the top-level list. After a move within a group, that list is as drawn and the group's `children` are reordered. The moved level's entries carry their new positions as `order` (0, 1, 2, …), as a move in a group-free menu already did. While `searchQuery` narrows a grouped menu, the menu offers no grip, because a narrowed group shows only some of its children.

The drag grip is now the row's drag activator, in both arms. dnd-kit's sortable attributes (`role="button"`, `tabIndex={0}`, the sortable description) used to sit on the row wrapper while the listeners sat on the grip, so every row was a focusable button that no key could start a drag from. The attributes and listeners now sit together on the grip. The one element a keyboard can focus per row is now the element the keyboard sensor listens on.

**`@object-ui/app-shell`.** The sidebar's personal order store (localStorage `objectui-nav-order-APP`) keeps an order for each group under the group's `id`, beside the top level's `__root__`. The `id` is the one key a group has that holds across reloads and locales, because its label is translated. A move writes only the level that moved, so the rest of the menu keeps following the app. Every stored level is applied on load. A group-free app's `__root__` record is written and read exactly as before, so orders users already saved keep working.

A saved order now holds where the app authors `order` on its navigation entries. The renderer sorts each level by `order`, and the store used to apply a saved order by array position only, so on such an app a drag was stored and then sorted straight back, in a group-free menu as well. A level with a saved order now carries its saved positions as `order`. A level with no saved order is passed on untouched.

**Clause-②: no.** No export, prop, type member, callback parameter or i18n key is added or removed, and no signature changes. `NavigationRendererProps.enableReorder` and `onReorder` keep their types. Their doc comments, which ship in the published `.d.ts`, now state the within-level scope and what `onReorder` receives.
