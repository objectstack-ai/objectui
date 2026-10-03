---
'@object-ui/core': minor
'@object-ui/react': minor
'@object-ui/i18n': minor
'@object-ui/components': minor
'@object-ui/types': minor
---

The action success toast is composed from the action's `outcomeMessages`, then its `successMessage`, then the runner's default text. A `message` in the server's answer is no longer shown (objectui#11344).

`@objectstack/spec` 17.6.0 declares `ActionSchema.outcomeMessages`, the success copy for each handler outcome. Its keys are the snake_case `outcome` values that a `type: 'api'` or `type: 'script'` handler returns in its success payload. This follows ruling A on objectstack-ai/cloud#2315: the server returns facts, and the console writes the sentence in the user's locale.

- `@object-ui/core`: the `ActionRunner` success toast now picks its text in this order:
  1. the `outcomeMessages` entry named by the top-level `outcome` of the handler's answer;
  2. `successMessage`;
  3. the runner's default text, in the language of the translator set with `setTranslator`.

  Rungs 1 and 2 fill in `${result.*}` tokens from the handler's answer. That is the same scope `onSuccess.navigate` reads, and the values go in as text, not percent-encoded. **Behaviour change:** `result.data.message` used to take precedence over both. The runner no longer reads it at all. To show the server's sentence, write `${result.message}` as the copy. `ActionDef` now declares `outcomeMessages`.
- `@object-ui/react`: `useActionTextLocalizer` resolves each `outcomeMessages` entry that a named action declares. It looks in `_actions.NAME.outcomeMessages.OUTCOME`, then `globalActions.NAME.outcomeMessages.OUTCOME`, then falls back to the authored text. On a named action, an inline `I18nLabel` map on an entry, or on `successMessage`, is collapsed to the active language first. `${result.*}` tokens pass through unchanged, and the runner fills them in after the action runs.
- `@object-ui/i18n`: `useObjectLabel()` adds `actionOutcome(objectName, actionName, outcome, fallback)`, the resolver for that address.
- `@object-ui/components`: `action:button`, `action:icon`, `action:group` and `action:menu` now forward `outcomeMessages` to the runner. Before, a registered action rendered through `action:bar` lost the map one hop before the toast. The `action:button` and `action:icon` registrations do not publish it as an input, because their own spec rows do not declare it at 17.6.0.
- `@object-ui/types`: `UIActionSchema` declares `outcomeMessages`, derived from the spec.

`@object-ui/core` and `@object-ui/types` raise their `@objectstack/spec` floor from `^17.5.0` to `^17.6.0`, because their published types now read `ActionSchema.outcomeMessages`, a member the spec first declares in 17.6.0.
