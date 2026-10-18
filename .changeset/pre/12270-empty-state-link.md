---
'@object-ui/components': minor
'@object-ui/plugin-list': minor
'@object-ui/plugin-grid': minor
'@object-ui/app-shell': minor
---

An empty list draws its declared link, and a list page's own empty state wins over its source view's (objectui#12270).

`@objectstack/spec` 18 gives the empty state (`EmptyStateSchema`) one optional `link: { label, url }`, and a list page's `interfaceConfig` an `emptyState` of its own with that shape. Both parsed and neither was drawn:

- a list view's empty state (`ListView`, on its `grid` and `gallery` visualizations) and the `object-grid` block's authored empty state now draw the link, beside the add-record action where the view offers one;
- a list page's own `interfaceConfig.emptyState` now wins, whole, over the one its source view declares, on every visualization; the source view's is the fallback when the page declares none.

The link is followed as a `type: 'url'` action through the action runner, so it opens what such an action opens: an in-app path in place, an `http(s)://` address as the runner opens an external target, and `mailto:` in place. The runner refuses anything else at the click and reports it. The link's `label` takes a string or an inline locale map.

`@object-ui/components` exports `EmptyStateLink`, the one component every empty state draws the link with.

**Clause-②: yes (widening)** — the renderers start honouring two keys the spec declares (`emptyState.link`, `interfaceConfig.emptyState`), so what they draw widens. No existing key changes.
