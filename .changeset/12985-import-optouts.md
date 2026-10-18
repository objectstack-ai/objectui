---
'@object-ui/plugin-grid': patch
'@object-ui/i18n': patch
---

The Import Wizard no longer offers "Run automations & triggers" or "Import as historical data" (objectui#12985). Both import doors (`POST /api/v1/data/:object/import` and `/import/jobs`) honour `runAutomations: false` and `treatAsHistorical: true` for the system principal only and refuse every signed-in caller `403 PERMISSION_DENIED` (objectstack-ai/objectstack#24348). A user who unticked the first box or ticked the second had the whole import refused.

- **The two options are gone** from the wizard's options panel, with their state. The wizard's import, dry-run and background-job requests carry neither `runAutomations` nor `treatAsHistorical`. Leaving both keys out is the server's declared default, so the default import is unchanged: automations run and the state machine is walked.
- **Language packs.** The three keys only those options read, `grid.import.optRunAutomations`, `grid.import.optTreatHistorical` and `grid.import.optTreatHistoricalHint`, are removed from all ten packs and from the wizard's English fallback map. The locale objects exported under `@object-ui/i18n/locales/*` lose those three members.

Nothing else on either package entry changes: `ImportWizardProps` and `ImportResult` are unchanged, and `ImportRequestOptions` in `@object-ui/types` still declares both fields, because the server still accepts them from the system principal.
