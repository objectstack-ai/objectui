---
'@object-ui/app-shell': patch
---

fix(app-shell): the Studio edit/design affordances follow the server's authoring capability (objectui#10899)

A page's "Edit in Studio" pencil and the top bar's "Design in Studio" hammer
were gated on the workspace-admin ROLE alone. An organization owner is a
workspace admin, but framework's `organization_admin` permission set
deliberately withholds `manage_metadata` (ADR-0066), and
`GET /api/v1/auth/me/permissions` reports that. So on the cloud control plane a
freshly signed-up customer was offered the platform's own page metadata editor.

Both affordances now also require `manage_metadata` through
`useCanAuthorMetadata` — the server's answer, the same one HomePage's builder
CTAs already consume. A server that reports no `systemPermissions` at all
(predating ADR-0066) keeps today's admin-only behaviour, since an unknown answer
fails open; the server refuses the write either way.
