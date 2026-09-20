---
'@object-ui/layout': minor
---

Nav `visible`: an ancestor's predicate now reaches the whole subtree, and a group no longer outlives its children (objectui#10119)

The card reported that an app navigation item's `visible` CEL predicate was served to the
browser and then ignored, so the entry rendered for every user. That headline no longer
reproduces: measured on today's `main`, a leaf and a group whose predicate is `false` for the
session are both absent, and the same predicate evaluating `true` renders both — one run,
two sessions, asserted as a difference rather than as an absence. `evaluateVisibility`
routes the served `{ dialect, source }` envelope to the CEL engine, and `NavigationRenderer`
applies it per item.

Two paths into the same subtree did NOT apply it, and both are fixed here.

- **A pinned descendant escaped its hidden ancestor.** The Favorites section collects pinned
  items by walking `children`, and that walk asked nothing about the node it was descending
  through. So an author could gate a group with `visible`, watch the group disappear from the
  tree, and still find a pinned entry from inside it rendered under Favorites — the predicate
  evaluated, answered `false`, and changed nothing the excluded user could see. `visible`,
  `requiredPermissions` and the `requiresObject` / `requiresService` capability gates all
  leaked the same way, because the collection applied none of them. It now stops at a
  gated-away node. A Favorites section whose every entry is gated away is no longer rendered
  as a heading over an empty list.

- **A group whose children were all hidden rendered as an empty disclosure.** A labelled
  collapsible that opens onto nothing is a dead affordance, and it contradicted
  `hasVisibleNavigationItems` — the predicate the area switcher elects areas by, which already
  scores such a group as contributing nothing and documents that it "can never disagree with
  the rendered navigation". The renderer now asks that same predicate, so the sidebar and the
  area list agree about what a user can reach. A group authored with no children at all
  derives the same way, as it already did for area election.

The per-item guard sequence was written out twice and omitted once; it is now a single
`passesNavItemGuards` statement that `NavigationItemRenderer`, `hasVisibleNavigationItems`
and the Favorites collection share, so the three cannot drift again.

**Presentation, not authorization.** Hiding a nav entry is a UI affordance; the server still
enforces object and record permissions on every route an entry would have led to, and no
server-side check is touched. A user who types the URL directly gets the same answer as
before.

**Failure direction: fail-open, unchanged and now pinned.** A predicate that cannot be
evaluated still renders the entry, which is this tier's shipped policy. Hiding on error would
silently delete a user's navigation with no way to notice; showing on error leaves an entry
the server still refuses, and the unresolvable-predicate diagnostic still names the source.
