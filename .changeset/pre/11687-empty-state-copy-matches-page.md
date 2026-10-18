---
'@object-ui/app-shell': patch
'@object-ui/plugin-list': minor
'@object-ui/i18n': minor
---

An empty list's copy no longer contradicts the page it sits on (objectui#11687).

An identity list (an object managed by the authentication provider) said its records are "not added by hand here", even beside an "Invite User" or "Register OAuth Application" button on the same page. The console now asks whether the page offers a way to add a row: its New button, or a toolbar action the page draws, judged by the same placement, capability and `visible` gates the toolbar applies. When it does, the identity copy is not used and the list shows its own empty state instead. When the toolbar action is hidden (for example a multi-organization-only Invite User in a single-organization deployment), the identity copy stays. The Teams list keeps its own copy, which already names its Create Team button.

A list view emptied by its own declared filter said "No records match your current filters or search." when no filter or search had been applied. That message is now said only when the user applied a filter or a search. A view emptied by its own filter alone keeps the "No matching records" title and reads "No records match this view’s filter.", through a new `list.viewFilterNoMatchesMessage` key in all ten language packs and in `LIST_DEFAULT_TRANSLATIONS`. A list with no filter at all still gets the first-run copy.
