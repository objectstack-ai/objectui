---
"@object-ui/react": minor
"@object-ui/app-shell": minor
"@object-ui/plugin-list": minor
"@object-ui/i18n": minor
---

A `list-view` block drawn as a compact list in a narrow page region now shows a "View all" link under its rows (objectui#12703).

- `@object-ui/react`: `RelatedRecordActionsValue` gains two optional members, `listHref(objectName, viewName?)` and `openList(objectName, viewName?)`. They address an object's list page, or one of its saved views, the way `recordHref` / `openRecord` address a record. A host that omits them is unchanged.
- `@object-ui/app-shell`: a custom page supplies them. The routes are `/apps/APP/OBJECT/view/VIEW` for a block bound to a saved view (`dataSource.view`) and `/apps/APP/OBJECT` otherwise. The block's inline filter, columns and sort are never put in the URL.
- `@object-ui/plugin-list`: the compact list draws the link only when the host answers a destination. It is a real anchor with in-app navigation on a plain click.
- `@object-ui/i18n`: one new key, `list.viewAll`, in all ten packs.
