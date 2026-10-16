# objectui#12690 live reading

Backend: `e2e/live/ci/start-backend.sh` (published `@objectstack/*@18.0.0-next.2`, showcase app), sqlite throwaway.
Item: an env-wide draft of `object/uxscratch_widget` labelled "QA Widget", written with `PUT /api/v1/meta/object/uxscratch_widget?mode=draft` (package-less).
Console: `vite` dev server (`apps/console`, `@object-ui/app-shell` aliased to source) proxied to the backend.
Driver: Playwright on `/apps/setup/metadata/object/uxscratch_widget`, click "Discard draft", accept the confirm, read the toast.
The native confirm cannot be screenshotted; its captured text is painted onto the page in the yellow box.

- before (objectui main 6e4f144): confirm "Discard the pending draft for object/uxscratch_widget?", toast "Draft discarded: object/uxscratch_widget"
- after (branch claude/issue-12690-discard-draft-label): confirm "Discard the pending draft for QA Widget?", toast "Draft discarded: QA Widget"
