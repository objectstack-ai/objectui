---
'@object-ui/app-shell': minor
---

`FlowRunner`: a run that ended with `outcome: 'refused'` renders as a Close-only notice
(objectui#7707 — lane 3 of the maintainer ruling on objectstack#14945, decision batch #42;
the contract lane is objectstack#14945 and the engine lane objectstack#15788).

A flow can now end by saying **no**: an `end` node declaring `outcome: 'refused'` carries a
`message` template the engine interpolates per-record, and the run records the terminal
status `refused` — distinct from `failed`, because nothing went wrong. Until now the console
had no branch for it: `interpretFlowResponse` classified a refused run as terminal success,
so the runner fired `Flow "…" completed` and closed, and the authored refusal never reached
the screen at all.

What changes, for a `refused` terminal only:

- The engine-rendered sentence is shown inside the dialog as a plain (non-destructive)
  notice — it is the flow working, not a failure — passed through verbatim and
  untranslated, the same way the server's own refusal prose already is.
- Submit is withdrawn and a single **Close** is offered. A refused end is terminal and is
  never resumed, so an affordance that could only reach "No suspended run" is not on offer.
  An `object-form` step drops `showSubmit` and its Cancel reads Close, by the same route a
  terminal failure already takes.
- No toast of either colour, no completion callback, no data invalidation. The run did not
  complete, and nothing failed.

`completed` runs are untouched: they still render Cancel + Submit and still toast
`Flow "…" completed`. The invoking action stays quiet on its own account exactly as before —
a paused run returns `{ success: true, silent: true }` and `silent` suppresses the action's
`successMessage` at the runner's toast sink. That behaviour was already correct and is now
pinned rather than changed.
