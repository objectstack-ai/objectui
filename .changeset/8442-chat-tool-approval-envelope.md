---
'@object-ui/types': patch
'@object-ui/plugin-chatbot': patch
'@object-ui/app-shell': patch
---

`ChatToolInvocation` gains an optional `approval` envelope, and the Console's
hydration mapper stops dropping it — together with `pendingActionId`
(objectui#8442).

Three of the ten declared `state` values — `approval-requested`,
`approval-responded` and `output-denied` — are states the AI SDK's own tool-part
union cannot express WITHOUT an `{ id, approved?, reason?, isAutomatic?,
signature? }` envelope. `hydratedMessagesToChatMessages` built each invocation
from six fields and neither the envelope nor `pendingActionId` was one of them,
so a rehydrated pending approval arrived carrying a state that says "a human must
decide" and nothing a decision could be made with: `useHitlInChat` keys its index
on `pendingActionId` and skips any invocation without one.

The two halves arrive from different places and are lifted separately. The SDK
envelope is persisted ON THE PART and is narrowed to its declared shape rather
than cast (an `approval` with no usable `id` is refused, not passed through).
`pendingActionId` is never a part key — in rehydrated history it exists only
inside the tool RESULT — so it is derived with `detectPendingApproval`, the same
parse the live mapper uses, now exported from `@object-ui/plugin-chatbot` so the
two paths cannot disagree about one envelope rather than growing a second
dialect of it.

**`patch`, and the reason is the chain's sequencing, not the size of the diff.**
The lane's test — does existing stored data render differently — answers no: the
member is optional, every value that parsed before still parses, and no chip,
card or affordance changes for data that does not carry an envelope. The
counter-reading is real and worth naming: two published capabilities DO land here
(the type member, and the `detectPendingApproval` export), and this repo's own
recent precedent bumped `minor` for "a capability a consumer can newly rely on".
It still loses. The ruling on objectui#8426 reserves the `minor` + `**BREAKING**`
carrier for the NARROWING half — the authoring `state` union shedding the three
runtime-only approval states, and the `UseObjectChatOptions.initialMessages`
narrowing. This card is deliberately the additive half that ships first; spending
that carrier here would blur the one signal the chain uses to sequence itself.

⛔ Nothing is narrowed here. The envelope stays optional on purpose: an
invocation may still declare an approval state and carry no envelope, and the
pin that says so is deliberate, so that a later tidy-up cannot ship
objectui#8426's break under this card's name.
