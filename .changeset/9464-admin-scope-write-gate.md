---
"@object-ui/app-shell": patch
---

Stop the Studio permission matrix' Delegated Admin Scope editor authoring an
`adminScope` the framework spec refuses, and make the section's collapsed badge
report a scope it is carrying (objectui#9464).

`AdminScopeSchema` makes `businessUnit` the one REQUIRED key — the other five
carry defaults — so `{ includeSubtree: true }` is refused wholesale. The facet
patched the draft key by key from every control, so flipping **Include subtree**
or any of the three manage-\* switches, or picking an assignable permission set,
_before_ naming a business unit wrote exactly that object. There is no
client-side parse of the facet before Save, so the refusal surfaced as a server
error on the author's next whole-record Save — of a record they may have been
editing for entirely unrelated reasons.

The summary badge made it hard to self-diagnose: it counted `businessUnit` and
`assignablePermissionSets` only, so the collapsed section read "nothing
configured here" for a draft that had just blocked Save, pointing the author away
from the section that caused it.

Both halves are closed:

- The dependent controls (Include subtree, the three manage-\* switches, the
  assignable-set buttons) are disabled, with the reason named in the section,
  until a business unit is typed. They write nothing while the boundary is
  missing; the business-unit input itself is ungated, and it is what lifts the
  gate.
- The badge now counts any scope the draft carries, so a section holding state
  never reports that it holds none — including a draft that already carries an
  unsaveable scope from before this change.

**Nothing is pruned.** A scope already carrying flipped switches keeps every one
of them: a permission editor that quietly un-does an author's input would be a
worse defect than the one this closes. An already-poisoned draft is recovered by
naming the business unit its switches were always missing.

One new designer label, `perm.admin.businessUnitRequired`, in both the `en` and
`zh` tables.
