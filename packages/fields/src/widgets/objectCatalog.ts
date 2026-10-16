/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The registered-object catalog an `object-ref` field reads (objectui#12613).
 *
 * ONE read, two readers: `ObjectRefField` (the edit widget) lists the catalog as
 * its options, and the read cell (`ObjectRefCellRenderer`, through
 * `refLabelDirectory.ts`) names a stored object from it. Deliberately not
 * re-exported from the package barrel, and free of React so the barrel can
 * import it without pulling the widget in.
 */

/** One registered object, as the catalog lists it. */
export interface ObjectHeader {
  name: string;
  label?: string;
}

/**
 * Load the platform's registered objects, in order of preference:
 *   1. `dataSource.getObjects()` — the metadata-registry list endpoint
 *      (`GET /api/v1/meta/object`), which merges code- and DB-defined objects.
 *   2. Fallback: `dataSource.find('sys_metadata', { type: 'object' })` — the
 *      same source the Setup app's object grid browses.
 *
 * Resolves `[]` for a data source that offers neither read. A failed read
 * REJECTS, and each caller decides what a failure means for its face.
 */
export async function loadObjectCatalog(dataSource: any): Promise<ObjectHeader[]> {
  if (typeof dataSource?.getObjects === 'function') {
    return (await dataSource.getObjects()) ?? [];
  }
  if (typeof dataSource?.find === 'function') {
    const res = await dataSource.find('sys_metadata', {
      $filter: { type: 'object' },
      $top: 1000,
    });
    const list: any[] = res?.data ?? res?.records ?? (Array.isArray(res) ? res : []);
    return list
      .map((r) => ({
        name: String(r?.name ?? ''),
        label: r?.label != null ? String(r.label) : undefined,
      }))
      .filter((r) => r.name);
  }
  return [];
}

/** Whether `dataSource` offers one of the reads {@link loadObjectCatalog} makes. */
export function canLoadObjectCatalog(dataSource: any): boolean {
  return typeof dataSource?.getObjects === 'function' || typeof dataSource?.find === 'function';
}

/**
 * An object's name as the picker spells it, `Label (name)`, or the bare name
 * when the catalog gives it no label. The picker uses it for each option and
 * the read cell for its tooltip, so the two faces spell an object one way.
 */
export function objectRefOptionLabel(name: string, label: string | undefined): string {
  return label ? `${label} (${name})` : name;
}
