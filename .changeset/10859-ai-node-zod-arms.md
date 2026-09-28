---
'@object-ui/types': minor
---

`safeValidateSchema` — and so `objectui validate` — accepts the three `@object-ui/plugin-ai` node types, `ai-form-assist`, `ai-recommendations` and `nl-query` (objectui#10859, batch 1).

**Clause-②: yes** — the accept set of `AnyComponentSchema` widens by three `type` literals, and `@object-ui/types/zod` exports eight new schemas. Nothing that parsed before is refused now.

**What it was.** All three types are registered by `@object-ui/plugin-ai`, declared on the published TypeScript face (`AIFormAssistSchema`, `AIRecommendationsSchema`, `NLQuerySchema`) and taught by that package's README. `AnyComponentSchema` carried no arm for any of them, so every document naming one was refused with `invalid_union` at `type` — the README's own `{ "type": "ai-form-assist", "showConfidence": true, "showReasoning": true }` included, which `objectui validate` reported as "Schema validation failed".

**What changed, in observable terms.**

- `@object-ui/types/zod` exports `AIFormAssistSchema`, `AIRecommendationsSchema`, `NLQuerySchema`, their sub-schemas `AIConfigSchema`, `AIFieldSuggestionSchema`, `AIRecommendationItemSchema` and `NLQueryResultSchema`, and the category union `AIComponentSchema`, which `AnyComponentSchema` now lists. The strict authoring face (`StrictAnyComponentSchema`) derives from `AnyComponentSchema` and accepts the same three types, closed to undeclared keys like every other arm.
- Each arm restates its TypeScript declaration member for member. The objectui#8178 retired members (`formId`, `objectName`, `fields`, `autoFill`, `maxResults`) and both content channels (objectui#9256) are refused by name, as they already were on the TypeScript face.
- ⚠️ The `on*` members are the one place the two faces differ. The TypeScript face still types `onApplySuggestion`, `onRejectSuggestion`, `onSelect`, `onDismiss` and `onSubmit` as `string`; the zod face refuses an authored value on each, by name, following objectui#6182 (the handler-expression string dialect is not an authoring form) and objectui#6124 (`onSelect` / `onDismiss` / `onSubmit` are runtime slots a React host fills; the other two have no reader). An authored string was never a working handler: `onSelect`, `onDismiss` and `onSubmit` are called only as function props a React host passes, and `onApplySuggestion` / `onRejectSuggestion` are read by nothing — delete the key from the document. The TypeScript face's `string` typing is objectui#10874's to correct.
