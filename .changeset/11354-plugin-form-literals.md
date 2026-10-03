---
---

No package released. `@object-ui/plugin-form`'s `DrawerForm`, `ModalForm`, `SplitForm`, `TabbedForm` and `WizardForm` each build a child `form` node and hand it to `SchemaRenderer`. Each node is now a `FormSchema` const before it reaches `SchemaRenderer`. Written inline in `SchemaRenderer`'s `schema` slot, which is typed `BaseSchema`, the node was checked against `BaseSchema` rather than against the `FormSchema` the `form` renderer reads (objectui#11354, preparing objectui#8347's removal of `BaseSchema`'s index signature).

No key is added, removed or renamed, and every value is unchanged. No declaration changes: `FormSchema` already declares every key these nodes carry. The rendered output, the props each component accepts, and the published `.d.ts` are unchanged, so there is nothing to release.

⚠️ **Dated note, 2026-10-02 — the prop takes the declared-node union — objectui#11466.** At this change a node written inline in `SchemaRenderer`'s `schema` slot was checked against `BaseSchema`; now, later in this same release, the slot is `DeclaredNode | string | null | undefined`, the union of the declared node types keyed by `type`, so an inline `form` node is checked against `FormSchema`. The rest of this entry is kept as the reading of this change.
