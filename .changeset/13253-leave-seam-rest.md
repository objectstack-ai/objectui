---
'@object-ui/app-shell': patch
---

The command palette, the inbox and the AI entry ask before they drop a page's unsaved edits (objectui#13253).

The console's header menus already asked before leaving a page with unsaved edits (objectui#13231). Other ways out still left at once, and the edits were lost: picking a page, a record, a report or a recently viewed item in the command palette, switching app from the palette, the inbox's View approvals, View all notifications and activity drills, a notification's own link, and maximizing the chat dock to the full AI page. They now ask the page's question first. The palette closes as before, then asks. Cancel keeps the page and its edits; OK goes on. Nothing asks when no page holds unsaved edits.

Studio's design surface and the permission matrix now register their unsaved edits with the same seam, so the console's menus, the palette, the inbox and the AI entry ask before leaving them too. A Studio pillar link asks once, through the seam, instead of asking a second time after OK.

Not covered: browser Back and Forward, which the console's router gives a page no way to hold.
