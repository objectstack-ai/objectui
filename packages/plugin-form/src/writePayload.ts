/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  sanitizeFormData,
  dirtyEditPayload,
  type LoadedRecordSnapshot,
} from './sanitize';
import { isCreateFormMode, omitServerResolvedDefaults } from './schemaDefaults';
import type { FieldWriteGate } from './fieldWriteGate';

/** The facts of a form schema the outbound sequence reads. */
export interface FormWriteTarget {
  mode?: string;
  objectName: string;
  recordId?: string | number | null;
  /** Inline field definitions (`object-form.customFields`). */
  customFields?: readonly unknown[] | null;
}

/** Where the outbound sequence gets its answers from. */
export interface FormWriteSources {
  /** The object definition the form loaded, or `null` when it has none. */
  objectSchema: { fields?: Record<string, any> } | null | undefined;
  /** The caller's field-level write verdict — {@link FieldWriteGate}. */
  canEdit: FieldWriteGate | undefined;
  /** The record this form read for the record it edits (objectui#10156). */
  snapshot: LoadedRecordSnapshot | null | undefined;
}

export interface FormWritePayloads {
  /**
   * Every value the form may write, as the form now holds it: stripped of what
   * a form never writes and, on a create, of the fields the producer owns.
   */
  payload: Record<string, any>;
  /**
   * What the save sends — on BOTH routes, the host `submitHandler` and the
   * form's own create / OCC-guarded update. On an edit, the fields of
   * {@link FormWritePayloads.payload} that differ from the record the form
   * read; otherwise `payload` itself.
   */
  writePayload: Record<string, any>;
}

/**
 * The ONE outbound sequence of a record form: what a save writes, built from
 * the values the form collected (objectui#10563).
 *
 * 1. `sanitizeFormData` drops what a form never writes — server-owned columns
 *    (objectui#10108), computed / formula / read-only columns, keys the object
 *    does not declare, and every field the caller's field-level security
 *    refuses (`canEdit`, objectui#10120).
 * 2. On a create, `omitServerResolvedDefaults` drops an empty field whose
 *    runtime default the producer resolves (#4069).
 * 3. On an edit, `dirtyEditPayload` keeps only the fields that differ from the
 *    record the form read (objectui#10156), and sends the whole of step 1's
 *    result when it cannot settle that.
 *
 * ## Why it is one function
 *
 * `ObjectForm` routes a record save through several layouts, and each layout
 * owns its save handler. When the sequence was spelled inline in each handler,
 * three of them — `TabbedForm`, `SplitForm` and `WizardForm` (which also renders
 * a simple form's mobile `stepper`) — carried none of it and wrote every value
 * they held, `id`, `owner_id`, the formula columns and the field-level-refused
 * ones included. ⛔ Do not spell any step of it beside a call to this function.
 *
 * ## The inline-members rule
 *
 * With a non-empty `customFields` the object definition is NOT handed to steps
 * 1 and 2: an inline member may name a field the object never declares (it is
 * appended after the generated set, objectui#9778), and the unknown-key strip
 * would drop the value the author asked for. The server-owned roster and the
 * field-level verdict still apply, because neither needs a definition.
 */
export function formWritePayload(
  values: Record<string, any>,
  form: FormWriteTarget,
  { objectSchema, canEdit, snapshot }: FormWriteSources,
): FormWritePayloads {
  const hasInlineMembers = Array.isArray(form.customFields) && form.customFields.length > 0;
  const definition = hasInlineMembers ? null : objectSchema;
  let payload = sanitizeFormData(values, definition, { canEdit });
  // A CREATE payload omits the fields the producer owns (#4069): a rendered
  // control registers even when nothing seeded it, so an untouched
  // runtime-default field would ride along as `undefined`/`''` and defeat
  // `applyFieldDefaults`. Create only — on an edit form a cleared column is a
  // real removal.
  if (isCreateFormMode(form)) {
    payload = omitServerResolvedDefaults(payload, definition);
  }
  return { payload, writePayload: dirtyEditPayload(payload, snapshot, form) };
}
