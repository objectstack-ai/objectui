---
'@object-ui/app-shell': patch
---

fix(app-shell): the flow designer's Debug run leaves every node, gates screen fields and renders template tokens the way the runtime does

**Routing.** The Debug run chose a node's successors by its own rules: a decision took
its first true guard or its default and never an edge with no condition, and every other
node took all of its out-edges without reading their conditions. The runtime's
`traverseNext` has one rule for every node, so the Debug run showed paths a real run
would not take. It now leaves every node the runtime's way:

- An out-edge with a `condition` is guarded. It is taken when the guard is true, and a
  guard that is refused or fails stops the run on that node, whatever the node is.
- An `isDefault` edge with no condition is taken only when no guard was true. An edge
  with both `isDefault` and a `condition` is guarded: the condition wins, as at runtime.
- Every other out-edge is always taken, a decision's included. A decision with an edge
  that has no condition and a default edge now takes both when no guard is true; it used
  to report "Branch has no condition." and take only the default.
- A node that takes nothing ends its branch, and the run completes, as a real run does.
  It used to fail the run with "No branch matched and there is no default branch."
- A `fault` edge is never walked as an ordinary successor. What a fault edge does when a
  node fails is still not modelled: the Debug run stops there.
- A decision that declares `config.conditions` picks the first entry whose `expression`
  is true (CEL, as the runtime evaluates it) and takes only the out-edges labelled with
  that entry's `label`. When none is true the branch is `default`, which an out-edge
  labelled `default` or the `isDefault` edge claims; when no out-edge claims the branch,
  every out-edge is considered and the step says so, as the runtime logs it. The Debug
  run used to ignore `config.conditions`.
- An approval resumed with a decision goes through the same rules on the out-edges that
  decision's label selects.
- Kept: when several guards are true the first is taken. The runtime takes every true
  one; objectstack#15429 is pending.

**Screen fields.** A screen field's `visibleWhen`, in the Studio screen preview and at the
Debug run's screen pause, was evaluated on `@object-ui/core`'s expression evaluator, which
is not CEL, and a predicate it could not evaluate left the field shown. It now goes
through the same CEL call as the edge guards, over the same variables (bare names,
`vars.*`, `record.*`): `size(tags) > 0` with an empty `tags` and `vars.n == 2` with
`n = 3` now hide the field. A predicate that cannot be evaluated (a variable that is not
set, a CEL error) hides the field, which is how the runtime reads it when a screen is
resumed; the Debug run's screen step names each field hidden that way. A `{var}` brace
is no longer rewritten to a bare name: `registerFlow` refuses it in this bare-CEL slot,
so the field is hidden. A non-string `visibleWhen` is refused the same way.

**Template tokens.** A `NOW()`, `$User.*`, function or arithmetic token inside a longer
string rendered as `''`, so `'at {NOW()}'` became `'at '` where the runtime writes the
time. The Debug run still does not model these tokens; it now keeps them as written,
inside a longer string as for a whole token, and the assignment step names each one.
