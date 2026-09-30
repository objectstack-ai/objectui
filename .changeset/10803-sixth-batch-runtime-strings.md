---
'@object-ui/types': patch
---

fix(types): `InputSchema.wrapperClass`'s description no longer points at an objectui issue that answers 404

The zod `.describe()` text of `InputSchema.wrapperClass` ended with a pointer to an
objectui issue that answers 404. A reader of a zod `description` has no repository to
resolve a commit against, so the pointer is dropped rather than replaced: the description
now reads "Classes on the wrapper div around the input and its label" (objectui#10803).

Nothing else in the string moves, and no key, path, issue code, accept set, refusal or
severity changes: every document that parsed before parses the same way and is refused at
the same path with the same code.
