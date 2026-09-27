---
'@object-ui/types': patch
'@object-ui/app-shell': patch
---

fix(types,app-shell): three runtime strings no longer point at an objectui issue that answers 404

Two runtime descriptions in the published zod mirrors, `TreeViewSchema.nodes` and
`TextSchema.content`, and the Studio CEL authoring advisory that tells an author a row
predicate binds the row as `record` and nothing else, carried a pointer to an objectui
issue that answers 404. A reader of a zod `description` or of an editor warning has no
repository to resolve a commit against, so each dead pointer is dropped rather than
replaced (objectui#10803). `TreeViewSchema.nodes` loses it in two places: its parenthesis
now ends "no presence rule exists", and its history clause reads "the `data` fallback
spelling was retired". `TextSchema.content` likewise ends "its `value` fallback spelling
was retired".

Nothing else in any string moves, and no key, path, accept set, refusal or severity
changes: every document that parsed before parses the same way, and the advisory still
fires on exactly the same predicates.
