---
'@object-ui/app-shell': minor
---

The screen-flow runner reads the three `flows` translation keys `@objectstack/spec` added for a flow's option labels and its own toasts (objectui#12075, the console half of objectstack#22507).

- **Option labels.** A select on a flow screen shows each option's label from `flows.FLOW.screens.NODE.fields.FIELD.options.VALUE` in the active language, through the spec's `resolveFlowScreenFieldOptions`. An option the bundle does not address keeps its authored label.
- **The flow's own toasts.** The flow's `successMessage` and `errorMessage` are shown from `flows.FLOW.successMessage` / `flows.FLOW.errorMessage` when the bundle carries them, through the spec's `translateFlow`. This holds for a run that pauses on a screen and completes in the runner, and for a run that goes straight through or fails when it is launched from a list or record page. A bundle never adds a toast the flow does not author, and the engine's own failure text is still shown as sent.
- **The screen heading is shown as served.** The engine now serves a screen's heading and body text already translated in the run's locale (objectstack#22507, ruling A), so the runner no longer overlays the bundle's `title` on it.
- **A select binds the option's own value.** A screen field whose options carry number or boolean values used to resume the run with the option's value as text (`"2"`, `"false"`). It now resumes with the declared value (`2`, `false`), and a number-valued default shows as its option.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
