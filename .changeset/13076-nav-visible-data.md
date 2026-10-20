---
'@object-ui/types': minor
---

`NavigationItemSchema` now refuses a navigation entry whose `visible` reads `data` but which declares no `dataSource`, as `@objectstack/spec`'s `NavigationItemSchema` already does (objectui#13076). The rule is the spec's own exported `navItemVisibleDataNeedsDataSource`, chained on every navigation arm (the flat arm and the `doc` arm), not restated, so `objectui validate` and the platform's save door refuse the same entry with the same issue at `visible`.

This narrows the published validator toward the spec: an entry such as `{ id: 'nav_envs', type: 'object', objectName: 'sys_environment', visible: 'data.total == 1' }` validated clean here and failed at publish; it is now refused here too. Declare the `dataSource` whose bound value `visible` reads, or gate on `current_user` or `features` instead. An entry with a `dataSource`, or whose `visible` is a boolean, absent, or reads no `data`, is unaffected.
