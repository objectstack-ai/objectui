---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

Inside an app, the product mark stays in the top bar as the way home, and the app menu gains Back to home, All apps and Settings (objectui#12605).

- **The product mark is back in the app bar.** The bar's left group reads: the sidebar trigger, the product mark, a `/` rule, the app pill and the preview chip. The mark is the one the home page draws: a 32 px button holding a 24 px tile on `--primary` with the stack glyph, or the deployment's logo. It is named "PRODUCT home" from the configured product name and links to home. It sits at the same x on every surface: off an app, where there is no sidebar trigger, the trigger's slot is held empty before it.
- **`⌘⇧H` / `Ctrl+Shift+H` goes home** from any app page. It pushes a history entry, so the browser's Back returns to the page. A key press in a text field, a select or a content-editable region is left to that field. The keyboard-shortcuts dialog lists the shortcut inside apps.
- **The app menu.** The "Switch Application" group lists the installed apps with the current one checked. The Setup app is no longer in this group. After a divider come "Back to home" with its `⌘⇧H` keycaps, "All apps" and "Settings", which opens the Setup app. "Settings" is shown only when the viewer's app list includes the Setup app. "Edit APP in Studio" keeps its existing gate and now follows a second divider.
- **Below 640 px** the app pill shows the app's glyph only. The app's name is in the pill's tooltip and accessible name. The pill was previously hidden at this width.

Language packs: `layout.appSwitcher.backToHome`, `layout.appSwitcher.settings`, `layout.appSwitcher.productHome` and `console.shortcuts.goHome` are added in all ten locales. No package export is added.
