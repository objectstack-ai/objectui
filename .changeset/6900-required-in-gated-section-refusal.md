---
'@object-ui/app-shell': patch
---

The metadata designer's view inspector now refuses a form view that puts an object-required field
inside a section gated on identity, feature, host or page state (objectui#6900, ruling 5749269225).

When a form section's `visibleWhen` reads `current_user` (or its aliases `user`, `ctx.user`,
`os.user`), `features`, `app` or `page`, and the section holds a field the bound object declares
`required`, the inspector reports one blocking issue per such field through its existing
blocking-issues channel. The editor's Save stays disabled while any is reported, on both the
selected-variant inspector and the no-selection view panel. The inspector shows the refusal: it
names the field and says it is required on the object, names the section and its predicate, and
lists the three fixes (move the field out of the section, drop the predicate, or make the field
not required on the object).

The server never evaluates a form section's predicate, so without this the view saves and the form
cannot be completed whenever the section is hidden. A section gated only on `record`, `previous`,
`parent`, `data` or a bare field draws no issue; those predicate shapes stay with the build-time
lint's `requiredWhen` teaching. The live schema check of the draft stays advisory and does not gate
Save. Nothing changes on the server.
