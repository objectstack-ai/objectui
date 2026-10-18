---
'@object-ui/app-shell': minor
'@object-ui/plugin-chatbot': minor
'@object-ui/i18n': minor
---

The chat launchers show a marker while a proposed plan awaits the user's approval (objectui#11666, item 6 of objectui#2458). A user who closed the chat with a blueprint still waiting on them used to get no sign of it from the launcher they return to.

What a user sees: while the newest proposed plan of a conversation still offers "Build it", the console's assistant button (the floating launcher on app pages and Home) and the ChatDock edge launcher Studio uses carry a small amber dot. Assistive tech reads it as the button's description, from the new `console.ai.dock.planAwaitingApproval` key in the active language. With no plan awaiting, neither launcher shows anything. The dot goes away when the plan stops awaiting: the user approves it, its build runs, or a newer proposal takes its place and is itself approved or built. Opening the chat clears nothing by itself, and neither does opening another conversation. Deleting the conversation from the `/ai` sidebar drops it.

Where the reading comes from: the chat's own plan card. `ChatbotEnhanced` derives "awaiting approval" from the same producer its card header and body read (`resolveProposalCardState` reads `pending`), and reports it to its host. The console's chat pane publishes that reading on the assistant bus, per conversation and per signed-in user, and the launchers read the bus. They import no chat code. The reading is exact for everything that happens in the tab. It does not see a decision made in another tab or on another device, and a page reload starts it empty until a chat on that conversation is opened again. The durable copy is the server conversation, which the launchers do not read.

**Clause-②: yes (widening).** Two published surfaces widen:

- `@object-ui/plugin-chatbot`: the exported `ChatbotEnhancedProps` type gains one optional member, `onPlanApprovalPendingChange`, a callback that takes one boolean and returns nothing. `ChatbotEnhanced` calls it once on mount and again whenever the boolean changes. Without it nothing changes.
- `@object-ui/i18n`: every built-in locale pack gains one key, `console.ai.dock.planAwaitingApproval`. The `en` pack is exported from the package entry, so the key also joins the translation-key type derived from it.

`@object-ui/app-shell` adds no export: the bus functions the pane and the launchers use (`publishPlanApprovalPending`, `usePlanApprovalPending`) ship inside `dist/` but are not on the package entry, and the exported `assistantBus` object and `AssistantSnapshot` type are unchanged. No prop, export or key is removed, and no existing member changes type.
