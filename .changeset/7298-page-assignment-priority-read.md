---
---

Remove the unreachable `priority` read from `usePageAssignment`, so the hook's
behaviour and its declared contract agree (objectui#7298, half ①).

The hook sorted its record-page candidates on a `priority` key read off the
page. `PageSchema` is a `strictObject` and does not declare `priority`, so no
author could ever set one: writing it is a hard parse error, and omitting it
left every candidate at `0`. Re-measured against the resolved pin
`@objectstack/spec` 17.4.0 — still strict, and `priority` is refused with
`unrecognized_keys`, the same way a nonsense key is, with a declared key
(`isDefault`, `icon`) accepted as the positive control.

No package is released by this change. Selection was already decided by
declaration order in every reachable case — `Array.prototype.sort` is stable
and the comparator returned `0` for every pair — and that is now pinned with a
multi-candidate set asserting which page is returned, including the collision
every stock install has (`@objectstack/platform-objects` ships
`sys_user_detail` for `sys_user`, so any app authoring its own `sys_user`
record page has exactly two candidates).

The file's own header comment already recorded that the ordering was not live;
it now tells the same story as the code.
