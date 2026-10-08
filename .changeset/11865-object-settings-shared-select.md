---
'@object-ui/app-shell': patch
---

Studio's object Settings tab picks the sharing model, the external sharing model, the name field, the lifecycle field and the next highlight field with the shared `Select`, the control Studio's validation rule editor already picks with (objectui#11865, the object settings part of that card).

The five pickers were browser-native selects, so they looked and behaved differently from Studio's other dropdowns. They now use the shared Radix `Select`: the same trigger, dropdown and keyboard behaviour.

What they write is unchanged. Each option writes the same patch as before, key for key: "not set", "auto-derived" and "auto-detect" still clear their key, "None" on the lifecycle field still writes `stageField: false`, and "+ Add field…" still writes nothing. Re-picking the current option writes nothing. Each labelled picker keeps the accessible name its label gave the native select.

On a read-only package the four pickers are disabled and wear the shared control's own disabled look (objectui#11781), and the "add field" picker is not shown, as before.

One display change: an object whose stored value is not among a picker's options now shows that value. This happens, for example, when the name field names a field that has been removed, or the lifecycle field names one that is not a select field. The native select showed its first option instead ("not set", "auto-derived" or "auto-detect"), which is not what the object says.

**Clause-②: no.** No published face moves: `ObjectSettingsPanel` takes the same props, the package entry exports the same names, and no i18n key is added. What moves is the panel's own markup, described above.
