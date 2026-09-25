---
'@object-ui/components': patch
'@object-ui/i18n': patch
---

The record form now tells the user when a `visibleWhen` transition clears a field
(objectui#8070, ruling letter A).

Since objectui#6958 a field whose own `visibleWhen` / `visibleOn` turns it
invisible while it holds a value has that value cleared, so the server does not
refuse the row over a column that is no longer on screen. That clear was silent:
the field disappeared and nothing said a stored value went with it. The ruling
on objectui#8070 ports the naming half of the objectui#6499 ruling to this
surface, and the clear itself is unchanged.

- When a transition clears one or more fields, the form raises one notice that
  names them by the labels the form draws, joined by the locale's
  `validation.formInvalidJoiner`, and says they no longer apply given the
  current values. A field that was already empty is not named (an unchecked
  two-state control counts as empty), and neither is the first render of a
  record, which only records the baseline.
- The notice is published under the form's outcome-toast id. A later submit
  refusal replaces it, and the next attempt that passes client validation
  dismisses it, like the form's other outcome messages.
- When a clear hides a second field whose `visibleWhen` reads the field just
  cleared, the notice names both. Any edit in between starts a new list.
- `@object-ui/i18n` adds one key, `form.clearedOnHide`, to all ten packs. The
  form's built-in fallback table carries its `en` text for a form rendered
  without an `I18nProvider`.
