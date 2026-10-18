---
'@object-ui/app-shell': minor
---

Console top bar inside an app: from the `lg` breakpoint up, the search trigger is the bar's middle zone, centered between the left group and the utility cluster (objectui#12472).

- **Three zones.** Inside an app, with a command palette mounted, `AppHeader` draws the left group (the app pill and its PREVIEW chip), then the 「Search ⌘K」 trigger, then the utility cluster (Edit app, the bell, help, the avatar). The two side zones grow from the same zero basis, so the trigger sits at the bar's center whatever either side holds. It had sat at the cluster's left edge, right of center, and moved whenever the presence avatars, the offline chip or the connection status came and went.
- **The utilities are never overlapped.** The cluster does not shrink below its content. When it needs more than half the bar (the offline chip, a connection status, five presence avatars and the AI button at 1024 px), the search yields to the left by the difference instead of overlapping them.
- **A long app name truncates in the pill.** The pill now shrinks with an ellipsis when the left zone is too narrow for it. Before, it kept its full width and spilled over whatever stood to its right, at every width from `sm` up. On a dashboard, page or report route, the pill and the crumb now share the shrink in proportion to their width; the crumb used to give it all.
- **The search trigger itself is unchanged**: its width, `aria-label`, `aria-keyshortcuts`, `data-testid` and the palette it opens.
- **Every route inside an app**, `system/*` included, draws the three zones, so the search holds its place as you move around the app.
- **Unchanged elsewhere.** Below `lg` the search is the icon button in the utility cluster, as before, and the phone bar is as it was. The `home`, `orgs` and `studio` variants keep the search at the cluster's left edge.

No export, prop, option or language-pack key is added, removed or renamed.
