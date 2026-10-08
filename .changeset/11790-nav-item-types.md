---
'@object-ui/app-shell': patch
---

Studio's nav editor offers every nav item type the spec declares, not only *Link to object* (objectui#11790).

In a writable package, *Add nav item* still adds an entry that links an object, and selects it. The nav-item inspector now has a **Type** choice that lists every member of `@objectstack/spec`'s `NavigationItemSchema` (with the 17.7.0 spec: object, page, dashboard, report, URL, action, component, documentation, group and separator), so the new entry can become any of them, and an existing entry can change its type.

- Each type that opens something picks its target from what the package already has: its pages, dashboards, reports, actions, docs and books, published and draft alike. A record page is not offered, because a page entry cannot pass it a record id, and neither is an action bound to an object, because the menu runs only actions that are not. A component entry picks one of the screens registered with the console. A URL entry is typed, with the window it opens in.
- A change of type keeps the entry's id, label, icon, visibility and permission gates, and badge, and drops what it opened. Every entry the editor writes is one that the spec's strict member for its type accepts. A separator keeps only its id and order. A group is added with no items under it, because this editor does not nest entries. An entry that holds children can change only to a type that keeps them.
- Saving is unchanged (objectui#11776). An entry whose target is not picked yet, or was cleared, stays in the editor and is left out of what is saved. A group and a separator open nothing, so they are saved as they are.
- The Interfaces rail shows a URL, component or documentation entry under its own icon. Such an entry opens no design surface, so its row stays disabled. A separator card on the nav canvas can no longer be renamed, because a separator has no label.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The new copy lives in the metadata-admin designer's own string tables (en and zh).
