---
'@object-ui/app-shell': patch
---

The flow designer's structural-check finding type is declared as `FlowSimDiagnostic` instead of `Diagnostic` (objectui#6349, batch 6), because `@object-ui/sdui-parser` publishes `Diagnostic` for a parser finding, a different shape. The type is internal: this package's entry exports neither name, so no import changes. The doc comment above the chat page's `ChatbotEnhancedMessage` import now says what `@object-ui/plugin-chatbot` publishes since objectui#6349 batch 5.

No runtime behaviour changes.
