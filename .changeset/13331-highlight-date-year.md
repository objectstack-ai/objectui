---
'@object-ui/core': patch
'@object-ui/fields': patch
'@object-ui/plugin-detail': patch
---

The record header's highlights write the year on every date (objectui#13331).

A current-year date dropped its year in the strip, so a contract record read "Start Date Sep 15, 2025 | End Date Sep 15" and a contract that ended this September looked like it ended next month. The strip now asks for the year, and both dates read alike. Dates inside the ±7-day window keep their relative phrase ("In 2 days").

`formatDate` takes a new opt-in option, `alwaysShowYear`, which keeps the year on its default face; the `date` and `datetime` cell renderers take an `alwaysShowYear` prop that hands it on. Neither is on by default: grid cells and cards still drop the current year.
