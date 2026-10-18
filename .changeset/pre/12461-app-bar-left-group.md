---
'@object-ui/app-shell': minor
'@object-ui/i18n': minor
---

Console top bar inside an app: the app pill and its PREVIEW chip are the left group, an object route draws no breadcrumb, and 「Edit app」 is an icon button at every width (objectui#12461).

- **No object breadcrumb.** On an object's list, one of its views or one of its records, `AppHeader` draws nothing after the app pill from the `sm` breakpoint up. The page header names the page, the sidebar's active entry names the object and the saved-view strip names the view, so the crumb said the same name a third time. Its 「Switch Object」 menu goes with it: the sidebar switches objects and the view strip switches views. On a record opened from a related list, the way back is the record page's own back link to its parent; the top bar no longer draws the related-record trail. A dashboard, page, report or `system/*` route still draws its crumb.
- **The PREVIEW chip sits beside the app's name**, right after the app pill, ahead of any crumb. It had sat on the right, beside the search box. Platform surfaces keep it beside the mark.
- **「Edit app」 is an icon button at every width.** The pencil alone, a ghost icon button like the bell beside it, named 「Edit app」 by its `aria-label` and `title`. Same gate, same deep link, same `data-testid="app-design-in-studio-button"`. The text label it showed from the `lg` breakpoint up is gone, and with it `data-testid="app-design-in-studio-label"`.
- **Below `sm` nothing changes.** The phone bar's compact title still names the list, the view or the record.

BREAKING (`@object-ui/i18n`): the `topbar.switchObject` key is removed from all ten language packs, with no replacement. Its one reader was the 「Switch Object」 menu. A host that looked it up through the published packs now gets the key string back. No key is added or renamed.

`@object-ui/app-shell` adds, removes or renames no export, prop or option.
