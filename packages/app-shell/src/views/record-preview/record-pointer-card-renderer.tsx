/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The record details grid's face for a `referenceVia` pointer pair
 * (objectui#12045, B1 of objectui#2763): `RecordPreviewCard` (A2), registered
 * under `@object-ui/fields`' `RECORD_POINTER_CARD_TYPE`.
 *
 * `@object-ui/fields` owns the rule (`resolveRecordPointer`) and the key, and
 * keeps a default under it that draws the record id as text. `fields` cannot
 * import this package, so the card is registered from here, through the
 * published `registerFieldRenderer`, and imported for its side effect from the
 * package entry (`src/index.ts`). A field that declares `referenceVia` then
 * draws the record it points at wherever the details grid shows it:
 * `sys_approval_request.record_id`, both pairs on `sys_activity`, and the other
 * pointer fields the spec declares, with no page node and no authorable key.
 *
 * The card reads the target through the console's adapter, the same instance
 * every other record read on the page goes through. It says nothing about why
 * a target cannot be read; see the card's own header for why that matters.
 */

import { registerFieldRenderer, RECORD_POINTER_CARD_TYPE, type CellRendererProps, type RecordPointer } from '@object-ui/fields';
import { useAdapter } from '@object-ui/react';
import { RecordPreviewCard } from './RecordPreviewCard.js';

/** The pair `resolveRecordPointer` hands the renderer as its `value`. */
function asRecordPointer(value: unknown): RecordPointer | null {
  if (value == null || typeof value !== 'object') return null;
  const { objectName, recordId } = value as Partial<RecordPointer>;
  return typeof objectName === 'string' && typeof recordId === 'string' ? { objectName, recordId } : null;
}

/**
 * Draws the record a pointer pair names as `RecordPreviewCard`. A value that is
 * not a pair addresses nothing, and the card draws its `absent` state for it.
 */
export function RecordPointerCardRenderer({ value }: CellRendererProps) {
  const dataSource = useAdapter();
  const pointer = asRecordPointer(value);
  return (
    <RecordPreviewCard
      objectName={pointer?.objectName}
      recordId={pointer?.recordId}
      dataSource={dataSource}
      className="w-full max-w-md"
    />
  );
}

registerFieldRenderer(RECORD_POINTER_CARD_TYPE, RecordPointerCardRenderer);
