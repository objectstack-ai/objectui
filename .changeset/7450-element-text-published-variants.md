---
'@object-ui/components': minor
---

`element:text` takes the nine `variant` values `ui:text` publishes (`h1`-`h6`, `body`, `caption`, `overline`) and renders each one the way `ui:text` does (objectui#7450).

`@objectstack/spec` 17.5.0 widened `ElementTextPropsSchema.variant` to those nine, plus the two spellings it already accepted (`heading`, `subheading`). This renderer still declared and drew only its old four, so `h1`-`h6` and `overline` rendered as a body paragraph, and the html tier refused all seven of them (`h1`-`h6` and `overline`) with `invalid-enum`, which fails the whole page.

- `h1`-`h6` render the heading element they name, with `ui:text`'s class for that level.
- `body`, `caption` and `overline` take `ui:text`'s class and render a paragraph (`<p>`), the block element `element:text` has always used for them. `body` and `caption` render exactly as before.
- `heading` and `subheading`, which the installed spec still accepts, render exactly as before (`<h2>` and `<h3>`, same classes). A later spec release retires them; write `h2` or `h3`.
- An absent `variant` still renders `body`. `ui:text` still does not synthesise `body` for an absent `variant` (objectui#6942): they are different components, and `element:text`'s docblock says why the two differ.

**Clause-②: yes (widening)** — the published `element:text` entry in `sdui.manifest.json` widens its `variant` enum from four values to the contract's eleven (the nine first, then `heading` and `subheading`) and gains a `description` naming the nine as the values to write. The html tier, and the objectstack CLI's JSX gate that reads this manifest, therefore accept `h1`-`h6` and `overline` on `element:text`. Every value they accepted before is still accepted.
