---
'@object-ui/app-shell': patch
---

fix(app-shell): the dashboard designer's preview canvas and the flow Debug run read the designer locale (objectui#10835)

Under zh-CN these designer words stayed English beside Chinese headings:

- the dashboard preview canvas: the empty-canvas message, the hint under a widget
  that fails to render, the loading text, and the selected-widget strip (its
  "Selected" chip, the rename tooltip, the untitled fallback and the save, rename
  and clear-selection buttons' accessible names);
- the flow Debug run: every note and error sentence the simulator itself writes on a step (a wait, a
  screen with or without inputs, an approval and its decision, a decision branch,
  an assignment's unmodelled tokens, a loop, a mocked call, an unsupported node,
  the end, and the routing notes), each step's status chip, and an out-edge's
  error result. A screen step that names a field whose `visibleWhen` refers to
  something that is not a field on the screen now gives that reason in the same
  words the flow inspector's note uses.

Each new en row is the English the literal carried, so en renders unchanged. A
widget's stored title (a new widget's default `New TYPE` title included) is author
data and shows as written in every locale. Node labels, ids and types, branch
labels, CEL sources, a guard's `true` / `false` value, and the parse and shape
refusals that `@objectstack/formula` and `@objectstack/spec` write still pass
through as they are. The frames the Debug run's CEL evaluation puts around such a refusal — "condition failed to evaluate as CEL: ", "CEL evaluation failed: " and the "Evaluation failed." fallback, written by flow-sim-validate — and the default edge's else keyword stay English under zh-CN; they are outside this change.
