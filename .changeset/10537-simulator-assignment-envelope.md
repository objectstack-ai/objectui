---
'@object-ui/app-shell': patch
---

fix(app-shell): the flow designer's Debug run evaluates an assignment's CEL value envelope, as the runtime does

An `assignment` node's `assignments` map value may be the CEL value envelope
`{ dialect: 'cel', source }`, the form the Assignments editor's "Write as a CEL
expression" toggle stores. The runtime evaluates it to a value. The Debug run used to
write the envelope object itself into the variable and report the step as done, so
`{ n: 2, doubled: { dialect: 'cel', source: 'n * 2' } }` left `doubled` holding the
object where the runtime gives `4`.

- The Debug run now evaluates the envelope on the runtime's CEL engine
  (`@objectstack/formula`), against the runtime's variable scope: bare names, `vars.*`
  and `record.*`, with dotted keys nested. So `4` comes back, and the CEL stdlib
  (`joinNonEmpty(rows.map(r, r.subject), ", ")`) computes.
- An envelope that fails (a CEL error, a dialect other than `cel`, a missing or blank
  `source`) is not written. The step shows the error and the run stops on that node,
  as it fails at runtime.
- Unchanged: `{token}` strings still interpolate, numbers and plain objects are still
  written as they are, and an envelope-shaped object in the legacy
  `assignments: [{ variable, value }]` array or in a bare config is still the literal
  object, as it is at runtime.
