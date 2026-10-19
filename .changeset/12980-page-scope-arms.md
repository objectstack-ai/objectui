---
'@object-ui/app-shell': patch
---

A page route reads more of the objects its page binds in its own scope read, and an interface list page inside a package app no longer reads its source object a second time (objectui#12980, part 5).

- **The object arms a page can bind.** Part 1 derived a page's objects from its `object`, `interfaceConfig.source`, every `objectName` and every `dataSource.object`. The derivation now also collects `data.object` on the `ViewDataSchema` object arm (`data: { provider: 'object', object }`, the record source the `object-*` blocks resolve first), `parentDataSource.object` (`record:related_list`'s parent binding), `element:metadata_viewer`'s `object` when its view is `state_machine`, and `record:line_items`' `childObject` and `parentObject`. Such an object is read beside the page's other objects before the page draws, instead of by name once a block asks for it. Only string values count; an expression envelope binds nothing. `record:related_list`'s `add.picker.object` is not collected: the list reads it only when the user opens the picker.
- **The interface list page's source.** Inside an app that names a package, the list page reads its source through the app's scope, as `nav:menu`'s capability gate does, so the page route's scope read, which already holds the source, is reused. Before, a source the app's package holds was requested again by name. Outside a package app it still reads the source by name.

Nothing is added to a package entry: no export, prop or type member.
