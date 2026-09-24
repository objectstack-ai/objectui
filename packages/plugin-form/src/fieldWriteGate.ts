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
 */

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
