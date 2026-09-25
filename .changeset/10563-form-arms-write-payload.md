---
'@object-ui/plugin-form': patch
'@object-ui/types': patch
---

The `tabbed`, `wizard` and `split` form layouts now write what the simple form writes (objectui#10563).

**Clause-②: no.** No exported symbol, type or prop changes. The shared sequence lives in an internal module that `index.tsx` does not re-export. The change is in what the client sends, and ⚠️ in what a host `submitHandler` receives from these layouts (see below).

**Before.** The simple form, `ModalForm` and `DrawerForm` strip a save before sending it, and on an edit they send only the fields that differ from the record they read (objectui#10108, objectui#10120, objectui#10156). `TabbedForm`, `SplitForm` and `WizardForm` did neither. An edit sent every value the form held: `id`, `owner_id`, `created_by`, `updated_at`, formula columns, and fields the caller's field-level security refuses. The server answered with a `403` or an unknown-field refusal. A create seeded with a whole record, such as a copy of an existing one, posted those columns too. A simple form whose mobile `stepper` option shows it one step at a time renders through `WizardForm`, so it had the same defect.

**What changed, in observable terms.**

- In edit mode, the `tabbed`, `wizard` and `split` layouts and the `stepper` route write only the fields that differ from the record they read with `findOne`. They use the same comparison as every other layout. A save with nothing changed still sends the full stripped payload, with the same concurrency guard.
- On every save, create or edit, these layouts drop the fields a form never writes. That means server-owned columns, computed, formula and read-only columns, keys the object does not declare, and fields the caller's field-level security refuses. A field whose name is on the server-owned roster, such as `owner`, is not written even when an object declares it as an ordinary field. The other layouts already worked this way.
- A field the caller may read but not edit now renders disabled on these layouts, as on the others, also when a section names it by a bare string. Before, it rendered as a live input. With the strip above, a value typed there would have been dropped while the save reported success.
- After a save succeeds, a form that stays open compares its next save with the record as it now is.
- ⚠️ A host `submitHandler` on one of these layouts now receives, in edit mode, the payload the form would have written. That is the changed fields, or the full stripped payload when nothing changed. A master-detail header laid out `tabbed` therefore sends only its changed fields in the parent operation, as a `simple` header already did.
- With inline `customFields`, the object definition is not used for the strip, as on the simple form. An inline member may name a field the object does not declare, and its value is still sent.
- An empty field whose runtime default the server resolves is left out of the payload whenever the form has no persisted record: `mode: 'create'`, or no `recordId`. That is the rule the simple form and the seeding of these layouts already use. Before, these layouts left it out only when `mode` was `create`.
- The JSDoc of `ObjectFormSchema.submitHandler` in `@object-ui/types` no longer lists these layouts as exceptions. The copies on `TabbedFormSchema`, `SplitFormSchema` and `WizardFormSchema` now say what an edit-mode handler receives.
