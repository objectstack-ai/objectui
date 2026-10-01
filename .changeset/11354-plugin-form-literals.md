---
---

No package released. `@object-ui/plugin-form`'s `DrawerForm`, `ModalForm`, `SplitForm`, `TabbedForm` and `WizardForm` each build a child `form` node and hand it to `SchemaRenderer`. Each node is now a `FormSchema` const before it reaches `SchemaRenderer`. Written inline in `SchemaRenderer`'s `schema` slot, which is typed `BaseSchema`, the node was checked against `BaseSchema` rather than against the `FormSchema` the `form` renderer reads (objectui#11354, preparing objectui#8347's removal of `BaseSchema`'s index signature).

No key is added, removed or renamed, and every value is unchanged. No declaration changes: `FormSchema` already declares every key these nodes carry. The rendered output, the props each component accepts, and the published `.d.ts` are unchanged, so there is nothing to release.
