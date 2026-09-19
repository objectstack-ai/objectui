---
'@object-ui/plugin-form': minor
---

`object-form.customFields` now MERGES over the metadata-generated field set, as its
registered description always promised (objectui#9778, maintainer ruling 2026-09-18,
director seat batch #161 item 5).

**Behaviour change, deliberately.** Hosts that used `customFields` as a full
replacement now see the metadata-generated members too. Before this change a
non-empty `customFields` replaced the generated set outright and the object's schema
was never even fetched; the registration has always described the other thing —
"Field definitions merged over the set generated from object metadata. With inline
definitions and no data source, this becomes the only field source." The per-member
merge the prose describes already existed as code in `ObjectForm` — the
`customFields?.find((f) => f.name === name)` lookup inside the metadata branch — and
was unreachable, because that branch ran only when `customFields` was absent or
empty, i.e. only when the lookup had nothing to find.

The merge takes three directions, one pinned case each in
`objectFormCustomFieldsMembers-8071.test.tsx`:

- **override** — a member naming a declared field supplies that field's whole
  definition, in the generated set's position, inheriting nothing from it;
- **keep** — a declared field no member names still renders, from object metadata;
- **append** — a member naming a field the metadata never declares is added after
  the generated set, in authored order.

**Unchanged where there is nothing to merge over.** With no data source (or no
`objectName`) there is no generated set, so the members remain the only field
source — the registration's second sentence, and the shape `EmbeddableForm` uses,
which deliberately passes no data source once inline members are present. An object
the adapter cannot describe now falls back to that same members-only source rather
than replacing a form that used to render with an error panel.

**Migration.** ⛔ No "replace mode" option is added: a host that wants a bespoke set
declares its own form. Two routes exist for a host that wants exactly its member
list against an object that HAS metadata, both through the existing `fields`
whitelist, which narrows the generated set the members merge over (measured):
`fields: []` leaves the members as the whole set, and `fields: ['customer']` renders
that one generated field plus the members. Authors who intended the documented merge
all along need to change nothing.
