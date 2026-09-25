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
// The list is spelled INLINE rather than spread from a shared constant:
// `check:component-surface-parity` cannot name the entries of a spread, so a
// spread list would drop this registration out of that reader's population.
// The declaration is pinned in `index.recordSourceInputs-10394.test.tsx`.
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

/**
 * ⛔ The bare `map` node type key is RETIRED (objectui#10393, executing the
 * objectui#8008 family ruling of 2026-09-09, route 3). `object-map` is the one
 * spelling this plugin serves.
 *
 * ## What was here, and why it went
 *
 * `ComponentRegistry.register('map', ObjectMapRenderer, { namespace: 'view',
 * ... })` — a second key on the SAME renderer, which stored both `view:map`
 * and the bare `map` fallback. The declared face admitted only one of the two:
 * `ObjectMapSchema.type` is the literal `'object-map'` and `AnyComponentSchema`
 * has no `map` arm, so a node authored `type: 'map'` failed validation
 * (`invalid_union`) while the registry mounted it. Two published faces,
 * opposite verdicts — the shape objectui#8008 retired for `gantt`.
 *
 * ## Why unregistering is the whole retirement here — measured, not assumed
 *
 * ⚠️ `BaseSchema` closes with `[key: string]: any` and `BaseSchemaCore` ends
 * `.passthrough()`, so a dropped MEMBER KEY is KEPT, not refused (the
 * objectui#7664 failure). That hazard needs a schema face to arise on, and this
 * TYPE NAME never had one: in `@object-ui/types` the literal `'map'` appears
 * only in the stored view-type unions (`NamedListView.type`,
 * `defaultViewType`), never as a component node type, against a firing control
 * of two for `object-map` (`objectql.ts` + its Zod mirror). There is no arm to
 * convert into a named refusal, so unregistering IS the retirement.
 *
 * ## ⛔ Two layers, and only one of them moved
 *
 * The string `map` also names a STORED `NamedListView.type` — the value
 * `CreateViewDialog` writes and every tenant's database holds. That layer is
 * untouched: `plugin-view`'s `ObjectView` and `plugin-list`'s `ListView` each
 * map a stored `map` view onto the node type they emit (their `case 'map'`
 * branches), and both already emit `object-map`. ⇒ Every map view any user
 * ever created through the console already renders through the surviving
 * spelling; this retirement moves zero stored documents.
 *
 * Pinned in `src/index.bareMapKeyRetired-10393.test.tsx`.
 */
