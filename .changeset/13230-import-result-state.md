---
'@object-ui/plugin-grid': patch
'@object-ui/i18n': patch
---

Import wizard: the result screen now says what happened. An import that imported every row still shows the green check and "Import Complete"; one that imported some rows but skipped or rejected others reads "Import finished with errors" with a neutral icon; one that imported nothing — every row rejected, the request refused (405) or failed, or the background job ended `failed` — reads "Import failed" with an error icon, and its "0 imported" count is no longer drawn as the primary badge. The counts and row errors are unchanged. New `grid.import.importPartial` and `grid.import.importFailed` strings in every locale.
