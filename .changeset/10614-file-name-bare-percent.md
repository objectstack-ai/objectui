---
'@object-ui/fields': patch
---

fix(fields): a file URL whose last segment holds a bare `%` renders, named by its raw segment (objectui#10614)

`readFileValue` names a file value that carries no name of its own after the last
segment of its URL, decoded with `decodeURIComponent`. A segment that is not a
valid percent-encoding (`https://cdn.example.com/100%.png`, or
`{ url: 'https://cdn.example.com/a%zz.pdf' }`) made that decode throw
`URIError: URI malformed`, and the throw left `readFileValue` during render.
`FileValueSchema.url` is a plain string, so such a value passes the contract.

What a user saw: every face that reads the value (the `file`, `image` and
`signature` cells, `FileField`, `FileCell`, `ImageField`, and a gallery's cover)
threw while rendering. Under `SchemaRenderer` the nearest error boundary caught it,
so one such value replaced a whole grid table, valid rows included, or a whole
gallery with the "failed to render" panel.

The decode is now guarded once, in the one helper that performs it: on `URIError`
the name is the raw segment (`100%.png`, `a%zz.pdf`). A valid escape decodes as
before (`report%20q3.pdf` is named `report q3.pdf`), and a value that carries its
own `name` or `original_name` is unaffected.
