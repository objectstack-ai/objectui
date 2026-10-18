---
'@object-ui/app-shell': minor
---

The console page header folds its actions before it cuts the description (objectui#12705).

When a header is too narrow for its actions and its text, the actions fold first: the primary action stays labelled and the others move into the page's `⋯` menu, above the page's own entries. The title and the description keep their full line, and an ellipsis appears only once the actions have folded. The header measures its own width, not the window's.

- **Object lists fold.** The primary is the list's New when it draws one, otherwise the toolbar action authored `variant: 'primary'` (Setup › Users keeps Invite User). Import, the other toolbar actions and Add to favorites / Reset view share one `⋯`. The toolbar actions keep their gates and their run path, as when they spill past the bar's three-button limit.
- **Setup › Packages and the object data page fold too.** New Package and New stay labelled; Import and Save as view move into a new `⋯`.
- **New prop `foldedActions` on `ConsolePageHeaderProps`.** It is the same actions folded: the primary action and the `⋯` menu holding the others. A page that does not pass it keeps `actions` at every width, as before.
