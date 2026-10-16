---
'@object-ui/app-shell': minor
---

A Studio form field that declares the `ref:dataset` widget now renders a dataset picker instead of the JSON editor fallback (objectui#11601).

The metadata forms had no renderer for `ref:dataset`, so a field declaring it fell back to a raw
JSON box with a "falling back to JSON" note. The new widget offers the analytics dataset catalog,
showing each dataset's label beside its name and its description after it, and writes the dataset
name. It works for a field in a form section and for a column of a repeater row, in both the grid
and the card layouts. A stored dataset the catalog does not list stays visible and is marked
"(not found)". While the catalog is loading the field shows the stored name, and if the catalog
fails to load the field shows the load-failure notice beside a text box that stays editable. A
form whose host does not supply a catalog shows a plain text input for the dataset name.

The report inspector now supplies its dataset catalog to the report's form. A joined report's
block row picks up the dataset picker once the spec's "Joined blocks" row declares `ref:dataset`
(objectstack#21714). Until objectui is built against a spec that carries that declaration, a
block's `dataset` is still entered as free text.

The dataset option list that the report and dashboard-widget inspectors already show is unchanged.

`SchemaForm`'s `widgetContext` prop gains one optional member, `datasets`, the catalog the new widget
reads. It is additive: a host that passes no `datasets` renders exactly as before, except that a
`ref:dataset` field now shows the text input instead of the JSON fallback.
