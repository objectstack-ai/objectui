---
'@object-ui/app-shell': patch
---

fix(app-shell): the flow designer's Debug run evaluates edge guards as CEL and interpolates nested assignment values, as the runtime does

**Guards.** A decision's edge guards ran on `@object-ui/core`'s expression evaluator,
which is not CEL. The runtime evaluates them on `@objectstack/formula`'s CEL engine, so
the Debug run could take a different branch than a real run:
`size(rows) > 0` failed with `"size" is not a function` and took the default branch,
`n == "2"` was true for `n = 2`, `7 / 2` was `3.5`, and `vars.n` / `record.n` were not
defined while `data.n` was.

- A guard is now evaluated on the same engine and variable scope the Debug run already
  uses for an assignment's CEL value envelope: bare names, `vars.*` and `record.*`,
  dotted keys nested, no `data` root. A value counts as true when it is truthy, as at
  runtime.
- A guard the runtime refuses or cannot evaluate stops the run on the decision, with the
  error, and no branch is taken, the default included. A CEL fault fails the run there
  at runtime; a refused guard is refused at registration, before any node runs.
  That covers a CEL error on the live values (an unknown variable, `data.n`), a guard
  that does not parse as CEL (a `{var}` or `${…}` template), an envelope in a dialect
  other than `cel`, a blank guard, and a value that is not a condition shape (a
  boolean). Before, the Debug run recorded the error on the edge and took the default
  branch.
- A guard shape the edge's `condition` schema refuses is refused too: an empty string,
  an envelope with an empty or missing `source` (`{ dialect: 'cel', source: '' }`, an
  `ast`-only envelope) and `null`, which used to read as "no condition" and take the
  default branch, and an envelope with no `dialect` (`{ source: 'n == 2' }`), which used
  to be evaluated and take its branch. The installed spec 17.4.0 admits an `ast`-only
  envelope and a whitespace-only guard at parse; objectstack main refuses both, and the
  Debug run follows main.
- Unchanged: an edge whose condition is omitted is still reported as "Branch has no
  condition." and not taken, and when several guards are true the Debug run still takes
  the first.

**Assignments.** A `{token}` inside a nested object or array value of an `assignments`
map was left as written. The Debug run now interpolates values the way the runtime's
`interpolate` does:

- arrays and plain objects are walked, property values interpolated, keys not;
- a whole-token string keeps the token's type (`'{n}'` gives `2`), and a token naming no
  variable gives `undefined` (it used to stay as the literal `'{missing}'`);
- a token inside a longer string gives `''` for no value and JSON for an object;
- `{order.amount}` walks into an object variable and `{list.1}` indexes an array.

The runtime's `NOW()` / `TODAY()`, `$User.*`, function and arithmetic tokens are not
modelled; a whole-token string holding one is kept as written. Inside a longer string
such a token renders as `''`, as it did before; the runtime renders its value.
