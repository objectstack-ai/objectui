---
'@object-ui/app-shell': patch
---

Five of the Studio design surface's pickers use the shared `Select`, the control the rest of Studio picks with (objectui#11865, the design surface's part of that card): in the navigation editor's item inspector, *Link object*, the target picker of a page, dashboard, report, action, component or doc entry (its *Doc page* and *Book* included) and a URL entry's *Open in*; in *New object*, the record sharing (OWD) choice; and in *New automation*, the trigger under *Advanced*.

The five were browser-native selects, so they looked and behaved differently from Studio's other dropdowns. They now use the shared Radix `Select`: the same trigger, dropdown and keyboard behaviour.

What they write is unchanged. Each object, target and *Open in* choice writes the same navigation entry as before, and "Choose" still unbinds the entry by removing its target key. Each record sharing choice saves the same `sharingModel` on the new object's draft, and each trigger saves the same Start node on the new flow, "Choose later on the Start node" still saving none. Re-picking the shown option writes nothing. Each picker keeps the name its label gave the native select; *Link object* had none and has none. None of the five has a read-only state: a read-only package closes navigation editing and offers neither *New* entry, as before.

One display change: an entry whose object, or whose *Open in*, is a value the picker does not offer now shows that value, listed first. The native select showed "Choose object" or "Same tab" instead, which is not what the entry holds.

**Clause-②: no.** No published face moves: the package entry exports the same names, the surface's components take the same props, and no i18n key is added. What moves is the five controls' own markup, described above.
