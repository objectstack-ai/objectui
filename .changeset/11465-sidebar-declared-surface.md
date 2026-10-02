---
'@object-ui/types': minor
---

feat(types)!: `SidebarSchema` declares what the `sidebar` node draws — nine unread keys are retired on both faces, and `variant` takes the registration's enum (objectui#11465)

**BREAKING (authoring):** nine members of `SidebarSchema` are retired on both faces (ADR-0049): `title`, `nav`, `content`, `footer`, `position`, `defaultCollapsed`, `collapsed`, `width` and `collapsedWidth`. Each is now a `?: never` tombstone on the TypeScript face, so `tsc` refuses it by name, and the zod mirror refuses it by name with the reason and what to write instead, so `safeValidateSchema`, the strict authoring face and `objectui validate` refuse it. Before this change both faces accepted all nine. The `sidebar` node never read any of them: it draws its `children`, reads `collapsible` and `variant`, and passes `className` to the sidebar element. The rest of the node's keys reached the sidebar panel as HTML attributes (`title` as a hover tooltip, the lists and nodes as `[object Object]`), or React dropped them with a warning. The renderer is unchanged.

**`variant`** is now `'sidebar' | 'floating' | 'inset'` on both faces, the three shadcn values the `sidebar` registration offers; `'sidebar'` is the default. Before, both faces declared `'default' | 'bordered' | 'floating'`, so `objectui validate` refused `'sidebar'` and `'inset'`, which the registration offers, and accepted `'default'` and `'bordered'`, which drew exactly what `'sidebar'` draws. Those two are refused now, with no alias window. A variant shows on the collapsible form only: with `collapsible: false` every value draws the same in-flow column.

**Clause-②: yes** — `variant` gains `'sidebar'` and `'inset'` (widening) and loses `'default'` and `'bordered'`, and nine members narrow to `never` (narrowing). Scored `minor`, not `major`: this repository scores its own breaking changes `minor` and spells the breaking meaning out in the body.

**Migration — one line per key.**

- `title`: compose the heading as a `text` node at the start of `children`.
- `nav`: navigation is application metadata (objectui#11441). Put the links in the app document's `navigation`, which the app shell's sidebar draws; to draw items inside the node, compose them as `children` (for example `button` nodes with `variant: "ghost"`).
- `content`: move the node or nodes into `children`.
- `footer`: compose it as the last entries of `children`.
- `position`, `defaultCollapsed`, `collapsed`, `collapsedWidth`: delete the key. The open state belongs to the sidebar provider (the host's, or the one the node mounts when there is none), and the node never collapses to a narrower width.
- `width`: delete the key. The in-flow form (`collapsible: false`) takes a width utility in `className`, for example `w-72`.
- `variant: 'default'` or `variant: 'bordered'`: write `variant: 'sidebar'`, or delete the key.

```ts
// before: type-checked and validated, and the list drew nothing
const sidebar: SidebarSchema = { type: 'sidebar', nav: [{ label: 'Home', href: '/' }] };

// after: the node draws its children
const sidebar: SidebarSchema = {
  type: 'sidebar',
  collapsible: false,
  children: [{ type: 'button', label: 'Home', variant: 'ghost' }],
};
```

The types README's composition example and `examples/dashboard.ts` now author the `sidebar` node this way. `NavLink` and `NavLinkSchema` stay exported.
