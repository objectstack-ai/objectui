---
'@object-ui/types': patch
'@object-ui/app-shell': patch
---

fix(types,app-shell): runtime strings no longer point at objectui issues that answer 404

Four ADR-0049 retirement tombstones in the published zod mirrors, two runtime descriptions
and the Studio CEL authoring advisory carried a pointer to an objectui issue that answers
404. A reader of a parse error, a zod `description` or an editor warning has no repository
to resolve a commit against, so each dead pointer is dropped rather than replaced
(objectui#10803).

- **The tombstone guidance.** Each tombstone's ONE guidance string feeds both the parse
  error an author reads and the `.describe()` text, and now opens `RETIRED (ADR-0049) —` in
  place of the dead card: `TreeViewSchema.data`, `TextSchema.value` and
  `ChartDataSeriesSchema.data`. `DashboardConfigSchema.aria` (its error and its describe
  text) now opens `RETIRED —` with no parenthetical, because its TypeScript twin on
  `DashboardConfig` does not name ADR-0049. Everything after the dash is unchanged, so
  the remedy each message gives is word for word what it was.
- **Two descriptions.** `TreeViewSchema.nodes` loses the pointer in two places: its
  parenthesis now ends "no presence rule exists", and its history clause reads "the
  `data` fallback spelling was retired". `TextSchema.content` likewise ends "its `value`
  fallback spelling was retired".
- **The advisory** that tells an author a row predicate binds the row as `record` and
  nothing else ends that clause at "nothing else".

Nothing else in any string moves, and no key, path, issue code, accept set, refusal or
severity changes: every document that parsed before parses the same way and is refused
at the same path with the same code, and the advisory still fires on exactly the same
predicates.
