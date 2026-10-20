---
'@object-ui/plugin-grid': patch
---

A finished import no longer says "Review data before importing." under its result (objectui#13124).

The import dialog's subtitle followed the wizard step, and a finished import stays on the preview step, so "Import Complete" (or "Import cancelled") sat under the preview step's sentence. On the result screen the header now shows no subtitle; the result headline itself is the dialog's description, so a screen reader still hears the finished state. The upload, mapping, preview and history subtitles read as before.

Nothing is added to the package entry: no export, prop, type member or string-table key.
