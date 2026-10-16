---
'@object-ui/plugin-view': patch
---

A gallery view handed to `ObjectView` now draws with the `coverFit`, `cardSize` and `visibleFields` its `gallery` block declares (objectui#12053).

`ObjectView` builds the `object-gallery` node for a gallery view, whether the view comes from the host `views` prop or from a named `listViews` entry. It built a flat node that carried the cover field and the title field only, while `ObjectGallery` reads `coverFit`, `cardSize` and `visibleFields` from the node's nested `gallery` block. So `coverFit: 'contain'` drew covers cropped, `cardSize` was ignored and cards showed none of their `visibleFields`.

The node now carries the block nested, the shape `ListView` already hands `ObjectGallery`. It holds the five keys the spec's gallery block declares (`coverField`, `coverFit`, `cardSize`, `titleField`, `visibleFields`), each copied by name. A key the spec does not declare is not carried. The node no longer carries the flat `imageField` and `titleField`, because `ObjectGallery` reads the nested values first. A gallery view with no `titleField` still titles its cards by `name`.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
