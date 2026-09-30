---
'@object-ui/core': patch
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

The console strings objectui#10900 left English under zh-CN now read the session's language (objectui#10969).

- **The action runner's other own text.** `ActionRunner` asks the translator installed through `setTranslator` (objectui#10900) for three more strings it writes itself: the error toast when the error that reached it carries no readable message (`actions.failed`), a parallel chain's error when no failed action reported one (`actions.parallelFailed`), and the label of an undoable success toast's Undo button (`actions.undo`). An author's `errorMessage` / `successMessage`, a server message and an action's own error stay verbatim. With no translator the text stays English.
- **The Undo label now arrives from the runner.** For an undoable result the runner hands the toast handler `undo: { label }` where it used to hand `undo: {}`; `ToastHandler`'s type is unchanged (`label` was already optional). A handler that renders `options.undo.label` shows the translated label; one that ignores it keeps its own.
- **The console app's `system/*` breadcrumbs.** In `AppHeader`, the segment after `System` for `settings`, `apps`, `profile`, `approvals`, `ai-approvals` and `audit-log` reads `console.breadcrumb.*` (as `marketplace` has since objectui#10900). In English, `ai-approvals` now reads `AI Approvals` instead of the humanized slug `Ai Approvals`; the other five read as before. A segment the header does not know keeps its humanized slug.
- **The Build Doctor drawer's body.** Its description, loading and not-found states, summary line, verdict, and each section's title and hint read `console.ai.buildDoctorDrawer.*`. The report's own data (tool, artifact and status names, timeline text) stays verbatim.
- **"manifest ID" leaves the marketplace search placeholder in every pack.** `en` now reads `Search apps by name or app ID…`, and the eight packs that translated the jargon literally follow. zh already read 「按名称或标识搜索应用…」 and is unchanged.

The new keys are in all ten packs.
