/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The list grid's face for a `referenceVia` pointer pair (objectui#12608).
 *
 * `@objectstack/spec`'s `FieldSchema.referenceVia` declares a `text` field as
 * the id half of a two-column pointer pair: its value is a record id of the
 * object the sibling column names on the same row
 * (`sys_approval_request.record_id` with `referenceVia: 'object_name'`). The
 * rule that reads the pair is `resolveRecordPointer` in `@object-ui/fields`,
 * and the grid asks it per row, where the row is in hand; this module only
 * draws the pair it answers. There is no second resolver here.
 *
 * ## What the cell draws
 *
 * - `readable` — the target object's icon and the record's name, linking to
 *   the record through the host's record-URL builder (`recordHref` /
 *   `openRecord` on `RelatedRecordActionsContext`, the one lookup values link
 *   through). The name is `getRecordDisplayName`, the ADR-0079 ladder the
 *   record page's own title reads, over the row with the fields the viewer may
 *   not read removed. The raw record id is the tooltip.
 * - `unreadable` — the target object's label and "record unavailable", with the
 *   raw id as the tooltip; never the id alone. One rendering for every cause
 *   (deleted, outside the viewer's row set, definition unavailable, read
 *   failed): the platform answers a record outside the viewer's row set the
 *   same way it answers a deleted one, so a cell that told them apart would be
 *   an existence oracle (the rule `RecordPreviewCard` states for the details
 *   grid's face).
 * - `loading` — a placeholder bar, until both reads answer.
 *
 * ## Cost: one read per target object per tick, not one per row
 *
 * The details grid's face (`RecordPreviewCard`) reads its target with one
 * `findOne`; a list draws a page of such cells, so the list face reads through
 * `@object-ui/react`'s shared reference store: every cell that mounts in the
 * same tick asks for its id there, and the store sends one `id` `$in` read per
 * target object — shared with every lookup and user cell on the page — and
 * reads each target object's definition once. Both answers are cached per data
 * source, so a re-render or a second page that names a record already read
 * costs nothing, and a write on the data-invalidation bus re-reads it in place.
 */

import React from 'react';
import { Skeleton, resolveIcon } from '@object-ui/components';
import { getRecordDisplayName, withoutDeniedFields } from '@object-ui/core';
import type { RecordPointer } from '@object-ui/fields';
import { createSafeTranslation } from '@object-ui/i18n';
import { usePermissions } from '@object-ui/permissions';
import {
  pickReferenceRecord,
  useObjectLabel,
  useReferenceObjectDef,
  useReferenceRecords,
  useRelatedRecordActions,
} from '@object-ui/react';

/** The two reads the cell makes. Structural, so the console's adapter fits. */
export interface RecordPointerSource {
  find?: (objectName: string, params?: Record<string, unknown>) => Promise<unknown>;
  getObjectSchema?: (objectName: string) => Promise<unknown>;
}

const useRecordPointerTranslation = createSafeTranslation(
  { 'grid.recordUnavailable': '{{object}} · record unavailable' },
  'grid.recordUnavailable',
);

export interface RecordPointerCellProps {
  /** The pair `resolveRecordPointer` answered for this row. */
  pointer: RecordPointer;
  /** Where the target is read from: the grid's own data source. */
  dataSource?: RecordPointerSource | null;
}

/** Draws the record a pointer pair names: its icon and name, or "unavailable". */
export function RecordPointerCell({ pointer, dataSource }: RecordPointerCellProps): React.ReactElement {
  const { objectName, recordId } = pointer;
  const answers = useReferenceRecords(dataSource, objectName, [recordId]);
  const defAnswer = useReferenceObjectDef(dataSource, objectName);

  const perms = usePermissions();
  const { objectLabel } = useObjectLabel();
  const { t } = useRecordPointerTranslation();
  const recordLinks = useRelatedRecordActions();

  // `absent` and `failed` are one face here: deleted, outside the viewer's row
  // set and a refused read all draw "unavailable" (see the module header).
  const recordAnswer = dataSource ? pickReferenceRecord(answers, objectName, recordId) ?? { state: 'pending' as const } : { state: 'failed' as const };

  if (defAnswer.state === 'pending' || recordAnswer.state === 'pending') {
    return (
      <span data-record-pointer="loading" role="status" aria-busy="true" title={recordId} className="block">
        <Skeleton className="h-4 w-24" />
      </span>
    );
  }

  const def = defAnswer.state === 'ok' ? (defAnswer.def as { label?: string; icon?: string }) : null;
  const typeLabel = objectLabel({ name: objectName, label: def?.label || objectName });
  const Icon = def?.icon ? resolveIcon(def.icon) : null;
  // The annotation the other `resolveIcon` seam call sites carry: it returns a
  // STABLE, cached component per icon name; it does not create one during
  // render. The rule cannot see that through a call.
  // eslint-disable-next-line react-hooks/static-components
  const icon = Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" /> : null;

  if (def && recordAnswer.state === 'readable') {
    const row = withoutDeniedFields(recordAnswer.record as Record<string, unknown>, perms, objectName);
    const name = getRecordDisplayName(def as Parameters<typeof getRecordDisplayName>[0], row);
    const href = recordLinks?.recordHref ? recordLinks.recordHref(objectName, recordId) : null;
    return (
      <span data-record-pointer="readable" className="flex min-w-0 items-center gap-1.5" title={recordId}>
        {icon}
        {href ? (
          <a
            href={href}
            className="min-w-0 truncate text-primary underline-offset-4 hover:underline"
            onClick={(e) => {
              // The row opens ITS own record on click; following the pointer
              // must not also do that.
              e.stopPropagation();
              // Modifier and non-primary clicks belong to the browser.
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              if (!recordLinks?.openRecord) return;
              e.preventDefault();
              recordLinks.openRecord(objectName, recordId);
            }}
          >
            {name}
          </a>
        ) : (
          <span className="truncate">{name}</span>
        )}
      </span>
    );
  }

  // `unreadable`, or a record with no definition to name it by.
  const unavailable = String(t('grid.recordUnavailable', { object: typeLabel }));
  return (
    <span
      data-record-pointer="unreadable"
      className="flex min-w-0 items-center gap-1.5 text-muted-foreground"
      title={recordId}
    >
      {icon}
      <span className="truncate italic">{unavailable}</span>
    </span>
  );
}
