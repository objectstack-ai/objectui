---
'@object-ui/app-shell': patch
---

A chart saved view keeps the view tabs on the console list page (objectui#13114).

Since the tabs moved onto the list's toolbar row, a `type: chart` view drew no tabs at all: the chart is drawn instead of the list, so no toolbar carried them, and the only way back to the grid was the browser's Back button. A chart view now draws the tabs in a row of their own above the chart, the same row a view the server refused already uses. Grid and other list views keep the tabs in the toolbar row; no view draws two tab bars, and below the `sm` breakpoint the app bar's view switcher is still the control.

Nothing is added to the package entry: no export, prop or type member.
