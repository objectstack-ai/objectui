/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { isMaskedFieldType } from '@object-ui/fields';

/**
 * Is this grid column's cell drawn as a MASK, given the type the column
 * carries and the type the object schema declares for its field?
 * (objectui#10583)
 *
 * `ObjectGrid` stamps `TableColumn.masked` from this answer, and `data-table`
 * obeys the flag: no Ctrl+C / Cmd+C copy, no `title` tooltip, no column in its
 * CSV export, no inline edit. `ObjectGrid` also asks it directly where it
 * handles values itself: its client export (CSV and JSON) leaves masked fields
 * out, and its mobile card draws them through `cell`. `@object-ui/components`
 * cannot import `@object-ui/fields`, which is why the answer is computed HERE,
 * on the producer side, and handed across as a flag.
 *
 * The rule itself is NOT restated here — it is `isMaskedFieldType()` from
 * `@object-ui/fields`, the one authority for "is this field type's cell drawn
 * as a mask" (objectui#8686). A type the fields package masks, declared
 * (`password`, `secret`) or registered at runtime, sets the flag with no edit
 * to this file. The detail page asks the same authority through the same shape
 * (`isMaskedDetailFieldType` in `@object-ui/plugin-detail`, objectui#8440).
 *
 * **Narrow-only**: the answer is the UNION of the two types, so an authored
 * column `type` can add the refusal but never withdraw it (objectui#3355). A
 * view authoring `type: 'text'` over an object column declared `secret` keeps
 * the flag: a PRESENTATION override has no business widening access to a
 * credential. The declared cost is the mirror case — an object `text` column
 * a view authors as `password` is masked AND flagged, which is the answer its
 * cell already gives.
 */
export function isMaskedGridColumn(columnType: unknown, objectFieldType: unknown): boolean {
  return isMaskedType(columnType) || isMaskedType(objectFieldType);
}

function isMaskedType(fieldType: unknown): boolean {
  return typeof fieldType === 'string' && isMaskedFieldType(fieldType);
}
