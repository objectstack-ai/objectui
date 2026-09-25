---
'@object-ui/components': patch
---

fix(components): the required asterisk no longer enters a field's accessible name (objectui#10368)

`FieldContainer`, `element:text_input` and the `input`, `textarea`, `checkbox` and `select` renderers drew the required asterisk as CSS generated content (an `::after` utility) on the field's label. The accessible-name computation includes generated content, so where that label is associated with its control, Chromium named a required field labelled "Title" as "Title*". A pseudo-element cannot carry `aria-hidden`.

The asterisk is now a real `span` with `aria-hidden="true"` and `data-required-marker`, the shape the form renderer's `FormLabel` already uses, so it stays out of the name. It keeps the same colour and spacing. Every control keeps the required state it had before: the native `required` attribute, or `aria-required`. Validation does not change.

The `select` renderer's label is not associated with its trigger, so its name never contained the asterisk; its marker changes shape only. The generated-content utility these labels used is no longer compiled into `style.css`.

For test suites that render these fields: Testing Library's exact-string `getByLabelText('Title')` matches the label's whole text, and that text now includes the hidden `*`, so it no longer finds a required field. `getByRole('textbox', { name: 'Title' })` does, because it computes the accessible name.
