---
'@object-ui/app-shell': patch
---

A console toast's Undo and close buttons work while a drawer or dialog is open, and a click on a toast no longer reaches what lies under it (objectui#11723).

Creating a record or running a record action such as Approve raises a success toast with an Undo button, often while the record drawer is still open. The drawer, like every Radix modal, turns pointer events off for the rest of the page, the toaster included, so the toast could not be clicked. The click went through it: onto the drawer's overlay, which closed the drawer and left the action in place; onto the drawer's expand or close button; or onto a record action under the toast.

`ConsoleToaster` now makes each toast take its own clicks while a modal is open, and a press on a toast no longer counts as a click outside the modal:

- With the record drawer open, Undo runs and the drawer stays open, and the close button dismisses the toast and nothing else. The same holds under a centred dialog: the change is in the toaster, not in any one modal.
- A click anywhere on a toast stays on the toast.
- Only the toasts take the pointer, not the area around them, so the dismiss timer still runs while the pointer rests beside a toast (objectui#7482). As anywhere else, a toast pauses while the pointer is on it.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
