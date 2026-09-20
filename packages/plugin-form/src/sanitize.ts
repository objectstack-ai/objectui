/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The refused-field roster: every field name the SERVER owns on write.
 *
 * ## What it is
 *
 * The framework's `applySystemFields` stamps these columns onto every business
 * object — record identity, audit provenance (`created_*` / `updated_*`), and
 * the reassignable ownership / tenancy FKs (`owner_id`,
 * `owning_business_unit_id`, `organization_id`, `tenant_id`, `company_id`,
 * `space`). They are not author-declared business data, and a form may never
 * write one.
 *
 * ## Why one roster, and why it is THIS roster
 *
 * `filterSystemFields` in `autoLayout.ts` reads the same set to decide what an
 * auto-laid-out form RENDERS, in create and edit mode alike. The two readings
 * are deliberately the same object, because the invariant they express is one
 * invariant: **a form never writes a field it refuses to render.** Spelling the
 * refusal separately at each call site is how they drifted — the render side
 * had dropped `owner_id` since it was written, while the write side had not, so
 * an edit form that showed the user two business inputs still sent back every
 * ownership and audit column it had read (objectui#10108).
 *
 * That drift is not a cosmetic one. The platform refuses a write to a
 * system-managed ownership column unless the caller holds the transfer grant
 * (`allowTransfer` / `modifyAllRecords`), and it cannot tell a round-trip of
 * the value it just served from an attempted ownership transfer. So a form
 * echoing an UNCHANGED `owner_id` back is a 403 for every role that does not
 * hold the grant — which, for a line-entry role, is the whole point of the
 * role. The master-detail save sends its operations as one atomic batch, so a
 * single echoed column refuses the entire save.
 *
 * ## What is deliberately NOT here
 *
 * The lifecycle bookkeeping columns (`locked`, `instance_state`, `deleted`,
 * `is_deleted`) are left out. They are plausibly author-writable — a workflow
 * or an admin form that drives record state is writing business meaning, not
 * echoing provenance — and nothing has measured them refusing a write. Adding
 * one here on the strength of the pattern alone would silently drop a value a
 * form was asked to persist, which is the failure direction this module must
 * not take.
 *
 * ⚠️ A name list alone cannot close the class: the NEXT injected column the
 * platform adds will not be in it. {@link sanitizeFormData} therefore branches
 * on the spec `system` flag first whenever a field definition is available —
 * that flag is the registry's own mark on everything it injects, and
 * `isSystemManagedField` in `@object-ui/types` reads the same one. This roster
 * is the fallback for metadata that arrives without the flag.
 */
export const SERVER_OWNED_FIELD_NAMES: ReadonlySet<string> = new Set<string>([
  // Record identity
  'id', '_id', '__v', '_version', '_rev',
  // Audit provenance
  'created', 'created_at', 'createdAt', 'created_by', 'createdBy',
  'modified', 'modified_by',
  'updated_at', 'updatedAt', 'updated_by', 'updatedBy',
  'last_modified_at', 'lastModifiedAt', 'last_modified_by', 'lastModifiedBy',
  'deleted_at', 'deletedAt',
  // Ownership / tenancy — the transfer-grant family (objectui#10108)
  'owner', 'owner_id', 'ownerId',
  'owning_business_unit_id', 'owningBusinessUnitId',
  'organization_id', 'organizationId', 'org_id', 'orgId',
  'tenant_id', 'tenantId', 'company_id', 'companyId', 'space',
]);

/**
 * Field types that are read-only / computed and must not be persisted.
 */
const COMPUTED_FIELD_TYPES = new Set([
  'formula',
  'summary',
  'rollup',
  'lookup_value',
  'auto_number',
  'autonumber',
  'computed',
]);

/**
 * Strip server-owned and computed fields from a form payload before sending
 * it to `dataSource.create()` / `dataSource.update()`.
 *
 * - Drops every name in {@link SERVER_OWNED_FIELD_NAMES}.
 * - When `objectSchema` is provided, drops any field the spec marks
 *   `system: true` — the registry's own mark on the columns it injects, so a
 *   column added to the platform after this module was written is refused
 *   without anyone editing the roster.
 * - When `objectSchema` is provided, drops fields that are flagged as
 *   `computed` / `formula` / `readOnly` or whose type is in
 *   {@link COMPUTED_FIELD_TYPES}.
 * - When `objectSchema` is provided, also drops keys that don't appear in
 *   `objectSchema.fields` at all (these are typically server-projected
 *   relationships or flattened lookups like `full_name`).
 *
 * The two server-owned branches are separate on purpose and neither subsumes
 * the other: the name roster fires with no schema at all (an inline form passes
 * `null`), and the `system` flag fires for a name the roster has never heard
 * of.
 */
export function sanitizeFormData(
  data: Record<string, any>,
  objectSchema?: { fields?: Record<string, any> } | null,
): Record<string, any> {
  if (!data || typeof data !== 'object') return data;

  const out: Record<string, any> = {};
  const fields = objectSchema?.fields;

  for (const [key, value] of Object.entries(data)) {
    if (SERVER_OWNED_FIELD_NAMES.has(key)) continue;

    if (fields) {
      const fieldDef = fields[key];
      // Drop unknown keys (flattened/derived projections like full_name).
      if (!fieldDef) continue;
      // The registry stamps `system: true` on every column it injects. Reading
      // the flag rather than only the roster is what stops the NEXT injected
      // column repeating objectui#10108 — the platform's ownership guard
      // refuses an echoed value the same way whatever it is called.
      if (fieldDef.system === true) continue;
      const t = String(fieldDef.type || '').toLowerCase();
      if (COMPUTED_FIELD_TYPES.has(t)) continue;
      if (fieldDef.computed === true) continue;
      if (fieldDef.formula) continue;
      if (fieldDef.readOnly === true || fieldDef.readonly === true) continue;
    }

    out[key] = value;
  }

  return out;
}
