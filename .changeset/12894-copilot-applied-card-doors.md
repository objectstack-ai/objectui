---
'@object-ui/app-shell': minor
---

The Studio copilot's applied card can open the change review and undo the draft; the 变更 badge follows an in-turn publish; the chat fits the copilot's slot at a 1010 px window (objectui#12894, objectui#12725).

- **查看变更并发布 opens Studio's 变更 drawer for the package.** The card the copilot draws after it saves a change as a draft now offers the review in place of its inline Publish button. In the Studio copilot the drawer opens where the user is: same pillar, same selection, nothing reloads. From the full-page chat or the console dock, the button opens the package's Studio with the drawer open. The way in is a Studio URL parameter, `?changes=review`: the surface opens the drawer to review the pending drafts and drops the parameter, so a refresh or Back does not reopen it.
- **撤销 discards the drafts through `POST /packages/:id/discard-drafts`.** The card asks first when the package holds other drafts, as it already did. A draft the server could not drop is shown on the card with the server's reason. Either way the 变更 badge and the other pending-drafts views re-read.
- **The 变更 badge re-reads when a tool publishes in the turn.** Where the environment publishes AI changes immediately, the tool's answer says `published` and every pending draft of the package went live with it. That answer now updates the badge as it lands, as a saved draft already did.
- **The chat fits the Studio copilot's slot.** In the 300 px slot at a 1010 px window, a tool card's one-line summary used to widen the chat beyond the slot, so the share button, the ends of the messages and the send button were cut off. The chat now follows the slot's width, and the summary is truncated as designed.

Clause-②: no. No export, prop, spec key or language-pack key changes. The Studio route reads one new page-scoped URL parameter, `changes`.
