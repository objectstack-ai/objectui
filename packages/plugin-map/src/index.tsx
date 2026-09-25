/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { ComponentRegistry, elementDataSourceBlock } from '@object-ui/core';
import {
  ElementDataSourceGate,
  useSchemaContext,
  type ElementDataSourceMapping,
} from '@object-ui/react';
import { ObjectMap } from './ObjectMap';
import type { ObjectMapProps } from './ObjectMap';

export { ObjectMap };
export type { ObjectMapProps };

/**
 * What `ObjectMap` reads for its own query: `objectName` (via `getDataConfig`),
 * `filter` and `sort` (`ObjectMap.tsx` — `$filter: schema.filter`,
 * `$orderby: convertSortToQueryParams(schema.sort)`).
 *
 * No `columns` and no row cap are mapped: a map projects the fields its `map`
 * config names (latitude/longitude/title/description) and its fetch issues no
 * `$top`, so neither key has a read site to write to.
 *
 * `filter` here means the query filter and nothing else. `getMapConfig` used to
 * ALSO accept the map's own configuration stashed under `schema.filter.map` (a
 * shape predating the `map` input); that read is gone as of objectui#4034 —
 * the map config is read from the declared `map` input only, and a schema still
 * carrying the legacy stash gets a dev-mode warning instead of silently losing
 * its markers. Nothing here ever relied on it.
 */
const OBJECT_MAP_DATA_SOURCE: ElementDataSourceMapping = {
  filter: true,
  sort: true,
};

// Register component
export const ObjectMapRenderer: React.FC<any> = elementDataSourceBlock(({ schema, ...props }) => {
  const { dataSource } = useSchemaContext() || {};
  // The spec's `PageComponentSchema.dataSource` binding (objectstack#7121): a map
  // authored with the binding and no flat `objectName` got a null data config, so
  // it rendered an empty map — no markers, no request, no diagnostic.
  return (
    <ElementDataSourceGate
      schema={schema}
      mapping={OBJECT_MAP_DATA_SOURCE}
      dataSource={dataSource}
      testId="object-map"
      errorTitle="This map’s data source could not be resolved"
    >
      {(bound) => <ObjectMap schema={bound} dataSource={dataSource} {...props} />}
    </ElementDataSourceGate>
  );
});

// `objectName` is NOT a required input (objectui#7470): `getDataConfig` reads
// `data`, then `staticData`, then `objectName`, and the `object-map` zod schema
// (`requireRecordSource`, objectui#6939) is where "one of the three" is
// enforced. The input list is a flat declaration with a boolean `required`, so
// it states the rule in the description rather than growing a one-of form.
//
// `data` and `staticData` are declared (objectui#10394): `ObjectMapSchema`
// declares both, and without an input the html tier's `validateTree` reported
// a block authored on either as `unknown-prop`. Their arms are the schema's:
// `data` is `ViewDataSchema`, a `{ provider, … }` OBJECT — the ladder is called
// on the `'view-data'` arm, so a bare array under `data` is not a record source
// (objectui#8348) and `SchemaRenderer` does not spread it as a prop either —
// and `staticData` is an array of records. Each description names only what
// `ObjectMap` was measured to do with the key, including that the `api`
// provider plots nothing here (`API provider not yet implemented for
// ObjectMap`).
//
// Both keys spell the list INLINE rather than spreading one shared constant:
// `check:component-surface-parity` cannot name the entries of a spread, so a
// shared list would drop both registrations out of that reader's population.
// The two lists are pinned identical instead, beside the rest of this
// declaration, in `index.recordSourceInputs-10394.test.tsx`.
ComponentRegistry.register('object-map', ObjectMapRenderer, {
  namespace: 'plugin-map',
  label: 'Object Map',
  category: 'view',
  inputs: [
    { name: 'objectName', type: 'string', description: 'ObjectQL object name. The record source is one of `data`, `staticData` and `objectName`; the `object-map` schema refuses a block that declares none of them.' },
    { name: 'map', type: 'object', description: 'latitudeField, longitudeField, titleField' },
    { name: 'data', type: 'object', description: 'A `{ provider, … }` data-source configuration, read FIRST on the record-source ladder: a map carrying one never reaches `staticData` and never queries `objectName`. `{ provider: \'value\', items }` plots those rows and `{ provider: \'object\', object }` queries that object, both narrowed by `filter` and ordered by `sort`. The `api` provider is not implemented on the map and plots no markers. A bare array is not this key’s shape and is not a record source: the map falls through to `staticData`, then `objectName`, so inline rows belong under `staticData`.' },
    { name: 'staticData', type: 'array', description: 'Inline records, read SECOND on the record-source ladder: a `data` configuration wins and this key is then never reached, while `objectName` is read AFTER it, so a map carrying both plots these rows and never queries that object. `filter` and `sort` narrow and order these rows exactly as they do fetched ones.' },
  ],
});

// `map` publishes the same surface; whether the bare key survives at all is
// objectui#10393's question, not this list's.
ComponentRegistry.register('map', ObjectMapRenderer, {
  namespace: 'view',
  label: 'Map View',
  category: 'view',
  inputs: [
    { name: 'objectName', type: 'string', description: 'ObjectQL object name. The record source is one of `data`, `staticData` and `objectName`; the `object-map` schema refuses a block that declares none of them.' },
    { name: 'map', type: 'object', description: 'latitudeField, longitudeField, titleField' },
    { name: 'data', type: 'object', description: 'A `{ provider, … }` data-source configuration, read FIRST on the record-source ladder: a map carrying one never reaches `staticData` and never queries `objectName`. `{ provider: \'value\', items }` plots those rows and `{ provider: \'object\', object }` queries that object, both narrowed by `filter` and ordered by `sort`. The `api` provider is not implemented on the map and plots no markers. A bare array is not this key’s shape and is not a record source: the map falls through to `staticData`, then `objectName`, so inline rows belong under `staticData`.' },
    { name: 'staticData', type: 'array', description: 'Inline records, read SECOND on the record-source ladder: a `data` configuration wins and this key is then never reached, while `objectName` is read AFTER it, so a map carrying both plots these rows and never queries that object. `filter` and `sort` narrow and order these rows exactly as they do fetched ones.' },
  ],
});
