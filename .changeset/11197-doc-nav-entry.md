---
'@object-ui/types': minor
'@object-ui/layout': minor
'@object-ui/app-shell': minor
'@object-ui/plugin-designer': minor
'@object-ui/console': minor
---

feat: a `doc` navigation entry (ADR-0046) validates and draws as a link into the docs portal

`@objectstack/spec` 17.5.0 added a tenth navigation item type, `doc` — `{ type: 'doc', book }`
opens a book, `{ type: 'doc', doc }` opens one page, both opens that page in that book's
context. `objectui validate` refused it: `NavigationItemTypeSchema` was a hand-written list of
the nine older types, while the TypeScript `NavigationItemType`, derived from the spec, already
carried `doc`. And no renderer drew one — `resolveHref` had no `doc` branch, so the entry
rendered as a dead `#` link.

- **`@object-ui/types`** — `NavigationItemTypeSchema` is now read off the discriminator of the
  spec's navigation union instead of hand-listed, so it gains `doc`. A `doc` entry is judged by
  the spec's own `DocNavItemSchema`: it accepts exactly what the spec accepts — at least one of
  `book` / `doc`, a doc NAME (a filename or a path is refused), a snake_case `id`, and the closed
  key set of the spec's `doc` arm — and refuses an empty `label` as every sibling type does. The
  parsed entry is never rewritten. `NavigationEntryItem` gains the spec-derived `book` and `doc`
  members. An unknown `type` is now refused with `invalid_union` at `type` (was `invalid_value`),
  the code the spec's own union answers with.
- **`@object-ui/layout`** — `resolveHref` sends a `doc` entry to the console docs portal under
  its `basePath`: `/docs/DOC`, `/docs/BOOK` or `/docs/BOOK/DOC`. An unlabelled `doc`
  entry shows the page it opens, else the book. It is gated by the same base keys as its
  siblings (`visible`, `requiredPermissions`, `requiresObject`, `requiresService`); the book
  audience gate stays the server's. The mobile tab bar links it the same way.
- **`@object-ui/app-shell`** — the app designer's preview keys its navigation kinds by
  `NavigationItemType`, so a `doc` entry is drawn with its target and route instead of being
  dropped (label-less) or badged `untyped`.
- **`@object-ui/plugin-designer`** — `NAV_TYPE_META` drops the `| 'doc'` key that bridged the
  spec pin lag; it is keyed by `NavigationItemType` alone.
- **`@object-ui/console`** — the docs portal resolves a path segment that is a book's NAME
  rather than its `slug` — what a `{ type: 'doc', book }` entry links to — and redirects to
  the book's canonical slug URL: `/docs/NAME` opens the book, `/docs/NAME/DOC` reads that page
  with the book's sidebar. It is looked up after a book's slug and an installed doc's name, so
  every URL that resolved before answers as it did; only former "Documentation not found"
  answers change.
