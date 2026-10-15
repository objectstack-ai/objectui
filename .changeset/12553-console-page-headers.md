---
'@object-ui/app-shell': patch
'@object-ui/console': patch
---

Console pages: Flow Runs, Integrations & APIs, Audit Log, AI Approvals, Applications, Profile, the Settings hub and each settings namespace page draw the console page header an object list, a dashboard and the Approvals Inbox draw (objectui#12553).

- **One page header.** Each page renders `ConsolePageHeader` from `@object-ui/app-shell` in place of its own large `h1`, icon and subtitle line: an icon chip, the title, the subtitle beside the title from the `sm` breakpoint up, and the page's header actions on the right, in one row across the page above its padded body. Audit Log keeps Refresh and Applications keeps New App in that row; New App is now the small button every header action is. A page that drew no icon (AI Approvals, Applications, Profile) draws no chip, and a settings namespace page draws its manifest's icon when the manifest names one. The texts and their keys are unchanged.
- **One header height.** The console page header's title row is now at least as tall as its icon chip, so a header with no icon and no action (AI Approvals, Profile) is as tall as every other page's, an object list's included.
- **Settings namespace pages.** The Beta badge sits beside the title inside the header, as an object list's badge does, and the manifest's description is the subtitle. Back to settings stays at the top of the page body.
- **Below `sm`.** Each page keeps its header on a phone: the icon, the title and its actions in one row. The header hides the subtitle below `sm`, so these pages' subtitles are no longer drawn there; Applications' New App no longer stacks under the title.

**Clause-②: no.** No export, prop, type member or i18n key is added or removed; the pages consume the existing `ConsolePageHeader` export.
