---
'@object-ui/types': minor
'@object-ui/permissions': minor
---

**BREAKING — removes a published export from two packages.** Retire the
`PermissionGuardConfig` type (objectui#8024, ADR-0049 enforce-or-remove). The
name is deleted from `@object-ui/types`, which declared it, and from
`@object-ui/permissions`, which re-exported it — after this release
`import type { PermissionGuardConfig }` from either package is a compile error,
not a deprecation warning.

The shape the shipped guard reads is **`PermissionGuardProps`**, exported from
`@object-ui/permissions` beside the `PermissionGuard` component. It was never
`PermissionGuardConfig`: the component did not accept the retired type, and the
two disagreed on the key names — `action` there, `permission` here;
`fallbackContent` (a React node) there, `fallbackComponent` (a type-name string)
here; `object` required there, optional here.

**`fallback: 'redirect'` and `redirectPath` never existed as a capability.** They
were declared on the retired type and honoured nowhere: `'redirect'` was never a
member of the `fallback` union `PermissionGuard` switches on, and no code ever
read `redirectPath`. No guard in these packages redirects a denied user, so
removing the two keys takes away no behaviour.

Measured before anything was deleted: the type was a declaration plus the two
barrel re-exports and nothing else — nothing in this repository, the example
apps or the `objectstack` sibling checkout constructed, accepted, annotated or
read one, and `@objectstack/spec` declares no guard-config shape for it to
mirror. Removed outright rather than kept as a `?: never` tombstone, on the
retire-vs-remove discriminator `@object-ui/types` states on `ChatbotSchema` —
cited here, not restated: a whole exported type name has no surviving member to
carry a tombstone. The module has no Zod twin, so the compiler was the only
channel this name ever had, and the refusal now lives there.

## Upgrading

**No runtime behaviour changes.** A value typed against `PermissionGuardConfig`
was never passed to anything that read it.

- **You imported the type only** (the only thing that was possible): delete the
  import, and drop the annotation from any local object that carried it.
- **You guard UI by permission:** use `PermissionGuard` with
  `PermissionGuardProps` — `object`, `action`, and optionally
  `fallback: 'hide' | 'disable' | 'custom'` with `fallbackContent`.
- **You declared `fallback: 'redirect'` or a `redirectPath`:** nothing ever acted
  on either. If a denied user must be sent elsewhere, do it in your own routing
  code; no guard in these packages performs a redirect.
