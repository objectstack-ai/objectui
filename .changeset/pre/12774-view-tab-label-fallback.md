---
'@object-ui/app-shell': patch
---

A view stored with no `label` is named by its object's plural label on the object page, never by its qualified name (objectui#12774). The spec gives a view's `label` no default, and since objectstack PR #24013 the server no longer invents one from the view's `name`, so such a view's tab, its entry in the mobile view switcher and the record page's way back to it read, for example, "QA Gates" instead of `recheck_gate.default`. One function now names a view in all three places. A catalogue entry for a client-derived view (`_views.KEY.label`) still names it, and an authored or served label is drawn exactly as before.

Clause-②: no
