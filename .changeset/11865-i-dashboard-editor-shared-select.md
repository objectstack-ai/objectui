---
'@object-ui/plugin-designer': patch
---

The dashboard designer's widget property panel picks a widget's Type and Color Variant with the shared `Select`, and the designers' property panel (`PropertyEditor`) draws a `select` field with it too: the control the rest of the console picks with (objectui#11865, the dashboard designer's part of that card).

The three pickers were browser-native selects, so they looked and behaved differently from the console's other dropdowns. They now use the shared Radix `Select`: the same trigger, dropdown and keyboard behaviour.

What they write is unchanged. Each option hands the panel the same value as before: a type pick still writes `type`, a colour pick still writes `colorVariant`, and a `select` field still calls `onChange` with the field's name and the option's value, an option whose value is empty included. A type the widget door refuses the widget's measures under is still a disabled option and still writes nothing. Re-picking the current option writes nothing. The Type and Color Variant pickers keep the accessible name their labels gave the native selects; a `select` field's caption named no control before and names none now. Read-only disables the Type and Color Variant triggers in the shared `Select`'s own disabled look; `PropertyEditor` has no read-only state, as before.

One display change: a value none of a picker's options carries now shows as itself (a stored `area` type, a `metric-card` entry's type, a field value no option carries). The native select showed its first option instead ("KPI Metric", "Default"), which is not what the widget or the field holds. A `select` field with no value and no empty option shows nothing rather than its first option.

**Clause-②: no.** No published face moves: the package entry exports the same names, `DashboardEditorProps`, `PropertyEditorProps` and `PropertyField` take the same members, and no i18n key is added. What moves is the panels' own markup, described above: a test that drove one of these controls as a native select now picks through the trigger.
