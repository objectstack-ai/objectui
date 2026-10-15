/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * A record snapshot summarized against its object's DECLARED fields
 * (objectui#12483): the declared amount, then the first business fields, each
 * under its declared label and drawn through the record page's own cell.
 *
 * The decision panel draws it from the request row the served page binds: the
 * snapshot is the row's `payload` (already redacted for the reader by the
 * approvals service), `payload_display` is the service's display value for a
 * reference, and the target object is the row's `object_name`. So the face
 * needs no prop, no page edit and no spec row.
 *
 * ## Only the declared shape is read
 *
 * - **The amount** is a field the object declares `type: 'currency'`: the first
 *   non-zero one, else the first one, because a declared amount's zero is the
 *   record's amount. ⛔ No guess from a key's NAME: a key that only looks like
 *   an amount (`total_amount` as a roll-up) is an ordinary row here.
 * - **A key the object does not declare** gets no row: it has no label and no
 *   face to show.
 * - **A field the object declares `hidden: true`** gets no row and never leads
 *   (`hidden` is the UI contract "hidden from the default UI"), and it is
 *   dropped BEFORE the row cut, so the next field takes its slot.
 * - **A framework-managed column** (`isSystemManagedField`) is bookkeeping, not
 *   a business field, and gets no row.
 * - **A reference the service did not resolve** gets no row: its value is an
 *   id.
 * - **A field the reader may not read** is never drawn. The service already
 *   redacts the snapshot per reader; the snapshot also passes through
 *   `withoutDeniedFields` with the reader's field permissions, as every surface
 *   that draws a display value from a whole row does (objectui#10594).
 *
 * Until the object's definition answers, or when it cannot (no definition, a
 * refused read), nothing is drawn: without the declarations there is no
 * declared label, no face and no `hidden` to honour.
 *
 * ## Cost
 *
 * A row with no snapshot asks for nothing. Otherwise the definition is
 * `useMetadataItem('object', name)`: a cache hit when the
 * console already holds the object, else one by-name read that the metadata
 * provider de-duplicates and caches, shared with the record card the details
 * grid draws for the same target. No record read: the snapshot is in the row.
 *
 * Module-internal: nothing re-exports it from the package entry.
 */

import * as React from 'react';
import { withoutDeniedFields } from '@object-ui/core';
import { getCellRenderer, resolveCellRendererType } from '@object-ui/fields';
import { useSafeFieldLabel } from '@object-ui/i18n';
import { usePermissions } from '@object-ui/permissions';
import { useMetadataItem } from '@object-ui/react';
import type { FieldMetadata } from '@object-ui/types';
import { distinctLabels, planSnapshotSummary, type FieldDef } from './snapshotSummaryPlan.js';

/** A declared field's stored value, through the record page's own cell. */
function FieldFace({ objectName, def, value }: { objectName: string; def: FieldDef; value: unknown }) {
  const { translateOptions } = useSafeFieldLabel();
  const options = def.options;
  const field = Array.isArray(options) && options.length > 0
    ? { ...def, options: translateOptions(objectName, def.name as string, options) }
    : def;
  const Cell = getCellRenderer(resolveCellRendererType(field as { type?: string; format?: string }));
  // eslint-disable-next-line react-hooks/static-components -- getCellRenderer returns the registry's module-level renderer for the type, not a component created during render
  return <Cell value={value} field={field as unknown as FieldMetadata} />;
}

export interface RecordSnapshotSummaryProps {
  /** The snapshot's object. */
  objectName: string | null | undefined;
  /** The snapshot: one record's stored values, keyed by field name. */
  snapshot: unknown;
  /** The service's display value per reference key. */
  display?: Record<string, string>;
}

export function RecordSnapshotSummary({ objectName, snapshot, display }: RecordSnapshotSummaryProps) {
  const target = typeof objectName === 'string' && objectName !== '' ? objectName : null;
  const hasSnapshot = !!snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot);
  // No snapshot, nothing to summarize: the definition is not asked for.
  const { item } = useMetadataItem('object', hasSnapshot ? target : null);
  const perms = usePermissions();
  const { fieldLabel } = useSafeFieldLabel();

  // A definition answered for the PREVIOUS name is not drawn against this one.
  const def = item && target !== null && (item.name === undefined || item.name === target) ? item : null;
  const declared = def?.fields;
  if (target === null || !declared || typeof declared !== 'object' || Array.isArray(declared)) return null;
  if (!hasSnapshot) return null;

  const fields = declared as Record<string, FieldDef | undefined>;
  const shown = withoutDeniedFields(snapshot as Record<string, unknown>, perms, target);
  const plan = planSnapshotSummary(shown, fields, display);
  const keys = plan.lead ? [plan.lead, ...plan.rows] : plan.rows;
  if (keys.length === 0) return null;

  const declaredLabel = (key: string) => {
    const label = fields[key]?.label;
    return fieldLabel(target, key, typeof label === 'string' && label !== '' ? label : key);
  };
  const labels = distinctLabels(keys.map((key) => ({ key, label: declaredLabel(key) })));
  const labelOf = new Map(keys.map((key, i) => [key, labels[i]]));
  const valueOf = (key: string) =>
    display?.[key] ?? (
      <FieldFace objectName={target} def={{ ...(fields[key] as FieldDef), name: key }} value={shown[key]} />
    );

  return (
    <div className="space-y-3" data-testid="record-snapshot-summary">
      {plan.lead && (
        <div data-summary-lead={plan.lead}>
          <div className="text-[11px] text-muted-foreground">{labelOf.get(plan.lead)}</div>
          <div className="text-xl font-semibold tabular-nums" title={display?.[plan.lead]}>
            {valueOf(plan.lead)}
          </div>
        </div>
      )}
      {plan.rows.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {plan.rows.map((key) => (
            <div key={key} className="min-w-0" data-summary-field={key}>
              <div className="text-[11px] text-muted-foreground">{labelOf.get(key)}</div>
              <div className="truncate" title={display?.[key]}>{valueOf(key)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
