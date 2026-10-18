---
'@object-ui/react': minor
---

A `${…}` hole inside an inline locale map is evaluated (objectui#12936). In a node's `properties` bag (or its legacy `props` alias, or a block member evaluated with `useConfigBagEvaluator`), each member of a map such as `title: { en: 'Published ${data.at}', 'zh-CN': '…${data.at}' }` is evaluated like a plain string on the same key: against `record`, `current_user` / `user`, `page`, the host's roots, and `data` on a node with an API binding. A block that picks the viewer's language with `pickLocalized` off its evaluated props, such as `hero`, now draws the bound value instead of the template text, with no change to the block. A member's result is always a string, so the map stays a map.

A value counts as a locale map exactly when `@objectstack/spec`'s `InlineLocaleMapSchema` accepts it: every key a locale tag or `default`, every value a string. Any other object keeps the data-object rule and is handed over as authored, with nothing inside it evaluated. A map without a hole arrives as the same object. In development builds, a member whose expression throws keeps its source text and is now reported by the unevaluated-expression diagnostic by its locale (`properties.title.zh-CN`), as a plain string with the same hole is.

**Clause-②: yes (widening)** — the renderer honours a shape it used to hand over raw: a hole inside an inline locale map's member. No export is added or removed and no type changes; the set of authored values `SchemaRenderer` evaluates widens by that one shape.
