---
'@object-ui/app-shell': minor
'@object-ui/layout': minor
'@object-ui/i18n': minor
---

Console sidebar: one Favorites section at the top, and one ⋯ menu on every entry (objectui#12427).

- **The ⋯ menu replaces the pin icon.** When you hover a navigation entry it shows one ⋯ trigger, and a right-click on the row opens the same menu. There is no pin icon any more. The menu's entries depend on what the entry is:
  - Add to favorites / Remove from favorites always comes first. It writes the same pin as before, so the entry lands in the Favorites section at the top.
  - Open in new tab and Copy link appear for an entry that goes somewhere. They use the address the row's own link renders, so a console served under a basename opens and copies a working link, and a URL off the console is used as it is.
  - Design appears for an `object`, `dashboard` or `page` entry. It opens that target's designer on the metadata-admin route (`/apps/APP/metadata/TYPE/NAME`, which is where a page's Edit in studio button already goes). Only a workspace admin whose session may author metadata sees it.
  - On a phone, navigation entries show no trigger, as they showed no pin icon before.
- **One Favorites section, at the top.** Favorites that are not navigation entries, such as an object or a record you starred, used to be a group after Recent, below the fold on a long menu. They are now rows of the Favorites section at the top, after the pinned entries. Each row shows its stored label and type icon and carries the same ⋯ menu, whose favorites entry removes it. Design shows for object, dashboard and page favorites, never for a record. Existing favorites appear there as stored: nothing in the favorites store changes and nothing is migrated. The console-home Starred group and the Home page are unchanged.
- **The page header's favorites entry is in its overflow menu.**
  - The object list header no longer has a star. Its last control is now an icon-only ⋯ button ("More actions") whose menu holds Add to favorites / Remove from favorites. When the current app's navigation has an entry that opens this list, the entry pins that navigation entry, the same action as the sidebar's own menu. It writes one `nav:` favorite that lands in the Favorites section, and no second `object:` favorite. For an object the app does not list, it keeps an `object:` favorite.
  - On a record page the same entry leads the header's ⋯ overflow, ahead of Share, and toggles the record favorite.
- **`NavigationRenderer` (`@object-ui/layout`) gets two additive props.**
  - `renderItemAction(item, context)` is a host control drawn on every leaf and action row, in place of the pin action. `context` carries the row's `href`, `external`, `label` and `basePath` (type `NavItemActionContext`).
  - `extraFavorites` takes host rows that are appended to the Favorites section after the pinned entries. The section renders when either kind of row is there.
  - A host that passes neither keeps the pin action and a section of pinned entries only, with the pinned drag order unchanged.
- **Language packs.** Six new `console.nav` keys in all ten packs: `itemMenu`, `openInNewTab`, `copyLink`, `linkCopied`, `linkCopyFailed` and `design`. The list header's ⋯ button is named by `detail.moreActions`, the name the record header's ⋯ already has. The favorites entry reuses `common.addToFavorites` / `common.removeFromFavorites`. `sidebar.favorites`, the title of the removed group, is no longer read and leaves all ten packs.
