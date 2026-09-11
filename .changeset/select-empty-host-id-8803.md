---
'@object-ui/fields': patch
'@object-ui/components': patch
---

fix(fields): a zero-option `field:select` keeps its label association

A registered `field:select` whose option list resolved empty rendered the
shared `OptionsEmptyState` box and returned before its DOM pass-through, so the
host's `…-form-item` id reached no element at all and the visible label's `for`
DANGLED. Measured on a real form: `HTMLLabelElement.control` was `null`, the
rendered `<FormDescription>` had zero consumers, and `getByLabelText` threw
"however no form control was found associated to that label" — an error that
reads like a broken renderer against a correctly rendered empty state.

The widget declares `labelling: 'control'`, which the registry defines as "the
component's outermost rendered element is a LABELABLE HTML element". That is
true of the Radix `button[role="combobox"]` it renders with options and was
false of the `div` it rendered without them. The zero-option box is now an
`<output>` — labelable, and a role that claims no interactivity — carrying the
host id and `aria-describedby`. The label's `for` resolves, the box is named by
the label and described by the help text, and nothing on the host side moved.

Landing the id on the `div` instead was measured and rejected: `for` may only
reference a labelable element, so the pointer stopped dangling while the label
stayed exactly as unusable. Declaring `select` as `labelling: 'group'` was also
measured and rejected: it moved the LIVE path (a select WITH options lost its
working `<label for>` to the combobox) and still left the zero-option branch
with no association.

Breaking-ness: none intended, and none published — the repaired surface is the
rendered element of one widget state. Apps or tests selecting that box by its
`data-testid` are unaffected; any that asserted the literal `div` tag name will
see an `<output>`.
