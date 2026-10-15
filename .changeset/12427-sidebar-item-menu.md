---
'@object-ui/app-shell': minor
'@object-ui/i18n': minor
---

Console sidebar: the ⋯ menu a navigation entry will show on hover, in place of its pin icon (objectui#12427, in progress).

- **`SidebarItemMenu`** (app-shell, `layout/`, not added to the package entry): one menu for every entry type. Its entries derive from what the entry is. Add to favorites / Remove from favorites comes first. Open in new tab and Copy link follow for an entry that goes somewhere. They use the address the row's own link renders, so a console served under a basename opens and copies a working link, and a URL off the console is used as it is. Design comes last, for an `object`, `dashboard` or `page` entry. It opens that target's designer on the metadata-admin route (`/apps/APP/metadata/TYPE/NAME`, which is where a page's Edit in studio button already goes), and only a workspace admin whose session may author metadata sees it. The trigger shows only while the row is hovered or focused, as the pin icon did. A right-click on the row opens the same menu.
- **New `console.nav` keys in all ten language packs:** `itemMenu`, `openInNewTab`, `copyLink`, `linkCopied`, `linkCopyFailed` and `design`. The favorites entry reuses `common.addToFavorites` / `common.removeFromFavorites`.

The sidebar does not draw the menu yet. The navigation renderer draws each entry's hover control, and it needs a slot for this menu first.
