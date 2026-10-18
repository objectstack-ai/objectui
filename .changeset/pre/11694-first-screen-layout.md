---
'@object-ui/plugin-dashboard': patch
'@object-ui/app-shell': patch
---

Dashboards and reports no longer waste the first screen (objectui#11694).

- **"Refresh All" shares a row instead of taking one.** On a dashboard the refresh button (with its record count) was a full-width row of its own between the filter bar and the widgets. It now sits at the right end of the filter bar's row. On a dashboard without filters it sits at the right of the dashboard's own header when the dashboard draws one, and otherwise stands alone in a row only as tall as the button.
- **The rows above the widgets are as tall as their content.** On a dashboard that declares `columns`, every grid row had a 5rem minimum, the floor chart widgets need. The header and the filter bar row no longer take that minimum. On a filtered dashboard the first row of charts moves up by the height of the old refresh row plus the space the filter bar row left below its controls.
- **A report's card follows its content.** The console report page drew every report inside a card with a 37.5rem minimum height, so a short table sat at the top of a mostly empty frame. The card is now as tall as the report.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
