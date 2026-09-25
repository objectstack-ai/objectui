/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { usePermissions } from '@object-ui/permissions';

/** The two members of the permission context this gate reads. */
type FieldReadPolicy = Pick<ReturnType<typeof usePermissions>, 'isLoaded' | 'checkField'>;

/**
 * `record` as the viewer may READ it on `objectName`, for building a record
 * TITLE (objectui#10434). Every field the loaded permission policy denies is
 * removed, which leaves the row ObjectStack's `FieldMasker` already serves.
 *
 * A title is a display value, and under the renderer-side FLS rulings
 * (objectui#7215 / objectui#7230) field-level security gates what is
 * displayed. The title ladder reads the view's `primaryField`, the declared
 * name pointer, `titleFormat` and the type-aware derivation straight off the
 * row it is given. A field removed here is therefore read by every rung
 * exactly as an absent field is, and the ladder falls through to its next
 * source. No placeholder stands in for a withheld value.
 *
 * - `id` and `_id` are never judged. The `Record #<id>` floor reads them, and
 *   the id is not a field value the policy withholds.
 * - Before a policy loads, the record comes back as it is. `isLoaded` is also
 *   false when no `PermissionProvider` is mounted. The same holds with no
 *   object name to judge the fields against.
 * - When nothing is withheld, the SAME object comes back, so the title built
 *   from it is the title built from the row as served.
 *
 * The lookup option label and the record picker's display column apply the
 * same rule in `@object-ui/fields` (objectui#10373). This copy is not a
 * package export. Its two callers are the two title hosts in this package:
 * `DetailView`'s header and `record:details`' title dedupe.
 */
export function withoutDeniedFields<T>(
  record: T,
  perms: FieldReadPolicy,
  objectName: string | undefined,
): T {
  if (!perms?.isLoaded || !objectName || !record || typeof record !== 'object') return record;
  const shown: Record<string, unknown> = {};
  let withheld = false;
  for (const [key, value] of Object.entries(record)) {
    if (key === 'id' || key === '_id' || perms.checkField(objectName, key, 'read')) shown[key] = value;
    else withheld = true;
  }
  return withheld ? (shown as T) : record;
}
