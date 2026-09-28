---
'@object-ui/app-shell': patch
---

Raise `@object-ui/app-shell`'s declared `@objectstack/spec` floor from
`^17.3.0` to `^17.4.0` (objectui#10864) — the old range admitted a spec that
lacks four symbols this package's own shipped artifact imports.

`packages/app-shell/src/views/metadata-admin/previews/screen-spec.ts` imports
`predicateSlotRefusal` from `@objectstack/spec/automation`;
`packages/app-shell/src/views/metadata-admin/previews/simulator/flow-sim-validate.ts`
imports `structuralConditionRefusal` from the same subpath plus
`EVALUATED_EXPRESSION_SOURCE_REQUIRED` and `EvaluatedExpressionSchema` from
`@objectstack/spec/shared`. `@objectstack/spec` was declared as `^17.3.0`, so
any resolution landing on 17.3.0 (which the range allows) gets a module that
names exports its own declared spec dependency does not have.

Measured against the published `@objectstack/spec` tarballs (`npm pack`):
`predicateSlotRefusal`, `structuralConditionRefusal`,
`EVALUATED_EXPRESSION_SOURCE_REQUIRED` and `EvaluatedExpressionSchema` are
absent from every file under 17.3.0's `dist/`, and present under 17.4.0's
`dist/automation` and `dist/shared`. `@object-ui/types` already declares
`^17.4.0`.

No runtime behaviour changes: every install resolves 17.4.0 today (the
lockfile's resolved `version:` for this specifier was already 17.4.0 before
this change — only the declared `specifier:` range was stale). What changes is
the declared contract — the range no longer claims to work against a spec that
lacks the symbols this package's own code names.

`pnpm check:spec-floors` was red before this change (4 `floor-too-low`
findings, all in `@object-ui/app-shell`) and green after, over a full
workspace build.
