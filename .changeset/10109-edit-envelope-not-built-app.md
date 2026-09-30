---
'@object-ui/plugin-chatbot': minor
---

An incremental edit is no longer read as a whole-app build. An `apply_edit` result says `kind: 'edit'` on its envelope, and its `drafted[]` may list the `app` artifact the edit re-staged, because an `add_object` op re-stages it for the nav merge. An `apply_blueprint` build carries no `kind`. The chat now takes the producer's field as the only thing that separates the two, instead of guessing a build from which artifact types were staged (objectui#10109):

- `detectBuiltAppPackage` returns `undefined` for an envelope that says `kind: 'edit'`, in both the drafted and the auto-publish (`status: 'published'`) postures.
- `DraftReview` has a new optional `kind?: 'edit'`, and `detectDraftResult` fills it from the envelope. The edit still gets its draft card, its items and its `packageId`, so one-click publish still works.
- `ChatbotEnhancedToolInvocation['draftReview']` (`ChatToolInvocation.draftReview`) is now typed as `DraftReview` instead of an inline copy of its fields, so it declares `kind` too. The two were field-identical before this change, and the published tool-invocation type now describes exactly what the chat mapper puts on it.
- `buildProgressFromDraftReview` builds no finished "Built X" panel for a draft review whose `kind` is `'edit'`, so a reloaded edit shows the same thing it showed live.

An envelope without `kind` behaves as before. `DraftReview.kind` declares only the value these readers act on, and an envelope that says anything else leaves it unset.
