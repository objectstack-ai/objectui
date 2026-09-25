/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * 「May this caller edit this field?」 — asked once, of the resolver that owns
 * the answer (objectui#10120).
 *
 * ## The one answer, and where it lives
 *
 * `checkField(object, field, 'write')` in `@object-ui/permissions` IS that
 * resolver: `MePermissionsProvider` reads the server's `/me/permissions`
 * envelope, looks the caller's field-level grant up by `"<object>.<field>"`,
 * and falls back to the object-level `allowEdit` for a field the permission
 * set never mentions. ⛔ Nothing in this module re-derives any rung of it. It
 * only ADAPTS that one verdict into the two shapes a form container needs:
 *
 *  - {@link fieldWriteGate} — the predicate `sanitizeFormData` takes, so the
 *    OUTBOUND payload never carries a field the caller may read but not edit;
 *  - {@link applyFieldPermissions} — the field-list pass that decides what
 *    RENDERS, so the form does not offer an affordance whose write the server
 *    will refuse;
 *  - {@link applyColumnPermissions} — the same pass over a line-items grid's
 *    columns, spelled in the one lock the grid reads (objectui#10163).
 *
 * And one form-level step built on the render pass: {@link gateFormFields},
 * which adds the ADR-0092 D4 managed-object lock to it. It is the ONE step
 * every `ObjectForm` layout draws its resolved fields through (objectui#10612).
 *
 * ## Why both halves live in one module
 *
 * They express ONE invariant — *a form never submits a field it refuses to
 * render editable* — and that is the same invariant `sanitize.ts` states for
 * the server-owned roster. Spelling it separately at each container is how it
 * drifted: `ObjectForm` and `ModalForm` each carried their own copy of the
 * outbound strip and of the render pass, and `DrawerForm` — the third
 * container of the same family, reachable from the same authored
 * `formType: 'drawer'` metadata — carried NEITHER. Measured before this
 * module existed: the same edit, on the same record, with the same permission
 * set, sent `score` (field-level `editable: false`) from the drawer and
 * withheld it from the other two, and the drawer rendered it as an enabled
 * input while the other two rendered it disabled. One family, three answers.
 *
 * ## Fail-open is preserved, deliberately
 *
 * With no `PermissionProvider` / `MePermissionsProvider` mounted (`isLoaded`
 * false) every function here is a no-op and the form behaves exactly as it did
 * before permissions existed. That is the standing contract of this seam — a
 * standalone form, a designer preview and a public/guest surface have no
 * resolvable principal, and the server still enforces. Tightening it here
 * would brick those surfaces without adding any security the server does not
 * already provide.
 *
 * ⚠️ The managed-object lock {@link gateFormFields} adds is NOT a
 * per-principal answer, so it does not fail open with the field-level half:
 * its first input is the object's own `managedBy` bucket and `userActions`,
 * read with no principal at all, exactly as the default arm has always read
 * it. Only its second input — the server's effective API operation set — is
 * absent without a provider, and absent leaves the bucket's answer standing.
 */

import { resolveEffectiveCrudAffordances, type SchemaLike } from '@object-ui/core';

/**
 * The permission surface this module consumes — structurally the subset of
 * `usePermissions()` that answers the write question. Declared structurally so
 * `@object-ui/plugin-form` binds to the two members it actually reads rather
 * than to the whole context type.
 */
export interface FieldWritePrincipal {
  isLoaded: boolean;
  checkField: (object: string, field: string, action: 'read' | 'write') => boolean;
}

/** A field-name predicate: `true` when the caller may write that field. */
export type FieldWriteGate = (fieldName: string) => boolean;

/**
 * Build the outbound write gate for one object, or `undefined` when there is
 * no resolved principal to ask.
 *
 * `undefined` rather than an always-true function on purpose: the callers hand
 * this straight to `sanitizeFormData`, whose option is absent-or-predicate, so
 * an unresolved principal produces the byte-identical payload it produced
 * before this gate existed.
 */
export function fieldWriteGate(
  perms: FieldWritePrincipal | null | undefined,
  objectName: string,
): FieldWriteGate | undefined {
  if (!perms?.isLoaded) return undefined;
  return (fieldName: string) => perms.checkField(objectName, fieldName, 'write');
}

export interface ApplyFieldPermissionsOptions {
  perms: FieldWritePrincipal | null | undefined;
  objectName: string;
  /** A `view`-mode form renders everything read-only already. */
  mode?: string;
  /**
   * Optional hint placed on a field the caller may read but not edit, used
   * only when the field declares no description of its own. `ObjectForm`'s
   * simple variant is the one container that shows it.
   */
  deniedDescription?: string;
}

/**
 * The ONE render pass, independent of how a container spells "not editable".
 *
 * It asks the resolver the two questions and decides one of three outcomes per
 * entry — omit, keep, or hand to `markDenied` — so every container that renders
 * through it agrees on WHICH fields are refused. What differs between them is
 * only the vocabulary their widget reads for "this one is locked", which is
 * what `markDenied` supplies (objectui#10163).
 *
 * Entries with no `name` (a section divider, a string field reference the
 * container has not resolved yet) pass through untouched — there is nothing to
 * ask the resolver about.
 */
function gateByPermission<T extends Record<string, any>>(
  fields: T[] | undefined,
  perms: FieldWritePrincipal | null | undefined,
  objectName: string,
  mode: string | undefined,
  markDenied: (entry: T) => T,
): T[] | undefined {
  if (!Array.isArray(fields)) return fields;
  if (!perms?.isLoaded) return fields;
  const out: T[] = [];
  for (const f of fields) {
    if (!f?.name) { out.push(f); continue; }
    if (!perms.checkField(objectName, f.name, 'read')) continue; // omit entirely
    if (mode !== 'view' && !perms.checkField(objectName, f.name, 'write')) {
      out.push(markDenied(f));
      continue;
    }
    out.push(f);
  }
  return out;
}

/**
 * The render half for a FORM: drop what the caller may not READ, and mark what
 * they may read but not WRITE as non-editable.
 */
export function applyFieldPermissions<T extends Record<string, any>>(
  fields: T[] | undefined,
  { perms, objectName, mode, deniedDescription }: ApplyFieldPermissionsOptions,
): T[] | undefined {
  return gateByPermission(fields, perms, objectName, mode, (f) =>
    deniedDescription
      ? { ...f, readOnly: true, disabled: true, description: f.description ?? deniedDescription }
      : { ...f, readOnly: true, disabled: true },
  );
}

/**
 * The principal surface {@link gateFormFields} reads: the field-level resolver
 * plus the server's effective API operation set for an object (`/me/permissions`
 * `apiOperations`, #3391). `undefined` from it means "no effective set", which
 * leaves the object's own affordance standing.
 */
export interface FormFieldPrincipal extends FieldWritePrincipal {
  getObjectApiOperations?: (object: string) => readonly string[] | undefined;
}

export interface GateFormFieldsOptions extends ApplyFieldPermissionsOptions {
  perms: FormFieldPrincipal | null | undefined;
  /**
   * The object schema the form resolved (its `managedBy` bucket and
   * `userActions` opt-ins). `null` while it has not loaded, or when the form
   * has no metadata source, reads as the default bucket.
   */
  objectSchema: SchemaLike | null | undefined;
}

/**
 * The managed-object blanket lock (ADR-0092 D4 / ADR-0103): `true` when the
 * object's resolved CRUD affordance for the form's mode is CLOSED — `edit` for
 * an edit form, `create` for a create form.
 *
 * It routes through the SAME shared `resolveEffectiveCrudAffordances` policy
 * the detail (`isObjectInlineEditable`) and grid surfaces use, instead of
 * re-deriving the bucket lock: `platform` and admin-editable `config` resolve
 * open; the engine-owned buckets (`engine-owned`, `append-only`,
 * `better-auth`) resolve closed unless the object OPENED per-record writing via
 * `userActions.{edit,create}` (e.g. sys_user opens `edit` for its profile
 * fields). #3546 intersects that with the server's effective API operation set
 * for the object, so the lock also engages when the server denies `update`
 * (edit) or `create` (create) — the intersection the detail header and the
 * list toolbar apply.
 *
 * Any other mode never locks here: a `view` form disables every field on its
 * own, and a form with no declared mode was never locked by the default arm.
 * The server-side write guard remains the real boundary; this is UX only.
 */
function managedModeLocked(
  objectSchema: SchemaLike | null | undefined,
  perms: FormFieldPrincipal | null | undefined,
  objectName: string,
  mode: string | undefined,
): boolean {
  if (mode !== 'edit' && mode !== 'create') return false;
  const affordances = resolveEffectiveCrudAffordances(
    objectSchema,
    perms?.getObjectApiOperations?.(objectName),
  );
  return mode === 'edit' ? !affordances.edit : !affordances.create;
}

/**
 * The ONE field-gate step every `ObjectForm` layout draws its RESOLVED fields
 * through (objectui#10612): the default arm (flat and sectioned), `DrawerForm`
 * and `ModalForm` (sections, derived field groups and flat), and `TabbedForm`,
 * `SplitForm` and `WizardForm` (sections).
 *
 * Two gates, in one pass, so no layout can apply one and skip the other:
 *
 *  1. field-level security — {@link applyFieldPermissions}: drop what the
 *     caller may not READ, lock what they may read but not WRITE;
 *  2. the managed-object lock — every drawn field is `disabled` when
 *     {@link managedModeLocked} says the mode's affordance is closed. Only
 *     `disabled`, not `readOnly`: the default arm's lock always drew a
 *     disabled input, and the submit button is left as it is.
 *
 * Before this step the lock was stamped by the default arm's field generator
 * alone, so the drawer, modal, tabbed, split and wizard layouts drew live
 * inputs on a managed object whose write the server refuses (objectui#10613,
 * folded into objectui#10612). It runs on the resolved list rather than in a
 * generator, so every drawn field is locked — an inline `customFields` member
 * and an already-built section entry as much as a field generated from the
 * object — which is what "blanket" says.
 *
 * Entries with no `name` pass through untouched, as in the render pass.
 */
export function gateFormFields<T extends Record<string, any>>(
  fields: T[] | undefined,
  { objectSchema, ...options }: GateFormFieldsOptions,
): T[] | undefined {
  const permitted = applyFieldPermissions(fields, options);
  if (!Array.isArray(permitted)) return permitted;
  if (!managedModeLocked(objectSchema, options.perms, options.objectName, options.mode)) {
    return permitted;
  }
  return permitted.map((f) => (f?.name ? { ...f, disabled: true } : f));
}

/**
 * The CEL predicate a line-items cell reads as "locked on every row".
 *
 * A grid column has exactly one per-cell lock channel: `readonlyWhen`, which
 * the grid evaluates per row and renders as a disabled control when TRUE. The
 * form half's `disabled` / `readOnly` marks are keys a grid column does not
 * carry, so handing the grid {@link applyFieldPermissions}' output would drop
 * the unreadable columns and lock nothing. A field-level refusal does not
 * depend on the row, so the predicate that expresses it is the constant one.
 */
const LOCKED_ON_EVERY_ROW = 'true';

/**
 * The render half for a line-items GRID: the same pass over its columns — drop
 * what the caller may not READ, and lock the cells of what they may read but
 * not WRITE (objectui#10163).
 *
 * ⛔ Not a second gate: the verdict is {@link gateByPermission}'s, the same one
 * the three form containers render through, so the grid and the form above it
 * cannot disagree about which field is refused. A column that is refused
 * replaces any `readonlyWhen` it declared — a lock on every row already covers
 * every row a narrower lock would. Rows are untouched: whether a line may be
 * added or removed stays the container's own answer.
 */
export function applyColumnPermissions<T extends Record<string, any>>(
  columns: T[] | undefined,
  { perms, objectName }: Pick<ApplyFieldPermissionsOptions, 'perms' | 'objectName'>,
): T[] | undefined {
  return gateByPermission(columns, perms, objectName, undefined, (c) => ({
    ...c,
    readonlyWhen: LOCKED_ON_EVERY_ROW,
  }));
}
