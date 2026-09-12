---
'@object-ui/data-objectstack': minor
'@object-ui/app-shell': minor
'@object-ui/plugin-designer': minor
---

Apply the object-metadata write invariant at the write DOORS instead of at the writers.

objectui#7714 ruled that a half-filled relationship stays client-side and the PUT body never
carries one without a non-empty `reference`, and implemented that ruling by naming the two
writers it knew of. objectui#8057 reproduced the identical defect on a third; a sweep found
nine more. The doors — the three places in this repo that actually PUT `/meta/:type/:name` —
now apply the invariant themselves, so every writer is covered without any list of writers
existing anywhere, and a new door is caught by a gate that derives the door set from the
tree rather than restating it.

Behaviour change for consumers: `MetadataClient.save('object', …)` now throws BEFORE issuing
the request when the body carries a relationship field with a missing, empty or whitespace-only
`reference`. The same document is refused by the server with a 422 on `fields.NAME.reference`,
so nothing that previously succeeded now fails — the refusal moves earlier, names the field,
and leaves the draft in the client instead of wedging every later save of that object. Writes
of every other metadata type are untouched.

New export from `@object-ui/data-objectstack`: `assertObjectMetadataWritable`,
`RELATIONSHIP_TYPES_REQUIRING_REFERENCE` and `OBJECT_METADATA_TYPE`.
