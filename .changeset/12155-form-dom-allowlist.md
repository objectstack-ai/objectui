---
'@object-ui/components': patch
---

A form field's own `defaultValue` is no longer drawn in its control, so the form never shows a value it does not save (objectui#12155).

The `form` renderer draws a field whose type no `field:` widget claims through its built-in branches (`input`, `textarea`, `checkbox`, `switch`, `select`) and the unregistered-widget default. Each one put the field entry's leftover keys on its native control, minus a list of keys to drop, so a key nobody reads still reached the DOM:

- A field-level `defaultValue` showed in a `textarea` field, and in a field of any type that falls to the default, while the submitted payload carried no value for the field. On an `input` field with `inputType: 'file'` it made the whole form fail to render, because a file input refuses a preset value.
- A field-level `defaultChecked` checked the hidden input behind a `checkbox` or `switch`, while the visible box stayed unchecked and the field submitted `false`.
- Any other key the entry carried (a misspelling included) reached the element as an attribute.

The built-in branches now put on their control only the form-control allowlist the library's other form controls already use (`id`, `className`, `role`, `tabIndex`, `autoFocus`, `name`, `disabled`, the click, focus and blur handlers, `aria-*` and `data-*`), the form's value and change handler, and the native attributes a reader names for that control: `min`, `max`, `step`, `minLength`, `pattern`, `multiple` and `accept` on an input, `rows` and `minLength` on a textarea, and `maxLength` and `placeholder` as before. A field-level `defaultValue` or `defaultChecked` is neither drawn nor submitted. A form's initial values are `FormSchema.defaultValues`, keyed by field name.
