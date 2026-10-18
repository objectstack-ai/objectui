---
'@object-ui/app-shell': patch
---

Metadata Diagnostics no longer paints a clean sweep as an error (objectui#12721).

Clause-②: no

The page header drew a red alert triangle and a red summary badge whatever the sweep found, so a healthy app showed "0 issue(s) across 396 items in 27 types" in the error colour above its own "All clear". The header now takes its tone from the entries the page already reads from `/meta/diagnostics`:

- **No issues:** a green check icon and a neutral badge.
- **Warnings only** (the "Errors + Warnings" tab): the warning colour.
- **Any invalid item:** the destructive colour, as before.

While the sweep is loading, the badge is hidden and the icon is muted, instead of showing a placeholder "0 issue(s) across 0 items". When the sweep fails, the badge is hidden and the icon stays destructive, beside the page's load-failure notice. A failed sweep is never shown as clean.

No new string, export or prop. The badge keeps its existing `engine.diagnostics.summary` text.
