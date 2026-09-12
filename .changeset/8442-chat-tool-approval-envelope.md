---
'@object-ui/types': minor
'@object-ui/plugin-chatbot': minor
'@object-ui/app-shell': minor
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

**`minor`, on the repo's written precedent — PM ruling, overriding the `patch`
this was drafted at.** The lane's runtime test answers no: the member is optional,
every value that parsed before still parses, and no chip, card or affordance
changes for data that carries no envelope. But that test is about stored data,
and what lands here is published SURFACE — two capabilities a consumer can newly
rely on: the `ChatToolInvocation.approval` member, and the `detectPendingApproval`
export. `.changeset/8214-chatbot-anypart-state-widen.md` settles that case in this
repo in those words: *"`minor` rather than `patch` because a published signature
accepts input it refused before, which is a capability a consumer can newly rely
on."*

The sequencing argument for `patch` was that objectui#8426's `minor` + `**BREAKING**`
carrier should not be spent early. ⛔ It does not hold, for two measured reasons.
**First, the level was never the signal.** This repo ships a breaking change AS
`minor`, so what distinguishes objectui#8426's half is the `**BREAKING**` carrier,
not the number beside the package — and that carrier is untouched by this
declaration. **Second, `.changeset/config.json` puts every package in ONE `fixed`
group**, so the released level is the maximum across all pending changesets
regardless of what this file says. Declaring `patch` here therefore buys no
smaller release and no preserved signal; it only makes the changelog line
under-describe what shipped. ⇒ the accurate declaration is the cheap one.

⛔ Nothing is narrowed here. The envelope stays optional on purpose: an
invocation may still declare an approval state and carry no envelope, and the
pin that says so is deliberate, so that a later tidy-up cannot ship
objectui#8426's break under this card's name.
