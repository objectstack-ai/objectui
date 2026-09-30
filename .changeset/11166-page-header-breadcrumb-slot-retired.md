---
'@object-ui/components': patch
---

`page:header` no longer draws an empty breadcrumb slot, and an authored `breadcrumb` is
ignored (objectui#11166).

The renderer used to read `breadcrumb` (the spec's `PageHeaderProps.breadcrumb`, default
`true`) and draw an empty `data-page-breadcrumb-slot` div above the title, in both the bare
and the record-chip layout. Nothing ever filled it, and the console's app header already
draws the breadcrumb trail, so the key is being retired rather than wired up; the spec half is
objectstack#20758. Until that retirement reaches this package's `@objectstack/spec` pin the
contract still accepts the key, so an authored `breadcrumb` (`true` or `false`) renders
exactly like an absent one: no slot and no error. No trail is drawn in its place.

**Visible change: the title moves up.** The empty div still took space. In the bare layout
it was an item of the root's `gap-2` column, so the title row sat one `gap-2` (0.5rem) below
the top of the header; in the record-chip layout it carried `mb-1` (0.25rem) above the chip.
Both are gone on every header that did not already set `breadcrumb: false`. No class string
on the header changed.

The `page:header` registration keeps declaring the `breadcrumb` input while the contract
accepts the key, with a description that says it is ignored.
