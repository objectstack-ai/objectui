---
'@object-ui/app-shell': patch
'@object-ui/plugin-detail': patch
---

A related list on a custom app page draws and runs its authored actions when its parent record is bound through `parentDataSource` (objectui#12870).

Before this change, the page offered related lists no action handlers. A `record:related_list` bound to its parent through `parentDataSource` drew its rows, but none of the toolbar or row actions authored in its `actions`, and nothing on the page said why.

- **The page now serves the record page's executor.** The page mounts the record page's related-list bridge inside its own action runtime. A list that resolved its parent gets that bridge's toolbar and row executors, so its authored actions draw and run as they do on a record page. Its `record_related` row actions are placed too, because the list sits inside its bound parent record.
- **Only the executors are served.** A page list that authors no `actions` is unchanged: it shows no New, Edit or Delete, no row click and no default actions. The record page's related lists are unchanged.
- **Actions that cannot run are named.** When a list authors actions that no executor can run, it shows a notice next to the existing refusal notice and names each action. For example, a page list without `parentDataSource` has no parent record to run them against. The notice has the same audience as the refusal notice: dev builds, and viewers who can edit metadata.

No export, prop, type member or language-pack key is added to either package entry.
