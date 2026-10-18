---
'@object-ui/plugin-view': patch
---

The console list page's saved-view tabs show as many tabs as the toolbar row has room for again, instead of folding to one tab and "N more" (objectui#12518).

Inside the list toolbar's leading slot the view tab bar was as wide as the tabs it was drawing, so the strip measured its own content and its width fit kept its previous answer: once one tab had been drawn, one tab was all that fit, and resizing the window did not bring the others back. The bar now takes its container's width (`w-full` on its root), so the number of tabs follows the space the row leaves. A bar in a block container, such as the row of its own a refused view draws, already had that width and is unchanged.
