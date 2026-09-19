---
'@object-ui/plugin-form': patch
---

`object-master-detail-form`'s `fields` registration no longer claims to be
"Ignored when `sections` is given", and a section member the top-level `fields`
excludes is now reported instead of vanishing (objectui#9884).

The declaration was the wrong half, ruled from the tree rather than from the
principle. One `SimpleObjectForm` renders this block's parent form and
`object-form` alike — `MasterDetailForm`'s `parentSchema` memo literally builds
a `{ type: 'object-form', ... }` node and renders it through a directly
imported `<ObjectForm>` — and the three sibling `fields` registrations
(`object-form`, `form`, `embeddable-form`) all declare the key as the field
selection with no such exemption, with `objectFormFieldsMembers-8071` pinning
it as one. Honouring the exemption would have falsified three declarations to
satisfy one, and it would have done so on a pool that is not only the layout:
`fields` builds the parent field set that also feeds create defaults, the
`initialValues` merge and the values a submit carries.

So the rendered outcome is unchanged and the intersection stands: the parent
field pool is built from `fields` first, and each section resolves its members
against that pool. What changed is that the loss is audible.
`warnSectionMemberExcludedByFields` (`sectionFields.ts`, beside the two
warnings objectui#8738 and objectui#3090 added) names the section, the member
and the two keys that collided, once per distinct pair, whenever a member the
object really declares is dropped for the sole reason that `fields` omits it —
including the expensive case where it was the section's last surviving member
and the section disappears with its heading. A member the object never declares
at all is deliberately NOT recruited into this warning: it resolves to nothing
whether or not `fields` is authored, which is a different silence with a
different remedy.

The `object-master-detail-form.sections` member pin moves in the same change
rather than after it: its sharp row keeps the two DOM assertions objectui#8071
slice 15 wrote, and gains the warning legs plus a firing control and a leg
keeping the warning off the other silence. Nothing in it was relaxed.

The member-pin ledger moves with it. `apps/console`'s registry-inputs parity
suite carried the old reading in two prose passages — the
`object-master-detail-form.sections` entry quoting the retired sentence and
recording the drop as having no diagnostic and the finding as not acted on, and
the slice-15 narrative repeating the quote. Both now state the ruling. That file
is a test and releases nothing: `@object-ui/console` ships no source from it, so
this declaration covers `@object-ui/plugin-form` alone.

Refs objectui#9884, objectui#8071.
