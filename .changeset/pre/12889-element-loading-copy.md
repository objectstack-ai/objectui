---
'@object-ui/components': patch
'@object-ui/react': patch
---

Page element blocks draw their loading, empty and error defaults in the page's language (objectui#12889).

- **`element:repeater`.** While its query runs it shows the `common.loading` text ("Loading…", "加载中…") instead of an English literal. With no rows it shows `common.noData` ("No data"; it read "No records" before), and when the query fails with no message it shows `list.loadErrorTitle` ("Couldn’t load records"). An authored `emptyText` still wins, and a failure's own message is still shown as thrown.
- **`element:number`.** While its aggregate runs it draws a skeleton bar the height of the number's line instead of a bare `…` glyph. The bar is a status region named by `common.loading`.
- **The saved-view placeholder** (`ElementDataSourceLoadingPanel`, drawn by every block bound through a named `view` while it resolves) reads `common.loading` instead of an English "Loading view…".

No language-pack key, prop or export is added: all four keys already exist in every pack.
