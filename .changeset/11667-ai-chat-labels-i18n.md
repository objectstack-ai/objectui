---
'@object-ui/app-shell': minor
'@object-ui/i18n': minor
---

The AI chat's tool-approval card and its "Open in Builder" handoff card are translated in every language (objectui#11667).

The console's AI chat passed three English literals to the inline approval card: "Approve & run", "Reject", and the deny reason "Operator rejected from chat". It also left the handoff card on its English defaults: "Build this in the Builder", "Open in Builder →", and the superseded card's tooltip "A newer request is available". A zh-CN reader met all six in English, among labels that were already translated.

All six now come from the language packs:

- The approve and reject buttons reuse the AI Approvals inbox's keys `aiApprovals.approveAndExecute` and `aiApprovals.reject`. They make the same decision on the same pending action, through the same endpoint. English readers now see "Approve & Execute" in place of "Approve & run", the inbox's wording.
- The deny reason, sent as `reason` on the reject request and stored as the pending action's `rejection_reason`, follows the UI language. People read it in the AI Approvals inbox, and the model reads it as prose on its next turn. No code parses it.
- The handoff card's three strings are new keys.

**Widened public surface (`@object-ui/i18n`).** Four new keys in all ten language packs, so the exported `en` pack and the `TranslationKeys` type derived from it gain four members:

- `console.ai.toolDenyReason`
- `console.ai.builderHandoffTitle`
- `console.ai.builderHandoffOpen`
- `console.ai.builderHandoffSuperseded`

No component prop or exported type changes. `ChatbotEnhanced` already took all six strings as props.
