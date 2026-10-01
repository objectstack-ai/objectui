---
'@object-ui/app-shell': patch
---

fix(app-shell): an External or Validate-only datasource now saves without a credential (objectui#11368)

The datasource editor offers three schema modes: Managed, External and Validate only. The
platform requires a datasource in External or Validate-only mode to carry an `external` block,
and since objectstack#21133 the datasource admin door checks this before it saves. The editor
never sent the block. So creating an External or Validate-only datasource without typing a
credential was refused with "schemaMode='external' requires 'external' settings", and the form
had no field that could fix it. With a credential the Save went through, because the stored
credential reference supplied the block.

The editor now sends an empty `external` block for these two modes. It sets no member, because
the form edits none and every member has a default. Saving works with or without a credential,
and the saved datasource is valid. Managed datasources send no block, as before.

Editing works the same way when a Managed datasource is moved into External or Validate only.
Editing a datasource that is already External or Validate only sends no block. The server then
keeps the stored one, including federation settings such as `allowWrites` and `allowedSchemas`
that the form cannot show. Sending an empty block there would have erased them.

The server is still the only judge of the record. If it refuses a Save for another reason, the
editor shows the server's message, as before.
