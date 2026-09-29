---
'@object-ui/components': patch
'@object-ui/plugin-list': patch
'@object-ui/plugin-detail': patch
---

A page now renders the accessible name an author declares in its `aria` bag, and the list view and the `record:*` blocks read the same bag through the one shared reader (objectui#11083).

**The page root (a fix).** The spec's `PageSchema` declares `aria` as `AriaPropsSchema`, and `PageNodeSchema` mirrors it. The page renderer passed its wrapper only DOM attributes, so the `aria` object was dropped and `{ type: 'page', aria: { ariaLabel: 'Orders' } }` rendered no `aria-label` anywhere. The page's root element now carries:

- `aria-label` from `ariaLabel`. A locale map (`{ en: 'Orders', 'zh-CN': '订单' }`) gives the entry for the display locale (`useDisplayLocale()`);
- `aria-describedby` from `ariaDescribedBy`;
- `role` from `role`.

The page adds no default role, and a page that declares no `aria` renders the same DOM as before. The flat `ariaLabel` on the page node still reaches the root as before; when both spellings name the same attribute, the nested `aria` bag wins.

**The list view and the `record:*` blocks (no visible change).** `ListView`'s list region and the `record:*` blocks' `useRecordAriaProps` used to map the nested bag themselves. Both now go through `resolveInlineAriaProps` from `@object-ui/react`, the reader the `element:*` blocks use, and keep only their own defaults: the list region's `region` role, and each block's default role, default name and the report of the refused `aria.label` spelling. One difference: an authored empty `role: ''` on a list view used to render an empty `role` attribute, and now falls back to `region`. The list view still reads `aria.live`, which objectui's `ListViewSchema` declares on top of the spec's bag.
