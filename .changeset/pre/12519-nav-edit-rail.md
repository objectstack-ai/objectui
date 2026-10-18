---
'@object-ui/app-shell': patch
---

Studio Interfaces: editing the navigation keeps the 240 px rail, so the content column and the inspector no longer move when you press Edit or Done. Each row of the navigation editor is a 32 px line with the drag handle, the label, the kind chip and the remove button; the record an entry opens is shown in the row's tooltip. The remove button is always shown, dimmed until you hover or focus the row, and Tab reaches it. The app designer's navigation canvas uses the same row, and the canvas's "Add nav item" button moves to a line of its own when the space is narrow instead of wrapping its words.
