---
'@object-ui/app-shell': minor
---

**Breaking:** `AppSidebar` is removed from `@object-ui/app-shell` (objectui#5817).
The package entry, `dist/index.d.ts` included, no longer exports it. The bump
is `minor` only because this repository's fixed release group never declares
`major`; treat it as a breaking change.

Nothing in this repository mounted it. `ConsoleLayout`, the shell the console
renders, uses `UnifiedSidebar`, so the console itself does not change. The
component had been marked `@deprecated` under objectui#5720 after a census found
no GitHub-visible consumer anywhere in this org, and the maintainer ruled that the removal need not
wait for a major release.

Migration: render `UnifiedSidebar` from the same package instead, passing the
active app through the same `activeAppName` prop. It is not a drop-in
replacement, in three ways:

- It carries no app switcher and no user menu. The app-switcher dropdown and
  the user menu that `AppSidebar` drew in its own header and footer belong to
  `AppHeader` in the console shell, and `UnifiedSidebar` draws no mobile
  bottom-tab strip.
- It reads `NavigationContext` to choose between the active app's navigation
  and the `/home` menu.
- It gates differently, which is the difference objectui#5720 recorded:
  `UnifiedSidebar` hides its whole Administration cluster from anyone who is not
  a workspace admin, where `AppSidebar`'s no-app fallback cluster hid only the
  App Marketplace entry.
