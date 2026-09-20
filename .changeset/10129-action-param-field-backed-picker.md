---
'@object-ui/app-shell': minor
'@object-ui/core': minor
'@object-ui/i18n': minor
---

A field-backed action param reaches its record picker, and a param whose backing
field cannot be read is refused instead of rendered as an empty text box
(objectui#10129).

An action declaring a `params` entry backed by a `lookup` field rendered as a bare
text input: no options, no typeahead, and no request for the referenced object on
the wire at all, because no picker was ever built. With the param `required`, the
action could not be launched from the UI — while the same field rendered a working
picker on a record form in the same build, off the same metadata.

`resolveActionParams()` resolves a field-backed param against the `objects` list
its caller holds, and two of the console's own callers cannot hold the right one:
`ConsoleShell`'s root action runtime — the provider that exists so a `type: 'flow'`
`action:button` works outside the four object views — passes no objects at all, and
`DeclaredActionsBar` passes exactly one (none when driven by an `actions` prop).
With the owner object absent the param took the resolver's last-resort shape, and
for a field-backed param that shape is `text`: it declares no inline `type`, so
there is nothing else to fall back to. The object binding was never missing from
the client — this seam never asked the metadata store for it.

- `useConsoleActionRuntime` now resolves field-backed params against the caller's
  objects UNIONED with the console metadata store's, caller first (`withKnownObjects`),
  after awaiting the object type so "this field does not exist" is an answer rather
  than a boot race. A draft/preview overlay the caller carries still wins.
- The degradation is no longer anonymous. `resolveActionParams()` stamps
  `unresolvedField: '<object>.<field>'` on a param whose backing field it could not
  find and says so in dev. This is the half that made the defect invisible for a
  whole version: by the time `paramToField()` sees such a param it IS a `text`
  param, so `paramDegradesWithoutTarget()` answered false, no "no reference target"
  warning fired, and even the "paste a record id" placeholder and help text did not
  apply.
- `ActionParamDialog` refuses such a param: it renders an alert naming the
  `<object>.<field>` pair in place of the control, logs one line per dialog opening
  in every build, and disables Confirm so the action cannot be launched with a value
  the dialog had no contract to collect.

New localized string `actionDialog.unresolvedParam` in all ten locale bundles. The
`<object>.<field>` locator renders as its own node rather than an interpolation, so
an identifier is never re-ordered by a translation.
