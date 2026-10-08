---
'@object-ui/app-shell': patch
---

Studio's validation rule editor picks a rule's type, field, built-in format and severity with the shared `Select`, the control the condition builder beside them already uses (objectui#11865, the validation editor's part of that card).

The four pickers were browser-native selects, so they looked and behaved differently from the condition builder's dropdowns in the same editor. They now use the shared Radix `Select`: the same trigger, dropdown and keyboard behaviour.

What they write is unchanged. Each option writes the same rule as before, key for key: a type switch still reseeds the rule, "pick a field" still writes an empty `field`, and the format's "none" still clears `format`. Re-picking the current option writes nothing. Each picker keeps the accessible name its caption gave the native select.

On a read-only package each picker is disabled and wears the shared control's own disabled look (objectui#11781).

One display change: a rule whose stored value is not among a picker's options now shows that value. This happens, for example, when a rule's field has been removed from the object. The native select showed its first option instead ("pick a field", "none", or "error"), which is not what the rule says.

**Clause-②: no.** No published face moves: `ObjectValidationsPanel` takes the same props, the package entry exports the same names, and no i18n key is added. What moves is the editor's own markup, described above.
