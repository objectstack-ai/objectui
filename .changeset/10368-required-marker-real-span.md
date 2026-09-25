---
'@object-ui/components': patch
---

fix(components): the required asterisk no longer enters a field's accessible name (objectui#10368)

`FieldContainer`, `element:text_input` and the `input`, `textarea`, `checkbox` and `select` renderers drew the required asterisk as CSS generated content (an `::after` utility) on the field's label. Browsers include generated content when they compute an accessible name, so where that label is associated with its control, a required field labelled "Title" was named "Title*". A pseudo-element cannot carry `aria-hidden`.

The asterisk is now a real `span` with `aria-hidden="true"` and `data-required-marker`, the shape the form renderer's `FormLabel` already uses, so it stays out of the name. It keeps the same colour and spacing. Every control keeps the required state it had before: the native `required` attribute, or `aria-required`. Validation does not change.

The `select` renderer's label is not associated with its trigger, so its name never contained the asterisk; its marker changes shape only. The generated-content utility these labels used is no longer compiled into `style.css`.
