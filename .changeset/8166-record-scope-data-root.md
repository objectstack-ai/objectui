---
'@object-ui/app-shell': minor
'@object-ui/react': patch
'@object-ui/components': patch
---

Stop binding an ambient `data` root on record surfaces, so a `data.*` predicate faults
loudly instead of resolving against the host's bag (objectui#8166, ruled 2026-09-10).

**User-visible behaviour change, at RUNTIME and at DEBUG time — not at authoring time.**
Nothing an author sees while writing a predicate moves: the authoring lint's accept set
lives in `@objectstack/formula`'s `SCOPE_ROOTS`, which still contains `data`, and
`data.status == 'x'` still lints clean at `scope: 'record'`. Splitting that list per
scope is the producer-side half and is not this repo's to make. What changes is what
the runtime does with such a predicate once it is saved.

**What was wrong.** objectui#5741 (Phase 2 of the objectui#5330 canon) retired `data.*`
on runtime record surfaces — the row is bound as `record.*` and nothing else. But
`@object-ui/app-shell`'s `buildExpressionScope` kept binding an ambient `data`, so a
predicate the linter had waved through also *resolved* at runtime, against that bag
rather than against the row. Measured on `main` before this change, one authored
`visibleWhen: "data.status == 'x'"` meant three different things:

- on every `ExpressionProvider` mount and on `RecordFormPage`'s own evaluator, the
  ambient `data` was `{}`, so the engine answered `[runtime] No such key: status` — a
  fault, warned once, and the field-rule fallback applied (fail-open for `visibleWhen`);
- on `AppContent`'s field-list evaluator for the global record-form modal in EDIT mode
  the ambient `data` was **the record being edited**, so the predicate resolved, with no
  diagnostic at all, off the wrong layer's object — an author testing there would have
  seen it "work";
- in CREATE mode on that same modal it fell back to the first case.

**What changes.** `buildExpressionScope` no longer accepts or binds `data`, and the two
imperative call sites (`AppContent`, `RecordFormPage`) stop passing one. A `data.*`
predicate on any app-shell surface now produces the engine's own verdict — `[type]
Unknown variable: data` — on both diagnostic channels (the one-time `console.warn` and
the `onFault` passback), which is the same verdict the server gives the same string and
the same shape `app` has produced since objectui#8155.

**The fault is loud, not fatal.** The verdict a faulting predicate resolves to is
unchanged: `visibleWhen` still fails OPEN, `readonlyWhen` / `requiredWhen` still fail
permissive (`@object-ui/core`'s `fieldRules.ts`; the direction is objectui#8069's open
question, not this change's). So a record form renders exactly as before except that the
console now names the root. Nothing throws.

**Migration.** Rewrite `data.foo` as `record.foo` on any runtime record surface — the
canonical spelling since objectui#5741, and the only one that reaches the row. The
metadata-admin designer is unaffected: its `data` is the DRAFT under edit (ADR-0089 D3,
`CANONICAL_ROOT_BY_LAYER` = `{ runtime: 'record', metadata: 'data' }`), bound by
`views/metadata-admin/predicate.ts` through its own builder, which takes only the
identity roots from this bag and assigns its own `data` last.

`@object-ui/react` carries a docblock correction only: the `app-shell` tier paragraph in
`utils/visibilityDiagnostic.ts` described the bag this change edits. `@object-ui/components`
carries no runtime change at all — three form/predicate tests hand-transcribe the app-shell
bag (importing it would invert the package dependency) and each literal carried the removed
`data: {}`; the transcriptions are corrected so they cannot go on describing a scope that no
longer exists.
