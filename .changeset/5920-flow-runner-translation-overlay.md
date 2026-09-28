---
'@object-ui/app-shell': patch
---

fix(app-shell): the screen-flow runner draws the app's translated flow copy (objectui#5920)

`TranslationData.flows` — a screen's heading and each field's `label` / `placeholder`,
under `flows.<flow>.screens.<node_id>` — had no reader anywhere in the shipped platform.
An app could translate its wizard, the bundle loaded into the console's i18n tree, and
`FlowRunner` still drew the author's source-language strings in every locale. It now
applies the overlay: the heading through `@objectstack/spec`'s `resolveFlowScreenTitle`,
and the per-field copy through the spec's `FLOW_SCREEN_FIELD_COPY_KEYS`, imported rather
than retyped. The bundle is the one the console already loads for the active language;
nothing new is fetched.

What an author sees change: a zh-CN user opening a translated screen flow reads the
translated heading, field labels and placeholders, and the missing-required-fields
message names the fields as they are drawn. Every key falls back to the authored string
on its own, so an untranslated field, placeholder or heading is drawn as authored, and
an app with no `flows` translations renders exactly as before.

Deliberately unchanged: the screen `description` (outside the spec's flows vocabulary —
an off-spec `description` in a bundle is ignored), the runner's own Cancel / Submit /
Submitting… / completion chrome (the console's message catalogue), and the flow's
`successMessage`.

`@object-ui/app-shell` now declares `@objectstack/spec` `^17.3.0`, the first release that
exports the resolver family; `^17.0.0` admitted three releases that do not.

⚠️ **Dated note, 2026-09-28 — the declared floor has since moved again —
objectui#10864.** At this change `@object-ui/app-shell` declared `^17.3.0`, and
the paragraph above is kept as the reading of that change: `17.3.0` was in fact
the first release exporting the resolver family this fix uses. Later in this
same release the floor was raised again, to `^17.4.0`, because two other
shipped app-shell sources (`screen-spec.ts`, `flow-sim-validate.ts`) import
four symbols (`predicateSlotRefusal`, `structuralConditionRefusal`,
`EVALUATED_EXPRESSION_SOURCE_REQUIRED`, `EvaluatedExpressionSchema`) that
`17.3.0` does not export — a defect this changeset's own range did not
introduce and did not need to guard against. `@object-ui/app-shell` now
declares `^17.4.0`.
