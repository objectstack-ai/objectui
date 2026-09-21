---
'@object-ui/plugin-detail': patch
---

fix(plugin-detail): a related list resolves `user` columns to names, like every other list

A record-detail related list drew a `user` column as the stored `sys_user` id — the
32-character opaque string — while the standalone list of the same object, same
record, drew the person's name. The field is not off-spec: `user` is a
reference-bearing type fixed to `sys_user` and a member of `@object-ui/core`'s
`EXPANDABLE_FIELD_TYPES`. One renderer diverged.

Two halves, both now reading the shared family instead of naming types locally.

The auto-fetch asked for no `$expand` at all, so every reference column arrived as
its bare foreign key. It now asks for the roots `buildExpandFields` derives — the
same canonical projection an ordinary list sends — restricted to the authored
columns when the caller named any, minus the parent relationship, which is removed
from every column list this component draws. The roots are FLS-gated on the OUTPUT,
the shape objectui#7215 / objectui#7230 ruled and `DetailView` already uses: asking
the server to resolve a reference discloses more than the bare key does. A child
object with no expandable column sends the byte-identical query it always sent.

The batch label fallback — the path that serves rows a CALLER supplied, and a
backend that does not honour `$expand` — tested `lookup`/`master_detail` in a
private disjunction, two of the family's four members, so a primitive `user` id was
never gathered and never resolved anywhere else either. It now asks the family. A
`user` cell reads no `field.options`, so the resolved name reaches it as the record
shape it documents; the name still comes from the one batch map in this file,
resolved through the target object's declared `nameField` / `titleFormat`, so no
second resolver exists.

⛔ Both halves are pinned on the RENDERED name, against a control that renders the
same column printing the stored id when resolution is made impossible — an absence
proves nothing until the presence has been seen on the same instrument. Identity
pins spy on the `has` of the object core exports, so a member-identical private
copy of the family fails where a membership check would pass on the defect.
