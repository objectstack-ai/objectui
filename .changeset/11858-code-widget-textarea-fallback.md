---
'@object-ui/app-shell': patch
---

Metadata-form code fields stay editable when Monaco cannot load (objectui#11858).

Monaco's core is fetched from a public CDN. On an install that cannot reach it (no public egress, or a Content-Security-Policy that blocks it), every field a metadata form renders through its `code` widget sat on Monaco's "Loading..." with nothing editable, a hook's handler body on the hook edit page among them. Each of those editors also logged its own Monaco initialization error, and the page reported an uncaught error. A field's `visibleWhen`, `readonlyWhen` and `requiredWhen`, and a hook's run `condition`, were not affected: those rows render the condition builder.

The `code` widget now reads the same one-per-page loader check that the JSON source tab and the html/react page source editor already use (objectui#11800). When the loader fails, the widget renders a plain textarea, read-only when the field is. The textarea writes the same value the editor writes: a string, or the expression envelope for an expression row, keeping its `dialect` and `meta`. The failure is reported once per page, as one console line that names the loader URL. Nothing escapes as an uncaught error. Monaco itself is mounted only after the check succeeds. While the check is pending, the widget shows its existing "Loading editor…" placeholder. If the check has not answered, or Monaco has painted nothing, by the end of the grace period the source editors use, the widget falls back to the textarea the same way. Where the CDN is reachable, Monaco loads as before.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
