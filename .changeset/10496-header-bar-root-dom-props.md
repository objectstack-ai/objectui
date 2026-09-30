---
'@object-ui/components': patch
'@object-ui/types': patch
---

fix(components): `header-bar` puts its `BaseSchema` DOM channels on the root `header` (objectui#10496)

The `header-bar` renderer was a function of the node alone, so the props every
component receives beside it never reached the element. An `ariaLabel` the author
declared ("Rendered as aria-label attribute") never became the banner landmark's
accessible name, and `style`, `id`, `testId` and the `data-obj-id` /
`data-obj-type` markers rendered exactly as if they had not been written.
objectui#10397 had made the root honour `className`, and nothing else arrived.

The root now takes the same route as the other converged renderers: what it is
handed goes through `toDomProps`, the shared DOM whitelist in `@object-ui/core`,
and `style` is forwarded by name. So `ariaLabel` names the landmark, and `style`,
`id`, `data-testid` and `data-obj-*` land on the `header`. The keys the renderer
consumes (`crumbs`, `search`, `actions`, `rightContent`) and any key an author
invents stay off the DOM. `className` is unchanged: it is still merged after the
header's own classes.

What an author sees change:

- a `header-bar` with `ariaLabel` is announced by that name;
- `style`, `id` and `testId` now apply to the header;
- every rendered header carries `data-obj-type="header-bar"`, like other nodes.

`@object-ui/types`: the refusal messages and doc comments for the retired
`header-bar` keys (`title`, `logo`, `nav`, `left`, `center`, `right`, `sticky`,
`height`, `variant`) said the renderer "takes no spread props". They now say what
it does: it forwards to its root only what the shared DOM whitelist admits, plus
`style`. None of those keys is on that whitelist, so none of them reaches the DOM,
and each is still refused by name.
