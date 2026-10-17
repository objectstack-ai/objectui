---
'@object-ui/components': minor
---

A page laid out by a slotted template draws only the regions that template places, and says so on the page for any other (objectui#12476, maintainer ruling A on objectstack-ai/objectstack#23610).

Clause-②: no (narrowing)

`@objectstack/spec` 18 declares each template's slots (`PAGE_TEMPLATE_SLOTS`): `default` and `three-column` place header, sidebar, main, aside and footer, `header-sidebar-main` places header, sidebar and main, and `dashboard` places header and footer with every other region a grid cell. It refuses, at `os validate` and at save, a region its template does not place, and the retired `full-width` template.

The `page` renderer used to stack such a region under `main` at full width, ignoring its `width`, so a `left_sidebar` on a `three-column` page drew as one column. On the `default`, `header-sidebar-main` and `three-column` templates that region is now drawn nowhere and is not moved into another slot. Where it used to be stacked, the page shows a refusal that names the region and the slots the template places. A page row stored before the spec refusal is still served unchanged, so this is what it shows until the region is renamed.

`template: 'full-width'` no longer resolves. It was a second name for `default`, drawn by the same component. A served stored row is rewritten to `default` on read by the platform. A page node that still names it, or any template the registry does not hold, draws a refusal that names the template instead of falling back to the page-type layout. The registry is now keyed by the spec's template set, so a template the spec adds or retires fails to compile here.

Unchanged: the placed regions draw as before, each on its 12-column block grid (objectui#12624), with the narrow-region compact list (objectui#12703). `dashboard` keeps its open grid. A page that names no template takes the `pageType` layout, which still stacks an unplaced region under `main`.

The renames the spec names: `full-width` → `default`; on `default` and `three-column`, `left_sidebar` → `sidebar`, `right_sidebar` → `aside`, `content` → `main`; or choose `dashboard` when the regions are meant as a grid.

`@object-ui/components` now needs `@objectstack/spec` 18.0.0-next.2 or later: the renderer reads the spec's `PAGE_TEMPLATE_SLOTS`, which next.1 does not carry, so the package's declared range moves from `^18.0.0-next.1` to `^18.0.0-next.2`.

No export, prop, type or language-pack key is added or removed. The narrowing is in what the renderer draws: `PageNodeSchema.regions[].name` is a string in `@object-ui/types`, and the renderer no longer draws a name its template does not place.
