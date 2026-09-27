---
'@object-ui/app-shell': patch
---

fix(app-shell): the Studio screen preview and the Debug run decide a screen field's `visibleWhen` live, through the flow runner's own renderer, over the screen's declared fields

**What was wrong.** The Studio's screen preview (`ScreenPreview`) and the Debug run's screen
pause judged each field's `visibleWhen` once, up front, against the run's variables — the
reading the runtime's resume door takes when a screen is resumed — dropped every field they
judged hidden and stripped the predicate from the ones they kept. A predicate over a sibling
screen field, the only shape any shipped producer writes (`createOpportunity == true` in the
flows guide, `discount > 0` in the console sample), names a value the run does not hold at
the pause, so the field was judged hidden and stayed hidden however the author ticked or
typed: the preview's checkbox changed state and nothing appeared. Where the flow's own
variable of the same name was declared `false`, as the guide recommends, the field was judged
`false` and frozen just the same. Measured through the real `FlowSimulator` and
`ScreenPreview` on both sample shapes, with a no-predicate field as the control.

**What changed.** The spec declares the contract: `ScreenFieldSpec.visibleWhen` is "bare CEL
over the screen's own field names", "evaluated by the CLIENT against the screen's live
collected values — not by the server". The Studio now follows it with one client evaluator:

- `buildScreenSpec` keeps every authored field and carries its `visibleWhen` raw, as the
  runtime `screen` executor sends it to the client. `ScreenView` — the renderer the flow
  runner uses — decides it live over the screen's declared fields and the values being
  collected, so ticking the sibling checkbox or typing a discount above zero reveals the
  field in the preview exactly as it does for the end user, and the "N fields hidden by
  their visible when condition" hint follows the values.
- The Studio no longer has an evaluator of its own for this key: `isFieldVisibleWhen`,
  `fieldVisibility` and the simulator's `evalVisibleWhen` are removed. `buildScreenSpec`
  takes no `variables`; `hiddenFieldCount` takes the built spec and the collected values.
- The Debug run's screen step judges SCOPE, never value: `unevaluableVisibleWhen` names, as
  an error on the paused step, a field whose predicate references an identifier that is not
  a field declared on this screen (a run variable such as `needsApproval == true`, the
  runtime's `vars.*` root), does not parse as CEL (a `{var}` brace), or is a shape
  `registerFlow` refuses — with the nearest declared field where one is close. A predicate
  over a sibling field (`discount > 0`, `record.discount > 0`) is not reported; it used to
  be named as "hidden because it could not be evaluated".
- `ScreenView` exports `screenPredicateScope`, unchanged, so the Studio reads the roots a
  predicate may name off the renderer's own scope instead of restating them.

**What did not change.** Whether the renderer shows or hides a predicate it cannot evaluate
is `ScreenView`'s fallback and objectui#8069's open question; the Studio now renders through
that fallback and rules no direction of its own. The runner (`ScreenView`, `FlowRunner`) has
no behaviour change.

**The server side.** The runtime's resume door (`refuseInvalidScreenInput` in
`@objectstack/service-automation`) still evaluates `visibleWhen` over the run's variables
with the submitted values layered on top; narrowing it to the declared scope, and refusing
an undeclared identifier at `registerFlow` and `objectstack validate`, is
objectstack-ai/objectstack#20178 and is not on objectstack main at this change. Until it
lands, a predicate over a run variable is an error in the Studio and shown by the runner,
while the server waives its `required`.
