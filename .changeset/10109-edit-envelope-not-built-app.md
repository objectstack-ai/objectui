---
'@object-ui/plugin-chatbot': patch
---

`detectBuiltAppPackage` no longer reads a tool result whose envelope declares `kind: 'edit'` (an `apply_edit` result) as a whole-app build, even when its `drafted[]` lists the `app` artifact the edit re-staged — an `add_object` op re-stages it for the nav merge. The producer marks an incremental edit with `kind: 'edit'` and leaves `kind` off an `apply_blueprint` build, so the whole-app test reads that field instead of inferring a build from which artifact types were staged. `detectDraftResult` reads the same edit exactly as before, so the edit keeps its draft card and its one-click publish (objectui#10109).

Scope of the change: it covers a raw result envelope, which is what the chat's built-moment transition reads in an auto-publish environment (`status: 'published'`). In the drafted posture, the draft review lifted from that same envelope is still read as a whole-app build by `@object-ui/app-shell`'s built-moment transition and by the reload build panel; objectui#10109 tracks that half.
