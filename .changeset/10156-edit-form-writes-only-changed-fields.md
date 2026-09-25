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
- The concurrency guard is unchanged by this rule. The update carries `ifMatch` = the `updated_at` the form read (after a save, a form that stays open sends the `updated_at` that save returned instead, objectui#10565), and a `409` still offers **Keep editing** or **Overwrite**. **Overwrite** now resends only the changed fields.
- ⚠️ A host `submitHandler` on an edit form receives the payload the form would have written. That is the changed fields, or the full sanitized payload when nothing changed. A host that needs the whole record must read it itself. In this repository, only `MasterDetailForm` passes a `submitHandler` to an edit form. Its header form receives the changed fields. Its row editor has no `recordId`, so it still receives every value.
- The JSDoc of `ObjectFormSchema.submitHandler` in `@object-ui/types`, and its copies on `ModalFormSchema` and `DrawerFormSchema`, now say what an edit-mode handler receives.

**Not covered at this change.** The `tabbed`, `wizard` and `split` variants had save paths of their own and still sent every value they held. That included a master-detail header laid out `tabbed`, and a simple form whose mobile `stepper` option shows it one step at a time through the wizard.

⚠️ **Dated note, 2026-09-25 — those variants have since been covered — objectui#10563.** Later in this same release the `tabbed`, `wizard` and `split` save paths, the `stepper` route and a master-detail header laid out `tabbed` write through the same sequence as the simple form: the same strip, and on an edit the same comparison against the record they read. The rest of this entry is kept as the reading of this change; the objectui#10563 entry states what those layouts now send.
