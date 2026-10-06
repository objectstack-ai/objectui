---
'@object-ui/fields': patch
---

Two cells now draw the right text (objectui#11683).

- **Formula cell (`FormulaCellRenderer`).** A numeric result is drawn by `NumberCellRenderer`, so it is grouped in the viewer's locale and set in the number cell's tabular figures, no longer printed raw in monospace: a formula with no `returnType` holding `200000` reads `200,000` in en-US and zh-CN. A result counts as numeric when the field declares `returnType: 'number'`, or when it declares no `returnType` and the value is a JS number. A declared `scale` sets the width, as on a number field. A string of digits from a formula with no `returnType` stays text, and any other declared `returnType` is drawn as before. `summary` fields use this renderer, so a numeric roll-up is formatted the same way. No type is inferred from the formula's expression or its inputs: the spec's `returnType` has no currency value, so a formula over currency fields reads as a plain number.
- **Datetime cell (`DateTimeCellRenderer`).** On the compact face, the default, the date and the time are separated by a space in the text, not by a margin alone. Copied text, screen readers and `textContent` get `10/6/2026 1:42 am` (en-US) and `2026/10/6 上午1:42` (zh-CN) where they got the two halves run together. The text is now exactly what `formatDateTime(value, { style: 'compact' })` returns. The time keeps its muted colour; its margin narrows from `ml-2` to `ml-1` beside the space.

No export, prop or language-pack key is added.
