---
'@object-ui/app-shell': patch
---

The metadata directory's "View all issues" link no longer paints warnings as errors (objectui#12768).

The directory counts its issues with a `warning`-severity sweep, so the count includes items whose only diagnostics are warnings, yet the link was always red with an alert triangle. The link now takes its tone from the same rule as the Diagnostics page header:

- **Any invalid item:** the destructive colour, as before.
- **Warnings only:** the warning colour the Diagnostics header uses.
- **No issues:** no link, as before.

The link's text, count and destination are unchanged.

On the Diagnostics page, the count badge beside each type heading now takes that group's own tone by the same rule, so on "Errors + Warnings" a group with warnings only shows its count in the warning colour instead of red, while a group with an invalid item keeps the destructive colour.

No new string, export or prop.
