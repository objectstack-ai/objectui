---
'@object-ui/components': patch
---

The `ui:select` form renderer's `label` now names its combobox (objectui#10435).

Before, the renderer drew its `Label` with no `htmlFor` and the Radix
`SelectTrigger` with no `id`, and nothing set `aria-label` or
`aria-labelledby`. The trigger is a `button` with `role="combobox"`, a role
that takes no name from its content, so the placeholder and value text inside
it did not name it either: a labelled select's combobox had an empty accessible
name, and a screen reader announced an unnamed combobox.

The fix is the shape `element:record_picker` landed for the same defect
(objectui#5771): the trigger gets the node's `id`, and the label gets `htmlFor`
to it. A labelled select authored with an `id` is now named by its label, and a
required one's name leaves out the `*`, because the required marker is an
`aria-hidden` element (objectui#10368). A select authored without an `id`
is unchanged: the renderer mints no id, so its caption stays unassociated, as
on the sibling `input` and `textarea` renderers.
