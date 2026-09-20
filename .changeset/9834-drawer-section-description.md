---
'@object-ui/plugin-form': patch
---

fix(plugin-form): the drawer arm hands a section's `description` to the divider it already draws

An `object-form` rendered as `formType: 'drawer'` dropped its sections'
`description`, and it dropped it one layer LATER than the default layout did.
`ObjectForm`'s drawer map copies the key onto `DrawerFormSectionConfig` — which
has always declared it — and `DrawerForm`'s own `section-divider` pushes then
rebuilt the row key by key without it. So the author wrote the key correctly,
the first layer passed it correctly, and the last layer did not take it. The
sibling member `label` arrived in the same call, so a titled section with a
blurb rendered the title and silently ate the blurb.

Both of that file's pushes dropped it and both are repaired: the
explicit-sections one (the shape a form view authors) and the
derived-fieldGroups one (the fallback the drawer takes when the object's own
metadata declares `fieldGroups` and the host passes no sections). One key copied
onto each push; nothing else in the renderer moved.

⛔ No gate was widened. The condition that decides whether a divider row is
drawn at all also decides the ADR-0089 section predicate and the objectui#6236
membership claim that gates the whole group, so it is a ruling about other keys.
The derived push keeps its heading gate untouched, and a derived group with no
heading still draws no divider and still drops its blurb. ⚠️ The
explicit-sections push, by contrast, was ALREADY unconditional, so once the key
is copied a drawer section carrying a `description` and no heading renders the
blurb alone — where the default layout draws nothing for the same member. That
is a consequence of copying the key, not of touching the gate, and it is pinned
as a reading.

The drawer arm's behaviour here was watched by nothing before this change. It
now has its own pin, `drawerFormSectionDescription-9834`, covering both routes a
host can take into `DrawerForm` — through the real `ObjectForm` with
`formType: 'drawer'`, and mounted directly — plus the derived-fieldGroups push,
an absence control and the ungated-push reading above.
`objectFormSectionMembers-8071` carried a sentence about which arms render a
blurb for a headingless member, which this change makes false; it is corrected
in the same change, as is the member-pin ledger entry for `object-form.sections`
in `registry-inputs-spec-parity`, whose prose describes the behaviour being
repaired. No published behaviour of `@object-ui/console` changes.
