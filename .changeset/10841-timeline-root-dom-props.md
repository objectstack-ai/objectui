---
'@object-ui/plugin-timeline': patch
---

A `plugin-timeline:timeline` node no longer writes its own schema onto the
page as HTML attributes (objectui#10841).

`TimelineRenderer` collected every prop it did not name and spread them onto
the root element of each variant. Created through `SchemaRenderer`, that bag
holds every node key left after `SchemaRenderer` strips its metadata keys, so
the rendered timeline carried `items="[object Object]"`, `variant="vertical"`,
`dateformat="long"` and, on a gantt, `scale` / `rowlabel` / `mindate` /
`maxdate`. React also logged an unknown-prop warning for each camelCase key.
The renderer reads all of those keys off `schema`, so nothing it draws
changes.

The root now takes the same route as the converged renderers in
`@object-ui/components`: the bag goes through `toDomProps`, the SDUI widget
contract's DOM pass-through in `@object-ui/core`, and `style` is forwarded by
name. That keeps the `data-obj-id` / `data-obj-type` locator, the
`data-testid` an authored `testId` promises, the resolved `aria-*` / `role`,
`id`, `tabIndex`, and the host event handlers that contract forwards
(`dom-props.ts` declares the full set).

Dropped, and no longer on the root:

- every authored schema key;
- the `disabled` attribute a disabled node used to put on the `ol` / `div`
  root, where it had no effect;
- `name` / `label`, which `BaseSchema` declares but which have no effect on an
  `ol` / `div`;
- an authored `title`, which the timeline node does not declare. It is a
  global HTML attribute, so dropping it removes the native tooltip it used to
  put on the root.

`ObjectTimeline` hands `TimelineRenderer` its schema alone, so the object-bound
timeline is unchanged. The prop type is unchanged.
