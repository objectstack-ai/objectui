---
'@object-ui/plugin-chatbot': minor
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

feat(plugin-chatbot): a drafted result's Preview button appears for any draft kind, and the draft preview bar names what is pending on the surface it shows (objectui#12968)

Clause-②: yes — `ChatbotEnhancedProps` gains the optional `onPreviewDraft`.

**`@object-ui/plugin-chatbot`.** A drafted tool result whose items include no app now draws a
Preview button beside Publish and Review when the host passes `onPreviewDraft(items, { appSegment })`.
The click hands the host the drafted `{ type, name }` items and the owning package id, the app's route
segment. A draft set that includes an app keeps `onPreviewDraftApp`, unchanged, and a host that passes
no `onPreviewDraft` draws what it drew before. Preview publishes nothing. The confirm path previews
too: `detectReplayOutcome` lifts a drafted replay's `drafted[]` items into the exported `ReplayOutcome`
as the optional `items`, and the applied card (or, from an older cloud, the drafted badge) draws the
same Preview over them through the same `onPreviewDraft` / `onPreviewDraftApp` rule.

**`@object-ui/app-shell`.** In draft preview (`?preview=draft`), the DraftPreviewBar's message names
how many pending drafts belong to the surface it shows: an object's list, view or record, a page, a
dashboard or a report. The count is read from the same pending-drafts list as before. The preview's
deep-link table (`preview/draftSurface.ts`, `draftPreviewPath`) maps drafted items to the route that
shows them: a page to that page, a view to the object's list on that view, a field or object to the
object's default list, anything else to the app. The console wires it: `ChatPane` passes
`onPreviewDraft`, and a field, view or page draft's Preview opens the Live Canvas at that path, in
draft preview; `LiveCanvas` takes the full preview path beside the app segment (`path`). An app
draft's Preview opens the app as before.

**`@object-ui/i18n`.** `preview.draftBar.pendingHere`, a plural family, in all ten packs.
