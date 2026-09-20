---
'@object-ui/app-shell': minor
---

Studio: the create-draft dialog's confirm control no longer shares a name with the
affordance that opens it (objectui#9231).

**BREAKING** — a published, user-visible accessible name changes. The confirm control of
the shared Studio create dialog (`engine.studio.createDraft`) reads `Save as draft`
instead of `Create (save as draft)`, and `存为草稿` instead of `创建(存为草稿)`. It is the
primary button of the app / object / automation create dialogs. Any automation, E2E
selector or documentation that targets it by its old name must be updated; nothing about
what the control DOES has changed.

**Why the confirm side and not the opener.** The toolbar affordance is named `Create app`
and the dialog it opens is titled after it — naming a dialog for the action that opened it
is correct, and `Create app` is the name users, docs and automation already reach for. What
was wrong is that the one control which actually creates the app offered `Create` as its
only handle, and `Create` matched the three openers too (toolbar, Interfaces empty state,
Interfaces rail). So no name could address the confirm control without also matching an
opener — and while the dialog is open every opener is `aria-hidden` behind Radix's modal
overlay, so a by-name click there dismisses the dialog with no error and nothing created.
The user then meets `App not available … it may still be publishing` at the app's list
route, which blames a publish that never started.

**Why `minor` and not `patch`.** All 41 packages sit in one `fixed` group, so the release
level is the max across pending changesets and a split changeset cannot produce split
levels. This repo ships breaking changes as `minor` with a `**BREAKING**` carrier
(`major` is reserved for tracking `@objectstack`'s major), and an accessible name is part
of the observable surface a consumer can pin — `patch` would under-declare it.

Pinned by `StudioDesignSurface.createAppAccessibleName.test.tsx`, which drives the real
surface and the real dialog and asserts by accessible name only — never by `data-testid`,
which would pin around the very name the defect was about.
