---
'@object-ui/layout': patch
'@object-ui/app-shell': patch
---

A sidebar navigation group now opens on first view unless it declares `expanded: false` (or the legacy `defaultOpen: false`), however many entries it holds (objectui#13336).

`NavigationRenderer` used to collapse any group that declared neither field once it had eight or more children. On Setup that closed Configuration (13 entries) although only Advanced declares `expanded: false`, hiding entries such as Localization, Email and Authentication on first view. The count rule is gone: a group holding the current route opens; otherwise its declared `expanded` / `defaultOpen` decides; otherwise it opens. Studio's navigation preview follows the same rule, so it still matches the running sidebar.

An app that relied on a long, undeclared group starting closed should now declare `expanded: false` on it.
