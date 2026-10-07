---
'@object-ui/app-shell': patch
---

Studio's navigation editor no longer fails every autosave while an "Add nav item" entry is still unbound, and its error banner goes once a nav save lands (objectui#11776).

"Add nav item" adds an entry before its target is picked, and the spec refuses an entry that names no
target for its type: an `object` entry needs an `objectName`. The save sent it anyway, so each autosave
failed with "navigation.N.objectName — Invalid input" until the entry was bound or removed. The save now
leaves out every entry that names no target for its type, at every depth of the tree, and sends the rest
in the editor's order with their ids unchanged. A `group` is always sent. The unbound entry stays on the
editor's canvas, in its place, and is sent there once its target is picked; until then the editor counts
it as an unsaved edit, so leaving the page warns before it is dropped.

The banner a failed nav save raises now clears when a later nav save lands. It is held apart from a
failure the open page or dashboard is showing, which a nav save leaves in place.

A nav entry's remove control is now reachable from the keyboard: it is in the tab order after its card,
shows on keyboard focus as it does on hover, and Enter or Space removes the entry. It was mounted only
while a pointer hovered the card.
