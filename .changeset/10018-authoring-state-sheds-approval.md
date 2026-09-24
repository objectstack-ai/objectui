---
'@object-ui/types': minor
'@object-ui/plugin-chatbot': minor
---

BREAKING (`@object-ui/types`, `@object-ui/plugin-chatbot`): the authoring `ChatToolInvocation.state` union sheds the AI SDK's three runtime-only approval states — `approval-requested`, `approval-responded` and `output-denied` — so a schema-authored tool invocation can no longer claim an approval the runtime has nothing to back (objectui#10018, the residual clause of the objectui#8426 ruling, decision batch #86).

(The bump is `minor` by this repo's release model — objectui's major is pinned to the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

**Break 1 — authored approval states are refused.** `ChatToolInvocation.state` (and so `ChatMessage.toolInvocations[].state` and `ChatbotSchema.messages`) no longer admits the three approval states, and the Zod mirror `ChatToolInvocationSchema` refuses them as an `invalid_value` at `state`. The refusal holds with or without an `approval` envelope: the envelope does not make a runtime-only state authorable. A chat runtime still produces these states — from the SDK's approval envelope, or promoted from an ObjectStack pending-action result — and still renders them; only the authoring face stops declaring them. Migration: author the state the tool call is actually in (`input-available`, `output-available`, `output-error`, or a legacy `call` / `result`), and leave approval states to the runtime.

**Break 2 — `onSend` handlers typed against the authoring `ChatMessage[]`.** The messages a chat runtime hands back can carry those three states, so they are no longer a subtype of the authoring `ChatMessage`. `ChatbotSchema.onSend`'s `messages` is now typed as the authoring message widened by exactly those states, and `useObjectChat`'s `ObjectChatMessage` is no longer assignable to the authoring `ChatMessage`. A handler that declares its parameter as the authoring `ChatMessage[]` stops type-checking. Migration: let the parameter be inferred from the slot, or declare it as `ObjectChatMessage[]` from `@object-ui/plugin-chatbot` when passing `onSend` to `useObjectChat`.

Not breaking: `UseObjectChatOptions.initialMessages`, `SeamToolInvocation` and `toRuntimeToolState` now take the seam's state vocabulary (authoring plus runtime), which is the same set of values they accepted before, so every existing caller still compiles. No new name is exported: the three runtime-only states are named only by a non-exported alias in `@object-ui/types`, pinned equal to `ChatbotEnhanced`'s runtime union by `chat-message-contract.test.ts`. The effect on out-of-repo authors and hosts was not measured.
