---
'@object-ui/react': minor
'@object-ui/app-shell': minor
---

fix(react,app-shell): `usePageAssignment` picks a record page by `type` alone — `pageType` is a key `PageSchema` refuses

`usePageAssignment` decided whether a page is a record page with
`p.pageType ?? (p.type === 'record' ? 'record' : undefined)`. `PageSchema` is a
`strictObject` that refuses `pageType` by name: it is one of the schema's
declared aliases of `type`, so a page carrying it is a hard parse error that
names `type` as the key to write. The first operand read a spelling no parsing
page carries, and taught it onward as a live discriminator. The filter now reads
`type` alone, and the comment beside it — which said the designer-side
`record_detail` spelling was "still expressible in raw metadata" — is corrected:
`PageSchema` refuses `pageType`, and `record_detail` left `PageTypeSchema`.

**Behaviour change, for pages that do not parse.** The metadata cache the hook
walks holds `/meta/page` bodies as served — the client runs no schema over
them — so the hook can still be handed a page that carries `pageType`:

- a page with `pageType: 'record'` and no `type: 'record'` is no longer picked;
  the object renders its synthesized default detail page instead;
- a page with `type: 'record'` and some other `pageType` value is now picked.

Every page that parses behaves as before, because none can carry `pageType`.

The mirrors of the same discriminator move with it:

- The navigation page picker (`isStaticPageOption`) reads `type` alone, as the
  hook does. A row carrying `pageType: 'record'` without `type: 'record'` is now
  offered as a static page, and a `type: 'record'` row is excluded whatever its
  `pageType` says.
- `recordPageEnvelope` writes `type: 'record'` and no `pageType`. It used to
  write `type: 'page'` plus `pageType: 'record'`, a body `PageSchema` refuses on
  both keys. The helper has no caller in this repository.
- The record-page preview in the page designer still reads `pageType` on an
  unsaved draft; its comment now says why, and that the runtime does not match
  on it.
