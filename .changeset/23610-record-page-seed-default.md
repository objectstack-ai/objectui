---
'@object-ui/plugin-detail': patch
'@object-ui/types': patch
---

A new record page seeded in Studio is saved with the `default` layout template instead of `full-width`, and the page node's `template` member is typed by reference to the spec's (part of objectstack#23610).

`@objectstack/spec` closes `PageSchema.template` to four layout names — `default`, `header-sidebar-main`, `three-column`, `dashboard` — and retires `full-width` by name, naming `default` as its replacement; the save path refuses a page that still carries it.

- **`buildDefaultPageSchema` seeds `template: 'default'`.** Studio's "new record page" seed takes its template from this synthesis, so with the old value the first save of a new record page was refused. The renderer maps `default` and `full-width` to the same `FullWidthTemplate`, so a seeded page lays out exactly as before.
- **`PageNodeSchema.template` is `SpecPage['template']`.** The member was re-declared as `string` over the spec's inherited one; once the spec closes the set, that widening is a TypeScript error (TS2430) on the interface. Against today's spec, whose member is still `string`, the type is unchanged.
- **The zod mirror's `template` is the spec's member too.** `PageNodeSchema` in the zod face declared `template: z.string()`, which accepts every name; once the spec closes the set it measures wider than the TS face, so `full-width` would still pass `objectui validate`. It now takes the spec's own member (defaults stripped, as for every imported member), and against today's spec it accepts exactly what it accepted before.

The renderer still recognises `full-width`, so pages already stored with it keep rendering.
