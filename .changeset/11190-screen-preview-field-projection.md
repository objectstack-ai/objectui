---
'@object-ui/app-shell': patch
---

fix(app-shell): the Studio flow screen preview draws a screen field's `options`, `placeholder` and `defaultValue` as the runtime dialog does

The screen preview renders through the same `ScreenView` the flow runner
uses, but it builds the screen from the node's authored config first, and
that step dropped a field's `options`, `placeholder` and `defaultValue`. So a
`select` field showed as a plain text box, a placeholder never showed, and a
default never seeded the control, although the preview's header promises the
screen "exactly as the end user will see it at runtime".

The step is now keyed by the spec's own `ScreenFieldSpec` type, so every key
the runtime renderer reads reaches it, and a key the spec adds later fails the
package's type-check until the preview carries it.

A `defaultValue` holding a `{…}` reference is shown as written, since the
preview has no run to fill it in from, and a hint line under the form names
each such field with its template. A default without a reference seeds the
control as the runtime does, with no hint. A field that declares none of
these keys renders as before.
