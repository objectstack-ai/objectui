---
'@object-ui/plugin-form': patch
'@object-ui/fields': patch
---

A form no longer submits — nor offers — a field the CALLER may read but not edit (objectui#10120).

**Clause-②: no** — no exported symbol is added, removed, renamed or retyped, no key on a published payload moves, and no accept set is relaxed. `sanitizeFormData` gains an optional third argument and `fieldWriteGate` / `applyFieldPermissions` are new, but `@object-ui/plugin-form` publishes `.` only, from `index.tsx`, which re-exports neither module — measured on the built `dist/index.d.ts`, where neither name appears. `LookupField`'s props are unchanged. What moves is what the client PUTS on the wire and which controls it draws.

**What it was.** The platform refuses a write to a field the caller's permission set marks `editable: false`, and it cannot tell a round-trip of the value it just served from an attempted write. A form echoing an UNCHANGED `score` back is therefore a 403 for the whole save, even when the user touched only a field they *are* allowed to edit — so the standard edit form was unusable for any role with a field-level restriction on it. The list view's inline grid succeeded on the same record for the same user, because it sends only the changed cell.

The verdict that answers 「may this caller edit this field」 already existed and one path already used it: `checkField(object, field, 'write')` in `@object-ui/permissions`, reading the server's `/me/permissions` grant. What had gone wrong is that each form container spelled its own COPY of the strip and of the render pass, and the family had drifted — the same defect class as objectui#10108, one layer up. Measured on one record with one permission set: the simple form and the modal withheld `score` while the drawer sent it, and the drawer rendered it as a live input while the other two rendered it disabled. One family, three answers; the third container carried neither half.

**What changed, in observable terms.**

- The field-level verdict now arrives at the ONE outbound filter as a predicate (`sanitizeFormData`'s `canEdit`), instead of as a strip loop written out after each container's call. ⚠️ `DrawerForm` previously sent every displayed field regardless of the caller's field permissions; it no longer does. `ObjectForm` and `ModalForm` already withheld the refused field, and still do — their loops were correct, they were just copies.
- The render pass is likewise one function for all three containers. ⚠️ `DrawerForm` previously drew a field the caller may read but not edit as a live input; it now draws it read-only and disabled, exactly as the other two already did. A field the caller may not READ is dropped, also as before.
- Both halves stay fail-open with no `PermissionProvider` / `MePermissionsProvider` mounted, unchanged: a standalone form, a designer preview and a guest surface have no resolvable principal, and the server still enforces.
- A lookup's selected chip no longer offers its remove ✕ when the field is disabled. ⚠️ This is how BOTH refusals reach the widget — a field the object declares `readonly` is folded into `disabled` by the form's section builder, and a field the permission set refuses is marked disabled by the pass above — so a reporter could previously clear a master-detail parent the server would then refuse to unset. The trigger and the browse button were already disabled; the chip's ✕ was the one control the gate had missed. The chips themselves stay: the value is readable, only the affordance goes.

**Deliberately not here.** Submitting only DIRTY fields is objectui#10156, filed with its own risk argument (a false CLEAN silently drops a user's edit and returns 200). Naming the refused field in the 403 instead of the generic console message is owned by the producing side.
