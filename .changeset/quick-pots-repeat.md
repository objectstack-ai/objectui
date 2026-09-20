---
'@object-ui/plugin-form': patch
---

fix(plugin-form): `object-form`'s default layout hands a section's `description` to the divider it already draws

An `object-form` that declares `sections` and no `formType` renders through
`SimpleObjectForm`'s grouped branch, which rebuilds each section key by key into
a virtual `section-divider` row. That rebuild copied `label`, the ADR-0089
`visibleWhen`, the objectui#6236 membership claim and the collapse pair — and
not `description`. The key was therefore dropped on the layout an author reaches
by default, while `SectionDivider` (the very component the row renders as) has
always drawn a blurb and the `tabbed` / `wizard` / `split` / `modal` rebuilds all
copied one. Its sibling `label` on the same member arrived, so a titled section
with a blurb rendered the title and silently ate the blurb.

Measured on this branch, arm by arm, through the real renderer: `tabbed`,
`wizard`, `split` and `modal` render it; the default layout and `drawer` did
not. Only the default layout is changed here — the `drawer` miss is a separate
defect and is handed back as a finding rather than fixed under this card.

The boundary that did NOT move: the divider row exists only for a member that
yields a heading (a `name` or a `label`), so a member carrying a `description`
and neither of those still draws no divider and still drops its blurb. That gate
also decides the section predicate and the membership claim, so widening it is a
ruling about other keys, not this one.

`objectFormSectionMembers-8071`'s sixth row pinned the drop as behaviour; it is
rewritten onto the new behaviour in this same change, plus a row pinning the
boundary above. `registry-inputs-spec-parity`'s member-pin ledger entry for
`object-form.sections` described the old row in prose and is corrected with it —
no published behaviour of `@object-ui/console` changes.
