---
'@object-ui/plugin-dashboard': patch
---

The metric cards no longer write authored keys they do not read onto the page (objectui#4425). Rendered through `SchemaRenderer`, which is how every dashboard draws its KPI tiles (`plugin-dashboard:metric` and `plugin-dashboard:metric-card` nodes), `MetricWidget` and `MetricCard` now spread onto their card element only what `toDomProps` from `@object-ui/core` passes: `id`, `className`, `role`, `tabIndex`, the `aria-*` and `data-*` families and the rest of that whitelist. They used to strip seven named non-DOM props and spread everything else, so `name`, and any key an author wrote that the card does not read (a `colorVariant` or a `label` on a `metric-card`, an extra key in a `metric` widget's `options`), landed on the element as an attribute, with objects written as `[object Object]`.

**Behaviour change.** On a dashboard node, an HTML attribute outside that whitelist no longer reaches the card either: an authored `name` or `style` on either node, or a `title` on a `metric` node (a card reads `title` as its heading), is now dropped. An authored `label` on a `metric-card` is no longer a `label="…"` attribute. It is still not the card's heading, which is `title`.

Rendering the components directly as React components is unchanged: `<MetricWidget …>` and `<MetricCard …>` still forward every `HTMLAttributes` key their props interfaces declare.

**Clause-②: no.** No exported type, prop, registration input or export changes. The helper that tells the two paths apart is internal and is not exported from the package entry.
