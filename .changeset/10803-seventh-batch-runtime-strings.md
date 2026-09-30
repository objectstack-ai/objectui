---
'@object-ui/app-shell': patch
'@object-ui/plugin-detail': patch
---

fix(app-shell, plugin-detail): the unmapped activity type warnings no longer point at an objectstack issue that answers 404

`@object-ui/app-shell` warns on the console, once per value, when a `sys_activity` row's
`type` maps to no activity item type, and `@object-ui/plugin-detail`'s `[record:activity]`
block does the same when it maps to no feed item type. Both messages said `sys_activity.type` is
author-extensible with a pointer to an objectstack issue that answers 404 beside the
ruling's date. A reader of a console warning has no repository to resolve a commit
against, so the pointer is dropped rather than replaced: both now read "author-extensible
(ruled 2026-08-24)" (objectui#10803).

Nothing else in either message moves, and what renders, and when and how often each
warning fires, are unchanged.
