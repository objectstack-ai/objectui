---
'@object-ui/app-shell': patch
---

The metadata directory's "View all issues" link no longer paints warnings as errors (objectui#12768).

The directory counts its issues with a `warning`-severity sweep, so the count includes items whose only diagnostics are warnings, yet the link was always red with an alert triangle. The link now takes its tone from the same rule as the Diagnostics page header:

- **Any invalid item:** the destructive colour, as before.
- **Warnings only:** the warning colour the Diagnostics header uses.
- **No issues:** no link, as before.

The link's text, count and destination are unchanged. No new string, export or prop.
