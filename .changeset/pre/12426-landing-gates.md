---
'@object-ui/app-shell': patch
---

An app opens on the first navigation entry the member is shown, not the first entry the server serves (objectui#12426).

Opening an app at its root (`/apps/APP`) used to send the member to the first `object`, `page`, `dashboard`, `report` or `component` entry in the served navigation, even when the sidebar hid that entry from them: an entry whose `visible` does not hold for the member, or an `object` entry on an object they may not read. The member landed on a page full of "You don't have access", with no sidebar entry active.

- **The landing applies the sidebar's gates.** It skips every entry the sidebar does not draw for this member: `visible` (a boolean or an expression), `requiredPermissions`, the runtime-capability gates, and the object-read check. A group whose every child is hidden is skipped too. The sidebar and the landing build these gates in one place, so they cannot disagree again. What the sidebar shows is unchanged.
- **A member shown no entry gets the app's existing empty state.** The app root shows "Nothing in APP is available to you yet" instead of navigating to a page the sidebar hides.
- A member shown every entry lands where they landed before.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
