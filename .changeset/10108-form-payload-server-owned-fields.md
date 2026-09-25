---
'@object-ui/plugin-form': patch
---

A form no longer emits the columns the server owns, and a master-detail batch sends only the cells the user changed (objectui#10108).

**Clause-②: no** — nothing an author writes changes, and no export moves. `SERVER_OWNED_FIELD_NAMES` is module-scoped inside the package (the package publishes `.` only, from `index.tsx`, which does not re-export `sanitize`), so this is a change to what the client PUTS on the wire, not to the package's face.

**What it was.** The write-side roster in `sanitize.ts` and the render-side roster in `autoLayout.ts` were two hand-written copies of the same list, and they drifted. The render copy had learned to drop `owner_id`; the write copy never did. A form therefore showed the user business inputs only, and sent back every ownership and audit column it had read — `owner_id`, `owning_business_unit_id`, `created_by`, `updated_by` — while dropping `created_at` and `organization_id` from the same payload, because those two happened to be in the write copy.

That is not a cosmetic difference. The platform refuses a write to a system-managed ownership column unless the caller holds the transfer grant, and it cannot tell a round-trip of the value it just served from an attempted ownership transfer. Echoing an UNCHANGED `owner_id` back was therefore a 403 for every role without that grant — and a master-detail save commits as one atomic batch, so one echoed column on one row refused the parent and every sibling row with it. The roles this blocked are the line-entry roles the feature exists for, which by definition do not hold the transfer grant.

**What changed, in observable terms.**

- One roster now serves both readings, so a form never writes a field it refuses to render. The unified list adds `owning_business_unit_id`, `company_id`, `space`, `_id`, `__v`, `created`, `modified`, `modified_by` and the camelCase spellings of the ownership FKs to BOTH sides. ⚠️ If an auto-laid-out form in your app was rendering one of those as an editable input, it no longer does, and no form writes one.
- `sanitizeFormData` also refuses any field the object schema marks `system: true`, whatever it is called — so the next column the platform injects does not need an edit here to be refused.
- A master-detail edit batch sends only the cells that differ from the loaded snapshot, and a row where nothing moved produces no operation at all (it used to be rewritten in full on every save). The comparison resolves everything it cannot settle towards SENDING, so a real edit is never dropped: `1000` and `'1000'` read as different, and a snapshot that does not show a row already linked still gets its FK re-asserted.
- The lifecycle bookkeeping columns (`locked`, `instance_state`, `deleted`, `is_deleted`) are deliberately NOT in the roster — they are plausibly author-writable, and adding them on the strength of the pattern alone would silently drop a value a form was asked to persist.
