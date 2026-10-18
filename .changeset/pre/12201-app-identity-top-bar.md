---
'@object-ui/app-shell': minor
'@object-ui/i18n': minor
---

Console: the app's identity moves into the top bar (objectui#12201, the maintainer's ruling of 2026-10-12).

- **One asset, drawn where the app is named.** `branding.logo` is the app's square icon. The top bar's app pill now draws it at 22 px left of the app's name, and every row of the app switcher draws its own app's logo at the same size. An app without `branding.logo` gets its `icon` (a lucide name) on a 22 px tile instead, so every row has a glyph. The tile takes the app's own `branding.primaryColor` when that is a hex (passed as CSS custom properties, with a dark-theme variant), and the neutral muted tile otherwise. A logo URL that fails to load falls back to the same tile.
- **The sidebar logo header is gone.** `UnifiedSidebar` no longer draws `branding.logo` above the navigation (the header objectui#10827 added). On a phone, where the top bar hides the app pill, the drawer header shows the app's glyph (26 px) and name in place of the old Home row; its 「All apps」 button is still the way back to Home (`data-testid="mobile-sidebar-home"` is kept on it).
- **Inside an app the top bar starts with the app.** The platform mark is no longer drawn in the `app` variant of `AppHeader`, and no path separator precedes the app pill. Home, the organizations pages and the Studio front door keep the mark. The way back to Home from an app is the switcher's new 「All apps」 row, which goes to the declared home (`useHomePath`).
- **The PREVIEW stage chip** sits on the right, beside the search box, inside an app. On platform surfaces it stays beside the mark.
- **The Studio entry has a label.** The icon-only hammer becomes an outline button 「Edit app」 with a pencil, at the left edge of the right-hand utility cluster. From the `lg` breakpoint up it shows the text; below that it is the pencil alone, named by its `aria-label` and `title`. Same gate (workspace admin and the server-reported metadata-authoring capability), same deep link, same `data-testid="app-design-in-studio-button"`. The switcher dropdown ends with an 「Edit APP in Studio」 row to the same target, shown to the same viewers.

Public surface:

- `@object-ui/app-shell`: `AppSwitcher` takes a new optional prop, `designInStudioPath?: string | null`. When set, the dropdown ends with the Studio row to that path. No export is added or removed.
- `@object-ui/i18n`: three keys are added to all ten language packs: `topbar.editApp`, `layout.appSwitcher.allApps` and `layout.appSwitcher.editAppInStudio` (interpolates `app`). No key is removed. `topbar.designInStudio` stays, because the AI Live Canvas still reads it.
