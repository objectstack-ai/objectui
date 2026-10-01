---
'@object-ui/app-shell': patch
---

fix(app-shell): a refused metadata save shows the server's message and field path on every transport

When the server refused a metadata save, the Studio editor read the raw response
body instead of the error `MetadataClient` had already parsed. That raw read
understood only the REST server's shape (`error` a string, `issues` at the top
level). On the HTTP dispatcher's shape (`error` an object, `issues` under
`error.details.issues`) it found no issues and fell back to printing the error
object itself:

- `MetadataResourceEditPage`, spec refusal (422 / `INVALID_METADATA`): the banner
  read `[object Object]` and the Save button's title read "fix  before saving.",
  with the field left out;
- `MetadataResourceEditPage`, destructive change (409 `DESTRUCTIVE_CHANGE`): the
  confirmation dialog opened with an empty list of what would be lost;
- the embedded-item editor (a field inside an object): the banner read
  "Validation failed (0 issues)." and no field was marked.

All three now read `err.issues`, `err.message` and `err.code` from the parsed
`MetadataError`, which carries both shapes. On either transport the author sees
the server's own message against the field it names. The REST shape behaves as
before, and so does a refusal that is not a validation error.
