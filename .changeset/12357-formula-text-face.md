---
'@object-ui/fields': patch
---

fix(fields): a text-valued formula is drawn as text, not in a monospace code font (objectui#12357)

The formula cell now draws a text result through `TextCellRenderer`, and the read-only form face (`FormulaField`) draws it with `TextField`'s read-only classes, whether the formula declares `returnType: 'text'` or declares no `returnType` at all. Both faces used to print every result that was not a number, boolean or date in monospace, so a formula yielding a person's name read as code beside the text columns around it.
