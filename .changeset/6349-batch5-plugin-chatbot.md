---
'@object-ui/plugin-chatbot': minor
---

The runtime chat contracts have their own names, apart from `@object-ui/types`' authoring `ChatMessage` / `ChatToolInvocation` (objectui#6349, batch 5). The shape `<ChatbotEnhanced>` renders is declared as `ChatbotEnhancedMessage`, and its tool invocations as `ChatbotEnhancedToolInvocation` — the names this package already published them under. `ChatbotEnhancedMessage` is no longer deprecated.

**Type changes, breaking for some consumers.**

- `ChatMessage` is no longer exported from `@object-ui/plugin-chatbot`. It denoted the same type as `ChatbotEnhancedMessage`, while `@object-ui/types` publishes a different `ChatMessage` (the JSON/SDUI authoring contract), so one name stood for two contracts across the two packages. Replace `import { type ChatMessage } from '@object-ui/plugin-chatbot'` with `ChatbotEnhancedMessage`; the shape is unchanged. The compiler names the replacement (TS2460: declared locally, exported as `ChatbotEnhancedMessage`). For authored messages, import `ChatMessage` from `@object-ui/types` and convert them with `toRuntimeMessages`.
- `ChatbotEnhancedToolInvocation` keeps its name and shape; only its declaration was renamed from `ChatToolInvocation`, a name this package's entry never exported.

The README and the plugin-chatbot docs page now teach `ChatbotEnhancedMessage`. No runtime behaviour changes.
