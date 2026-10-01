---
'@object-ui/app-shell': patch
---

fix(app-shell): a datasource created as External or Validate only, or switched to either from Managed, now saves without a credential (objectui#11368)

The datasource editor offers three schema modes: Managed, External and Validate only. The
platform requires a datasource in External or Validate-only mode to carry an `external` block,
and since objectstack#21133 the datasource admin door checks this before it saves. The editor
never sent the block. So a datasource saved in either mode without a credential was refused
with "schemaMode='external' requires 'external' settings", and the form had no field that could
fix it. With a credential the Save went through, because the stored credential reference
supplied the block.

The editor now sends an empty `external` block in two cases: when it creates a datasource as
External or Validate only, and when it switches a Managed datasource to either mode. It sets no
member, because the form edits none and every member has a default. Both now save with or
without a credential, and the saved datasource is valid. Managed datasources send no block, as
before.

Editing a datasource that is already External or Validate only sends no block, so the server
keeps the stored one. That stored block can hold federation settings the form cannot show, such
as `allowWrites` and `allowedSchemas`, and an edit keeps them. Sending an empty block there
would have erased them.

One case is not covered. An earlier console could save a datasource in either mode without a
credential, which left it with no block, and editing that row still gets the server's
`external` refusal. To repair it, save it as Managed, then switch it back.

The server is still the only judge of the record. If it refuses a Save for another reason, the
editor shows the server's message, as before.
