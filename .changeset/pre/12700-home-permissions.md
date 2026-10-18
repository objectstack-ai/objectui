---
'@object-ui/app-shell': patch
'@object-ui/console': patch
---

Home answers a `current_user.can()` navigation gate from the caller's permissions (objectui#12700).

The console now mounts its one `/auth/me/permissions` source above both `/home` and `/apps/:appName/*`, so moving between them keeps a single answer and asks for it once per session load. `/studio/*` stays outside it. Home waits for that answer the way an app already did, with the same loading screen and the same error screen with Retry.

`HomeLayout` now mounts the predicate scope for Home's navigation gates (the bell's and the activity card's roster, and the command palette's list) and binds that answer for `current_user.can(OBJECT, VERB)`. A member without the grant does not get the gated entry, a member with it does, and Home no longer reports "this evaluation context carries no permission data" on every load. Without a permission provider above it, the gate is withheld and reported once, as before. This is UI gating, not a security boundary: the server enforces what a member may read.
