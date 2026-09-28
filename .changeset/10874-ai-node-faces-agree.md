---
'@object-ui/types': minor
---

**BREAKING (authoring)** — the three `@object-ui/plugin-ai` node declarations stop offering members that no runtime honours, and type the handler slots their components call (objectui#10874, ADR-0049, the objectui#6124 per-key rule).

**Clause-②: yes** — authorable members of published `@object-ui/types` declarations narrow. Three members become callable: `string` to a function type (`onSelect`, `onDismiss`, `onSubmit`). `config` and `context` become `never` on both faces, five members across the three declarations. `onApplySuggestion` and `onRejectSuggestion` become `never` on the TypeScript face, and the zod face already refused them. Scored `minor`, not `major`: this repository scores its own breaking changes `minor` and spells the breaking semantics out in the body (`check:changeset-no-major`).

**What changes, on which face.**

| Member | Was on | TypeScript face | zod face |
|---|---|---|---|
| `onSelect`, `onDismiss` | `AIRecommendationsSchema` | CALLABLE: `(item: AIRecommendationItem) => void` (was `string`) | refused by name, unchanged |
| `onSubmit` | `NLQuerySchema` | CALLABLE: `(query: string) => void` (was `string`) | refused by name, unchanged |
| `onApplySuggestion`, `onRejectSuggestion` | `AIFormAssistSchema` | `?: never` (was `string`) | refused by name, unchanged |
| `config` | `AIFormAssistSchema`, `AIRecommendationsSchema`, `NLQuerySchema` | `?: never` (was `AIConfig`) | refused by name (was accepted) |
| `context` | `AIFormAssistSchema`, `AIRecommendationsSchema` | `?: never` (was a string-keyed record) | refused by name (was accepted) |

**Why.**

- `onSelect`, `onDismiss` and `onSubmit` are RUNTIME SLOTS. Each node type is registered to its raw component, `SchemaRenderer` spreads the node's own keys onto the component's props, and `AIRecommendations` and `NLQueryInput` call these keys as functions. So a function on the node was always called, and a string there was called as a function and threw at click. The TypeScript face now declares the callable the component invokes, as objectui#6124 rules for a key a runtime consumer calls. The zod face keeps refusing an authored value, because JSON has no function value.
- `onApplySuggestion` and `onRejectSuggestion` were read by nothing: `AIFormAssist` takes `onApply` and `onRefresh`, so a string there did nothing.
- `config` and `context` were read by nothing in `@object-ui/plugin-ai`. The three components are presentation only and call no model, so a `provider`, `model`, `systemPrompt` or context written on the node did nothing and changed nothing on screen.
- Before this change the zod face refused all five `on*` strings (objectui#10859) while the TypeScript face offered them, so `onSelect: 'x'` passed `tsc` and was then refused by the validator. Now `tsc` refuses the string too.

**Migration.**

- `onSelect`, `onDismiss`, `onSubmit`: pass a function, never a string — either as the component prop of the same name, or on a node you build in TypeScript. `AIRecommendations` and `NLQueryInput` take the same signatures as props, unchanged.
- `onApplySuggestion`: delete it, and use the `onApply` prop of the `AIFormAssist` component. `onRejectSuggestion`: delete it; the component has no reject callback.
- `config`: delete it. Configure the model in your host's own AI service (ObjectUI has no AI-provider API; these components call no model), and hand its output to the node as `suggestions`, `recommendations` or `result`.
- `context`: delete it, and pass the context to your host's own AI service when you ask it for suggestions or recommendations.

```tsx
// before: compiled; `config` did nothing, and the string was called as a function and threw at click
const picks: AIRecommendationsSchema = {
  type: 'ai-recommendations',
  recommendations,
  config: { model: 'gpt-4' },
  onSelect: 'openItem',
};

// after
const picks: AIRecommendationsSchema = {
  type: 'ai-recommendations',
  recommendations,
  onSelect: (item) => openItem(item),
};
```

**What does not change.** The renderers are untouched, so a stored document renders exactly as it did: `config` and `context` were ignored and still are, and a function reaching `onSelect`, `onDismiss` or `onSubmit` is still called. What moves is the verdict. `tsc` refuses the four retired keys, on all seven member slots that carried them, and a string on the three slots. The validator refuses `config` and `context` by name, where the arms objectui#10859 added in this same release accepted them. The exported `AIConfig` type and `AIConfigSchema` stay; no node member takes them any more.

⚠️ **The census behind "read by nothing" is the in-repo half.** Every package, app, example, doc and skill in this repository was searched: none reads `config` or `context` off an AI node, and none authors a changed member. Customer applications and published documents outside it were not enumerated. A TypeScript consumer that authored one of these keys gets a compile error naming it.
