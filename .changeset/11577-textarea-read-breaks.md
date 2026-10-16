---
'@object-ui/plugin-detail': patch
---

fix(plugin-detail): `record:details` read mode shows a `textarea` value with its line breaks (objectui#11577)

A multi-line `textarea` value, such as a note with a blank line in it, read as one line on the record page: the details body drew every `textarea` value with the grid's one-line cell, which folds line breaks into spaces and cuts a long value off with an ellipsis. The record form's read-only field and, since objectui#11562, the inline editor already kept the breaks.

The details body now draws a `textarea` value with the fields package's own read display, the read-only branch of `TextAreaField`, which is the display the record form uses. Line breaks, blank lines and a trailing newline show as stored. A single-line value reads as the same line; a long one now wraps at the column width instead of ending in an ellipsis. Other field types, plain text included, render exactly as before, and grid cells keep their one-line display.
