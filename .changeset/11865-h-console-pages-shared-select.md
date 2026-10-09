---
'@object-ui/console': patch
---

The console's Public Forms, Flow Runs and Profile pages pick with the shared `Select`, the control the rest of the console picks with (objectui#11865, the console pages' part of that card).

Four pickers were browser-native selects, so they looked and behaved differently from the console's other dropdowns: on Public Forms, the FormView to publish and "After submit"; on Flow Runs, the flow to test; on Profile, the preferred language. They now use the shared Radix `Select`: the same trigger, dropdown and keyboard behaviour.

What they write is unchanged. Publishing saves the picked view as before, and "— Select a FormView —" still leaves nothing to publish. Each "After submit" option saves the same `submitBehavior` as before. The picked flow is still the one Run Flow executes and whose runs are listed. Each language saves the same `locale` as before, and "Use the deployment default" still saves `null`. Re-picking the current option writes nothing. Each picker keeps the accessible name it had: "FormView", "After submit" and "Preferred language" from their labels; the flow picker had no label and still has none. The language picker's read-only state is the shared control's disabled trigger.

One display change: a value none of a picker's options carries now shows as itself. The native select showed its first option instead, which is not what the page holds: for example, a flow picked before a Refresh that no longer lists it.

**Clause-②: no.** No published face moves: the console's package entry is unchanged, and no i18n key is added. What moves is these pages' own markup, described above.
