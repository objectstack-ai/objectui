---
'@object-ui/plugin-timeline': patch
---

A `plugin-timeline:timeline` node no longer writes its own schema onto the
page as HTML attributes (objectui#10841).

`TimelineRenderer` collected every prop it did not name and spread them onto
the root element of each variant. Created through `SchemaRenderer`, that bag
holds every authored key of the node, so the rendered timeline carried
`items="[object Object]"`, `variant="vertical"`, `dateformat="long"` and, on a
gantt, `scale` / `rowlabel` / `mindate` / `maxdate`. React also logged an
unknown-prop warning for each camelCase key. The renderer reads all of those
keys off `schema`, so nothing it draws changes.

The root now receives only a named set of DOM attributes: `id`, `style`,
`role`, and every `data-*` and `aria-*` attribute. That keeps what
`SchemaRenderer` mints for the DOM: the `data-obj-id` / `data-obj-type`
locator, the `data-testid` an authored `testId` promises, and the
`aria-label` / `aria-describedby` / `role` derived from the node's ARIA keys.

Dropped, and no longer on the root: every other key, including the `disabled`
attribute a disabled node used to put on the `ol` / `div` root (it had no
effect there) and an undeclared `title` / `name` / `label` on the node. No
in-repo caller passes `TimelineRenderer` an event handler or a `ref`:
`ObjectTimeline` hands it `schema` alone. The prop type is unchanged.
