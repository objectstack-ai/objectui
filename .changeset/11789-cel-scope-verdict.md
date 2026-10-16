---
'@object-ui/app-shell': patch
---

Studio's flow designer judges a record-triggered flow's Entry condition against the scope the engine binds, and shows one verdict per expression (objectui#11789).

- **`record` is in scope on the Start node.** The engine binds the whole `record` beside the record's flattened fields before it evaluates the start condition, so `record.status == 'done' && previous.status != 'done'` is as valid as `status == 'done' && previous.status != 'done'`. The Start node used to leave `record` out, and the editor showed "Valid CEL" together with "`record` is not a reference in scope at this step." An edge leaving the Start node reads the same scope, so its guard accepts `record` too.
- **`previous` follows the pre-image.** It is in scope on update, create-or-update and, new here, delete triggers, where the engine binds the deleted row as `previous`. It stays out on a create trigger, where the engine binds it only as `null`, so a member read of it fails when the flow runs. A schedule, manual or API flow gains neither `record` nor `previous`.
- **One verdict.** When the Entry condition names a reference that is not in scope at the node, the scope note replaces "Valid CEL" in the raw CEL editor instead of appearing below it. Other surfaces of that editor, the permission set's row-level security clauses among them, are unchanged.

**Clause-②: no.** No export, exported type or language-pack key changes. The editor's new optional input is internal to the package and is not reachable from its entry.
