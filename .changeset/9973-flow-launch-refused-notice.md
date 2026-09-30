---
'@object-ui/app-shell': patch
---

A flow launched from an action that ends with `outcome: 'refused'` without ever pausing at a
screen now shows its refusal instead of reporting success (objectui#9973).

Such a run never opens `FlowRunner`, so the Close-only refusal notice `FlowRunner` shows for a
paused run (objectui#7707) never applied to it. The two console launch handlers — the one
behind list actions and the one behind record-page actions — branched only on a failed run and
a paused run, so a refused run fell into their terminal-success path. The action toasted its
`successMessage`, the view refreshed its data, and the sentence the engine rendered for the
refusal never reached the screen.

For a launch that ends `refused`, now:

- A notice titled with the action's label shows the engine-rendered sentence as a plain
  (non-destructive) alert, passed through verbatim and untranslated, with a single **Close**.
- The action's `successMessage` toast is suppressed: the handler returns
  `{ success: true, silent: true }`, the same result a paused launch returns.
- The data is not refreshed. The run wrote nothing.

If the refusal sentence is empty, the notice keeps its title and its Close, with no invented
text. Completed, failed and paused launches behave exactly as before. Both launch handlers now
act on one shared decision, so the two routes cannot drift apart again.
