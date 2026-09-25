---
'@object-ui/core': minor
---

**BREAKING:** `@object-ui/core` no longer exports `DataScopeManager` or the
row-level filter vocabulary that came with it (objectui#7750). This narrows the
package's published surface. It is declared `minor`, not `major`, because this
fixed release group follows the `@objectstack` major (AGENTS.md §9); the
breaking change is stated here instead.

Removed, with no replacement and no deprecated alias:

- `DataScopeManager`, the class
- `defaultDataScopeManager`, its shared instance
- `RowLevelFilter`, the type of one row-level rule
- `DataScopeConfig`, the type `registerScopeWithConfig` took; nothing else in
  the package read it

Why they went: `DataScopeManager` carried a third hand-written row-level
security evaluator, beside `evaluateCondition` in `@object-ui/permissions` and
the platform's own. The platform keeps one row-level security language: the CEL
predicate a `RowLevelSecurityPolicySchema` policy declares in its `using`
clause (`@objectstack/spec`), which the server lowers to an ObjectQL filter and
which fails closed when it does not lower. Aligning this class's operator
vocabulary with the spec's instead was considered and refused: on a permission
boundary it would have turned refused operators into evaluated ones, three of
them with silently different meanings. On this change's base, nothing in this
repository constructed a `DataScopeManager` or a `RowLevelFilter` outside the
class's own tests, and the downstream readings recorded on objectui#7750 found
no consumer in `objectstack`, `hotcrm` or `cloud`. The maintainer ruled to
retire it; the ruling is on objectui#7750.

Not affected: the rest of `data-scope/` stays exported, `ViewDataProvider` and
the element data-source helpers (`composeElementDataSource`,
`resolveSavedView` and their types) included. The `DataScope` and `DataContext`
interfaces in `@object-ui/types` are unchanged.

Other entries in this same release describe work on `DataScopeManager`: the
`@object-ui/core` entries for objectui#7378 (an unknown operator denies the
row) and objectui#7751 (the own-member field read and the same-kind ordered
comparison). That work shipped in a class this entry removes. The
`@object-ui/permissions` entry for objectui#8044 says `evaluateCondition` now
gives the same answer as `DataScopeManager` for a prototype-named field; the
guard it describes stays in `@object-ui/permissions`, and after this release it
is the only one of the two evaluators left.

**Migration:** there is no replacement in `@object-ui/core`. Declare row-level
security on the server, as a `RowLevelSecurityPolicySchema` policy whose
`using` clause is a CEL predicate; the platform lowers it to an ObjectQL filter
and enforces it fail-closed. If you used `DataScopeManager` only as a registry
of named scopes, copy `packages/core/src/data-scope/DataScopeManager.ts` from a
release tag that still ships it, for example `@object-ui/core@17.5.0`, into
your own code.
