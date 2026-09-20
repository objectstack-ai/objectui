---
'@object-ui/plugin-form': patch
---

Fix a refused master-detail save showing the same refusal twice (objectui#7354).

`MasterDetailForm`'s `handleError` toasted the write's error message under its own
sonner id, and the parent `<ObjectForm>` then re-threw the same error, which surfaced
in the form renderer's own catch (`packages/components/.../renderers/form/form.tsx`)
and toasted it AGAIN under a different, independently-generated `form-outcome:<id>`.
Two raisers reported one refusal.

`handleError` now only releases the save guard and forwards the error to the host's
own `onError` (if supplied) for bookkeeping — it no longer toasts. Display is left to
the form renderer's catch, which every `submitHandler` host already shares and which
already extracts a better message (permission-aware, honours the author-marked
`userMessage`) than the raw `err.message` this callback showed.
