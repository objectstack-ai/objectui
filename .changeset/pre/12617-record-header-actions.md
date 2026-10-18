---
'@object-ui/components': patch
'@object-ui/app-shell': patch
---

The record header draws one primary action and the rest as secondary buttons (objectui#12617).

`@objectstack/spec`'s action contract says that in `record_header` the first visible action becomes the primary button, and that a renderer may prefer a `variant: 'primary'` action. `page:header` drew every action without a declared variant with the filled style, so a header with three actions showed three primary buttons. Now:

- **One primary.** The primary is the first action declaring `variant: 'primary'`, else the first by `order`. It leads the row and is the only filled button. The other inline actions are outline buttons. A record with no app action shows its Edit as the primary.
- **The rest in the `⋯`.** The page's own actions share the `maxVisible` budget (3 on desktop, 1 on mobile). What does not fit goes to the `⋯` menu, above the host's favorites, Share and Delete.
- **Edit stays a labelled button.** The record page's Edit is the record's base action. It stays a labelled outline button in the row at every width, takes none of the app's slots, and no longer folds into the `⋯` behind an icon-only pencil once the app's actions fill the row. A destructive host action (Delete) always goes to the `⋯`, never inline.

A declared action whose `visible` predicate holds is still drawn, and one whose predicate fails is still absent. Nothing is added to either package entry: no export, prop, type member or language-pack key.
