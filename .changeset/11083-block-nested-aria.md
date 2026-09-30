---
'@object-ui/components': patch
'@object-ui/plugin-detail': patch
---

Nine blocks now render the accessible name an author declares in their nested `aria` bag (objectui#11083, batch 2).

The spec declares an `aria` bag (`AriaPropsSchema`) on `element:text_input`, `element:record_picker`, `element:metadata_viewer`, `page:header`, `page:tabs`, `page:card` and `page:accordion`, and on the `feed` of `record:chatter` / `record:discussion`. None of these renderers read it, so `properties: { aria: { ariaLabel: 'Orders' } }` rendered no `aria-label` anywhere. Each one now reads the bag through `resolveInlineAriaProps` from `@object-ui/react`, the reader the other `element:*` blocks and the page root use, against the display locale (`useDisplayLocale()`). `ariaLabel` becomes `aria-label` (a locale map such as `{ en: 'Orders', 'zh-CN': '订单' }` gives the entry for the display locale), `ariaDescribedBy` becomes `aria-describedby`, and `role` becomes `role`.

Where the attributes land:

- `element:text_input`: on the input. Its description paragraph stays in `aria-describedby`, and an authored `ariaDescribedBy` is added after it.
- `element:record_picker`: on the combobox trigger, which keeps its `combobox` role unless the author declares another.
- `element:metadata_viewer`: on a new root `div` around the view. The block had no single root element before; with no `aria` declared the `div` carries no attribute.
- `page:header`, `page:tabs`, `page:card`, `page:accordion`: on the block's root element (the `header`, and the `Tabs`, `Card` and `Accordion` roots).
- The `feed` of `record:chatter` / `record:discussion`: on a new `div` around the embedded timeline, the way `record:activity` puts its own `aria` on the `div` around its timeline, with the same `record:*` defaults: no role while nothing is declared, and `region` to carry a declared name. The timeline keeps its heading as its own name. With no `feed.aria` declared the `div` carries no attribute.

None of the blocks adds a default role of its own, and a block that declares no `aria` renders the same attributes as before; the metadata viewer and the chat feed gain one attribute-less wrapper `div`.
