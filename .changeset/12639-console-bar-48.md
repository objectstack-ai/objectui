---
'@object-ui/layout': minor
'@object-ui/app-shell': minor
'@object-ui/console': minor
---

The console top bar is 48 px (`h-12`) in every frame, the height both approved console artboards draw (objectui#12639). It was 56 px (`h-14`).

- **One height everywhere.** `AppShell`'s header (inside every app), Home, the organization list and an organization's pages, the full-page assistant at `/ai` and the `/studio` landing all draw the same bar, so it no longer changes height on the way from Home into an app or onto an organization page. Studio's package builder keeps its own header, which was already 48 px from `sm` up.
- **The app sidebar follows the bar.** On desktop its column starts 48 px down and is the viewport's height less 48 px, so no gap opens between the bar and the sidebar.
- **The bar's contents are unchanged.** Its controls (the product mark, the app pill, the preview chip, the search field, the bell, help and the avatar) are 32 px or shorter, so each keeps its size.

No export, prop or type is added, removed or renamed. A host that renders `@object-ui/layout`'s `AppShell` gets the 48 px header too.
