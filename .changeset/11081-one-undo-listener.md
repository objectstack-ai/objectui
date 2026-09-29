---
'@object-ui/react': patch
---

fix(react): one Ctrl+Z undoes one record write, and Ctrl+Z inside a text field is the field's own undo (objectui#11081)

What a user saw: with two or more undoable actions behind them, one Ctrl+Z in the
console reverted SEVERAL saved record writes, one per mounted `useGlobalUndo`
(every console route mounts at least two), with a toast for each. And pressing
Ctrl+Z while typing in a field did not undo the typing: the keypress was
`preventDefault`ed and the last saved record write was reverted instead.

What changes: however many `useGlobalUndo` instances are mounted, one `window`
`keydown` listener serves them, so one Ctrl+Z (or Ctrl+Shift+Z) pops at most one
operation, and exactly one instance answers it: the longest-mounted live one,
whose data source runs the write and whose toast shows. That is the instance that
already answered whenever a single operation was stacked, so a single Ctrl+Z
behaves as before. A keypress whose target is an `input`, `textarea`, `select` or
contenteditable region is left alone: nothing is popped, the default is not
prevented, and the browser's own undo runs in the field. The listener is removed
when the last instance unmounts.

Unchanged: the hook's signature and return shape, and a toast's Undo button, which
still runs through the instance that raised the toast.
