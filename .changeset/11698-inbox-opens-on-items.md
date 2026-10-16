---
'@object-ui/app-shell': patch
---

The inbox bell opens on the tab that has something in it (objectui#11698).

The popover always opened on Notifications. With no unread notifications and three pending approvals, the bell read "3" and the click showed "You're all caught up", with the three approvals behind the next tab.

On each open the popover now picks the first tab with items, in the order Notifications (an unread notification), Approvals (a pending approval), Activity (an activity row). When every tab is empty it opens on the tab the user last selected, or on Notifications if none was selected. A tab the user selects is remembered for the browser tab's session and reopens first, unless it is empty while another tab has items. The tab does not change while the popover is open.
