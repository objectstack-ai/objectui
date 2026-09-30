---
'@object-ui/types': patch
---

fix(types): four more runtime strings no longer point at objectui issues that answer 404

Two ADR-0049 retirement tombstones in the published zod mirrors and two runtime
descriptions carried a pointer to an objectui issue that answers 404. A reader of a parse
error or a zod `description` has no repository to resolve a commit against, so no dead
pointer becomes a commit: the tombstones cite `ADR-0049` in its place, and the two
description pointers are simply dropped (objectui#10803).

- **The tombstone guidance.** The legacy `ActionSchema`'s `onSuccess` and `onFailure`
  tombstones feed both the parse error an author reads and the `.describe()` text, and
  each now opens `RETIRED (ADR-0049) —` in place of the dead card. Everything after the
  dash is unchanged, so the remedy each message gives is word for word what it was.
- **Two descriptions.** `DataTableSchema.rowActions` now ends "mirrors the boolean the
  renderer truthiness-tests", and `DataTableSchema.cellClassName` ends "so row density has
  to be set on both".

Nothing else in any string moves, and no key, path, issue code, accept set, refusal or
severity changes: every document that parsed before parses the same way and is refused at
the same path with the same code.
