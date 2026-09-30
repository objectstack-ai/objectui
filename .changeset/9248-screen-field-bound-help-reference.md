---
'@object-ui/app-shell': patch
---

feat(app-shell): the screen-flow dialog renders a screen field's declared bound, help text and lookup target

`@objectstack/spec` gave a flow screen field three keys, each spelled as the
object field spells it: the numeric bound `min` / `max`, the help text
`inlineHelpText`, and the lookup target `reference`. The ruling that added them
made shipping them WITH their rendering its condition. The dialog read none of
them, so a declared bound, a declared help sentence and a declared lookup
target were all silently inert on screen.

The console's flow screen dialog (and the Studio screen preview, which shares
its renderer) now draws them:

- `min` / `max` go on a numeric input as its native bounds, and Submit refuses
  a value outside them with the field named, beside the `required` check. The
  comparison is the one the engine applies again when the run resumes:
  inclusive bounds, a present number only, so an empty optional field is never
  refused.
- `inlineHelpText` is drawn under the control and tied to it with
  `aria-describedby`. The placeholder is not used for it, because the browser
  clears the placeholder on the first keystroke.
- A `type: 'lookup'` field with a `reference` opens the same record picker the
  object form uses, listing that object's records through the data source the
  dialog already holds. A lookup with no `reference` (a run suspended before
  the key existed) keeps the plain input it always had.

A screen field declaring none of the keys renders exactly as before.
