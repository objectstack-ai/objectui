---
'@object-ui/app-shell': patch
---

Studio's *Explain access* panel picks the object and the operation with the shared `Select`, the control Studio's validation rule editor already picks with (objectui#11865, the *Explain access* part of that card).

The two pickers were browser-native selects, so they looked and behaved differently from Studio's other dropdowns. They now use the shared Radix `Select`: the same trigger, dropdown and keyboard behaviour. In the object list, typing an object's leading letters jumps to it.

What they set is unchanged. Each option makes Explain send the same request as before: an object sends its name, an operation sends its name, and "Select an object…" leaves Explain disabled until an object is picked. Re-picking the current option changes nothing. Each picker keeps the accessible name its label gave the native select.

One display change: when the object the panel holds is not one of the package's objects, the object picker now shows that object. The native select showed "Select an object…" instead, while Explain still asked about the held object.

Unchanged: without a package's object list the object is still a free-text input, and the user picker, the record selector and the explain request itself are untouched.

**Clause-②: no.** No published face moves: `AccessExplainPanel` takes the same props, the package entry exports the same names, and no i18n key is added. What moves is the panel's own markup, described above.
