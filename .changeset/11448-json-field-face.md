---
'@object-ui/fields': patch
---

fix(fields): a `json` field edits as JSON — it shows the stored value as JSON text and saves the parsed value (objectui#11448)

`json` was aliased to `field:code`, the raw-text code editor. In the record Edit
dialog a stored object therefore showed as the literal text `[object Object]`, and
saving an edit sent the text as a **string**: `{"a":1}` was stored as `'{"a":1}'`,
silently changing the stored value's type. Unparsable text was saved as a string
too. The same alias reached the inline editors in the grid and the detail panel.

`json` now resolves to `field:object` — `ObjectField`, the JSON editor `object`,
`composite` and `record` already used — so one editor serves the four free-form
JSON types (`object`, `composite`, `record`, `json`). It shows the stored value as
`JSON.stringify(value, null, 2)` and saves `JSON.parse(text)`, and it carries every JSON value, not only objects: an array, a
number, a string, a boolean or `null`. The grid and detail-panel inline editors
keep editing `json` in place, now with the same face. `code` is unchanged: it stays
the raw-text editor and saves its text.

The action-parameter dialogs resolve a param's widget through the same alias
table, so a `json`-typed action parameter (or one backed by a `json` field) now
edits with the JSON editor too and **posts the parsed value instead of the text**
— `{ "a": 1 }` arrives as an object, no longer as the string `'{"a":1}'`. An
endpoint that parsed the text itself receives the value already parsed.

Three fixes to `ObjectField` itself come with it, so they also reach `object`,
`composite` and `record`:

- **An unparsable draft stays in the box.** The editor used to replace any text
  that did not parse with the stored value on every keystroke, so a value could not
  be typed one character at a time: in an empty field the first `{` vanished, and
  in a filled one the box snapped back to the last valid value while still saying
  "Invalid JSON".
- **A form will not submit unparsable text.** A refused draft never became a form
  value, so the form still held the last value that parsed and a save sent that
  stale value. The box now marks itself invalid through the browser's constraint
  validation, so the submit button is refused, the box is focused and its message
  is shown; nothing is sent until the text parses. The detail panel's inline save
  bar has no form element, so there the refusal stays the box's own message.
- **The read-only face prints a stored `0` or `false`** instead of the empty
  affordance, as the json table cell already did.

A record already saved as a string by the old editor now shows as a JSON string
literal (`"{\"a\":1}"`) rather than as `{"a":1}` — that is the value it holds.
Retyping it as JSON and saving stores the object.
