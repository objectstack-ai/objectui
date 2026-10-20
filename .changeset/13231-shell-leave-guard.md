---
'@object-ui/app-shell': patch
'@object-ui/console': patch
---

The console's own menus ask before they drop a page's unsaved edits (objectui#13231).

A settings page with unsaved edits already asked before a link, its own crumb or a tab close took them (objectui#13163). The shell's menus did not ask: they navigate from a button, which no link listener sees. Help › All documentation, the avatar's Profile, My Organizations and Create organization, the workspace switcher's Manage members and Create organization, and a sidebar entry's ⋯ › Design each left the page at once, and the edits were lost. Picking another organization in the workspace switcher was worse: the switch was sent first and the console then reloaded, so the organization had changed before anything could ask, and even the browser's leave prompt never appeared.

These now ask the page's own question first, and so do the other header departures of the same kind: This app's docs, an app listed in the avatar menu, another app in the app switcher, Log out, and the go-home shortcut. An organization switch asks **before** it is sent. Cancel keeps the page, its URL, the organization and the edits; OK goes on, and the browser does not ask a second time. Nothing asks when no page holds unsaved edits.

`@object-ui/app-shell` exports the seam behind it: a page calls `useRegisterUnsavedEdits(dirty, message)` while it holds edits, with the question to ask, and a departure that starts from a button goes through `confirmUnsavedLeave(go)`, which runs `go` at once when nothing is held and otherwise only after the user confirms. While anything is registered the seam also guards a tab close or reload and a click on an in-app link, so the settings pages and the metadata editor now register with it instead of each installing those listeners.

Not covered: browser Back and Forward, which the console's router gives a page no way to hold, and departures that do not go through `confirmUnsavedLeave` yet, such as picking a page in the command palette.
