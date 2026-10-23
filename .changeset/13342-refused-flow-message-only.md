---
'@object-ui/app-shell': patch
---

A screen flow that ends refused shows its message and Close alone (objectui#13342).

When a screen-flow run ends with `outcome: 'refused'`, the dialog used to keep the screen the run had paused on under the refusal: its input fields stayed visible and editable, though a refused run is never resumed and nothing would submit them. The dialog now shows the flow's name, the step's heading, the refusal message and Close, with no screen fields. An `object-form` step, whose Close lived in the form's own button bar, gets the runner's Close instead, and the dialog takes its narrow width.

A screen still waiting for input renders as before, and a run that fails keeps its screen and the typed values under the reason.
