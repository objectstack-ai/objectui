---
'@object-ui/plugin-form': patch
---

fix(plugin-form): `customFields` merges on the drawer and modal arms too

The registered description of `object-form.customFields` is one sentence for
every `formType`: "Field definitions merged over the set generated from object
metadata." The default arm has merged since objectui#9778, but an `object-form`
with `formType: 'drawer'` or `'modal'` (and a `DrawerForm` / `ModalForm` mounted
directly) still REPLACED the generated fields with the members, so the same key
meant two different things depending on the arm.

All three arms now resolve the members through one rule: a member naming a
declared field is that field's whole definition, in its position; a declared
field no member names still renders; a member naming nothing declared is
appended after the generated set, in authored order. With no data source the
members remain the only field source.

`customFields` also no longer switches off the object's `fieldGroups` fallback
or the modal's auto-layout (and so its auto-sized width), matching the default
arm: the groups are derived over the merged field set.

⚠️ Behaviour change for authors who relied on the drawer or modal replacing the
generated set: the object's other fields now appear alongside the members. To
narrow the generated set, list the fields to draw in the `fields` whitelist, as
on the default arm; the members are drawn either way.
