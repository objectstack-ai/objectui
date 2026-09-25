---
'@object-ui/plugin-form': patch
'@object-ui/types': patch
---

An edit form now writes only the fields that changed (objectui#10156).

**Clause-②: no.** No exported symbol, type or prop changes. `@object-ui/plugin-form` publishes `.` only, from `index.tsx`, and `index.tsx` re-exports neither `sanitize` nor `masterDetailTx`. After a build, `dist/index.d.ts` names none of the new helpers. The change is in what the client sends, and ⚠️ in what a host `submitHandler` receives in edit mode (see below).

**Before.** A master-detail child row already sent only the cells that differed from its loaded snapshot (objectui#10108). The other two edit payloads did not. The plain record edit `PATCH` and the parent operation of a master-detail batch sent every sanitized field on every save, including fields the user never touched. With the concurrency guard, a `409` followed by **Overwrite** therefore rewrote every field, not only the ones this user changed.

**What changed, in observable terms.**

- In edit mode, `ObjectForm`, `ModalForm` and `DrawerForm` compare their save with the record they read through `findOne`, and write only the fields that differ. The parent operation of a master-detail batch follows, because its header is a simple `ObjectForm`.
- There is one comparison, shared with the master-detail child rows. It sends anything it cannot prove unchanged. `null` and `undefined` count as the same value. `null` and `''` are different. So are `5` and `'5'`, a lookup id and its expanded object, a `Date` and a date string, and two objects whose keys come in a different order. A field the form changed by itself after the read, such as a cascade clear, is sent.
- A save with nothing changed still sends the full sanitized payload. It stays a real request, with the same concurrency guard and a real server record for `onSuccess`.
- A form that did not read the record itself still sends every field. That covers a create, a record supplied as `initialData`, and inline `customFields`.
- After a successful save, the form counts the fields it just wrote as saved. A form that stays open compares its next save with the record as it is now. Changing a field back to its first-read value is therefore still sent.
- The concurrency guard is unchanged. The update still carries `ifMatch` = the `updated_at` the form read, and a `409` still offers **Keep editing** or **Overwrite**. **Overwrite** now resends only the changed fields.
- ⚠️ A host `submitHandler` on an edit form receives the payload the form would have written. That is the changed fields, or the full sanitized payload when nothing changed. A host that needs the whole record must read it itself. In this repository, only `MasterDetailForm` passes a `submitHandler` to an edit form. Its header form receives the changed fields. Its row editor has no `recordId`, so it still receives every value.
- The JSDoc of `ObjectFormSchema.submitHandler` in `@object-ui/types`, and its copies on `ModalFormSchema` and `DrawerFormSchema`, now say what an edit-mode handler receives.

**Not covered.** The `tabbed`, `wizard` and `split` variants have save paths of their own and still send every value they hold. That includes a master-detail header laid out `tabbed`, and a simple form whose mobile `stepper` option shows it one step at a time through the wizard.
