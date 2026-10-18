---
'@object-ui/app-shell': patch
---

**The console no longer offers an object to a caller who cannot read it** (objectui#12109). A navigation entry bound to an object (`type: 'object'`, by its `objectName`) is not drawn in the sidebar or the `nav:menu` block when the caller has no read on that object, and the object's list toolbar actions are not drawn on its list page. Before, a service agent with no read on opportunities saw Opportunities, My Deals and Update Stage, and each one ended on "You don't have access".

- **The verdict** is the permissions the console already loads (`/auth/me/permissions`). No request is made per entry. It is the answer an authored `requiredPermissions: ['OBJECT:read']` already got, now applied by default, and an authored `requiredPermissions` still applies on top.
- **An unknown answer hides nothing.** With no permission provider mounted, every entry is drawn as before.
- **Only `type: 'object'` entries are gated.** A dashboard, report, page, component, action, doc or URL entry is unchanged: none of them names an object in a declared key, and no object is guessed from a route.
- **An area** whose only entries are such objects is not offered in the area switcher, and is not elected as the open area.

**Clause-②: no.** No export, prop, locale key or accept set moves.
