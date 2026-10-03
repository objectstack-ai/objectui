---
'@object-ui/plugin-detail': patch
---

`record:details` edit mode edits a `textarea` field in a multi-line textarea,
so saving it keeps its line breaks (objectui#11562).

Before, a `textarea` row on the record page edited in a one-line text input.
The browser strips line breaks from the value such an input is given, so a
stored note with blank lines or a trailing newline was shown flattened, and one
keystroke made the flattened text the value the Save wrote. Nothing warned.

The detail row now routes `textarea` to `TextAreaField`, the fields package's
multi-line widget: the one a `textarea` field already edits with in the record
form and in a data-grid cell, and the one a `markdown` row got in
objectui#11541. It hands the text back exactly as typed, blank lines and
trailing newline included. A single-line value saves the same as before.

Unchanged: `text`, `email`, `phone` and `url` rows still edit in the one-line
input, and a data-grid cell still edits `textarea` with the same widget it used
before.
