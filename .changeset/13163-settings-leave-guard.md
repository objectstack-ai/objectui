---
'@object-ui/console': patch
---

A settings page asks before it lets unsaved edits go (objectui#13163).

Every `system/settings/:namespace` page keeps its edits in a draft and shows "N unsaved changes" at the bottom, but nothing stood between that draft and leaving the page: a click on another page in the sidebar navigated at once and the edits were gone. While the bar is shown, the page now asks "You have unsaved changes. Are you sure you want to leave?" (the existing `form.unsavedChanges` question, in all ten languages) before:

- **a link to another page of the console**, including another settings namespace. Cancel keeps the page, its URL and the edits; OK leaves, and the edits go with the page.
- **its own "All settings" crumb.**
- **closing the tab or reloading**, through the browser's own "Leave site?" prompt.

It does not ask for a link to the page already shown, a click that opens a new tab or window, a download, or a link to another site (that one is the browser's leave prompt). Nor does it ask once the page is clean again, after a save or a Discard. The prompt is the browser's `confirm`, as the Setup app's metadata editors already use.

Not covered: browser Back and Forward, which the console's router gives a page no way to hold.
