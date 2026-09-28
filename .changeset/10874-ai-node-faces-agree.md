---
'@object-ui/types': minor
---

**BREAKING (authoring)** — the three `@object-ui/plugin-ai` node declarations stop offering members that no runtime honours (objectui#10874, ADR-0049).

**Clause-②: yes** — authorable members of published `@object-ui/types` declarations retire on both faces: the TypeScript face (`?: never`) and the zod face (`safeValidateSchema`, `objectui validate` and `StrictAnyComponentSchema`). Scored `minor`, not `major`: this repository scores its own breaking changes `minor` and spells the breaking semantics out in the body (`check:changeset-no-major`).

**What retires, on which face.**

| Member | Was on | TypeScript face | zod face |
|---|---|---|---|
| `config` | `AIFormAssistSchema`, `AIRecommendationsSchema`, `NLQuerySchema` | `?: never` (was `AIConfig`) | refused by name (was accepted) |
| `context` | `AIFormAssistSchema`, `AIRecommendationsSchema` | `?: never` (was a string-keyed record) | refused by name (was accepted) |
| `onApplySuggestion`, `onRejectSuggestion` | `AIFormAssistSchema` | `?: never` (was `string`) | refused by name, unchanged |
| `onSelect`, `onDismiss` | `AIRecommendationsSchema` | `?: never` (was `string`) | refused by name, unchanged |
| `onSubmit` | `NLQuerySchema` | `?: never` (was `string`) | refused by name, unchanged |

**Why.** None of these members did anything. `config` and `context` were read by nothing in `@object-ui/plugin-ai`: the three components are presentation only and call no model, so a `provider`, `model`, `systemPrompt` or context written on the node changed nothing on screen. The five `on*` members were the handler-expression string dialect objectui#6182 withdrew on either face. The zod face already refused them (objectui#10859) while the TypeScript face still offered them, so `onSelect: 'x'` passed `tsc` and was then refused by the validator. Both faces now give the same answer, at the moment the node is written.

**Migration — delete the key from the node.**

- `config`: configure AI on the provider your host calls to produce `suggestions`, `recommendations` or the query `result`, and hand its output to the node.
- `context`: pass it to that provider when you ask it for suggestions or recommendations.
- `onApplySuggestion`: use the `onApply` prop of the `AIFormAssist` component. `onRejectSuggestion` has no replacement: the component has no reject callback.
- `onSelect`, `onDismiss`, `onSubmit`: pass them as the component props of the same names. `AIRecommendations` and `NLQueryInput` take them as functions, unchanged.

```tsx
// before: compiled, and neither key did anything
const picks: AIRecommendationsSchema = {
  type: 'ai-recommendations',
  recommendations,
  config: { model: 'gpt-4' },
  onSelect: 'openItem',
};

// after
const picks: AIRecommendationsSchema = { type: 'ai-recommendations', recommendations };
const panel = <AIRecommendations schema={picks} onSelect={(item) => openItem(item)} />;
```

**What does not change.** The renderers are untouched, so a stored document renders exactly as it did: `config` and `context` were ignored and still are. What moves is the verdict: `tsc` refuses all seven members on a typed node, and the validator refuses `config` and `context` by name, where the arms objectui#10859 added in this same release accepted them. The exported `AIConfig` type and `AIConfigSchema` stay; no node member takes them any more.

⚠️ **The census behind "read by nothing" is the in-repo half.** Every package, app, example, doc and skill in this repository was searched, and none reads `config` or `context` off an AI node or authors a retired member. Customer applications and published documents outside it were not enumerated; a TypeScript consumer that authored one of these keys gets a compile error naming it.
