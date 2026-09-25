/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Retirement pin — `ObjectDataTableSchema.dataProvider`, both faces
 * (objectui#7353, ADR-0049 remove arm).
 *
 * The member was declared on the TS interface and mirrored in zod as
 * `{ provider: string; object?: string }`, and nothing read it: the two
 * dashboard producers wrote the widget's whole provider config onto the node
 * beside `objectName`, and `ObjectDataTable` reads `objectName`. The ruling
 * removed the three writes and every declaration in one change, and added no
 * reader. The producer half is pinned in `plugin-dashboard`
 * (`widgetDataProviderRetired-7353.test.tsx`); this file pins the declarations.
 *
 * ## Why a key-set probe and NOT `@ts-expect-error`
 *
 * `BaseSchema` carries `[key: string]: any`, so an authored `dataProvider:` on
 * this node STILL COMPILES after the member is gone — it falls to the index
 * signature. The pinnable effect is that `dataProvider` stops being a DECLARED
 * member: `string extends K` filters the index signature's key out, leaving the
 * authored members (the probe `dashboard-title-retired-declaration.test.ts`
 * uses). Enforced because `tsconfig.test.json` is chained from this package's
 * `type-check` script.
 *
 * ## What the zod mirror now does with an authored `dataProvider` — measured
 *
 * No tombstone was added: the ruling deletes every declaration, and a named
 * refusal is a declaration. The mirror extends the `.passthrough()`
 * `BaseSchema`, so the key is now an UNKNOWN key — kept on the parsed value and
 * judged by nothing:
 *
 *  - a well-formed `dataProvider` parsed green before and parses green now;
 *  - a MALFORMED one (`provider: 42`) used to be refused BY NAME at
 *    `dataProvider.provider` and now parses green. That is the one verdict the
 *    removal moves, and it moves toward acceptance — stated here as the ceiling
 *    rather than left to be rediscovered.
 */

import { describe, it, expect } from 'vitest';
import type { ObjectDataTableSchema } from '../objectql';
import { ObjectDataTableSchema as ObjectDataTableZod, safeValidateSchema } from '../zod/index.zod';

type DeclaredKeys<T> = { [K in keyof T as string extends K ? never : K]: T[K] };
type Declared = keyof DeclaredKeys<ObjectDataTableSchema>;

describe('objectui#7353 — ObjectDataTableSchema no longer declares dataProvider (TS face)', () => {
  it('dataProvider is not a declared member; its neighbours still are', () => {
    // Type-level, erased at runtime: with the member restored this annotation
    // collapses to `false` and `tsc -p tsconfig.test.json` fails on this line.
    const dataProviderNotDeclared: 'dataProvider' extends Declared ? false : true = true;
    // Positive controls through the same extraction — a probe that saw no
    // members would also report `dataProvider` absent. `objectName` is the key
    // the widget reads instead; `filter` sat beside the removed member.
    const objectNameDeclared: 'objectName' extends Declared ? true : false = true;
    const filterDeclared: 'filter' extends Declared ? true : false = true;
    const drillDownDeclared: 'drillDown' extends Declared ? true : false = true;
    expect(dataProviderNotDeclared && objectNameDeclared && filterDeclared && drillDownDeclared).toBe(true);
  });
});

describe('objectui#7353 — the zod mirror no longer declares dataProvider (runtime face)', () => {
  it('the shape has no dataProvider key; its neighbours are still declared', () => {
    const keys = Object.keys(ObjectDataTableZod.shape);
    expect(keys).not.toContain('dataProvider');
    // Controls: the extraction reads a real shape, not an empty one.
    expect(keys).toEqual(expect.arrayContaining(['type', 'objectName', 'filter', 'drillDown']));
  });

  it('an authored dataProvider is now an unknown key: kept by passthrough, judged by nothing', () => {
    const wellFormed = ObjectDataTableZod.safeParse({
      type: 'object-data-table',
      objectName: 'contact',
      dataProvider: { provider: 'object', object: 'contact' },
    });
    expect(wellFormed.success).toBe(true);
    expect(wellFormed.success && (wellFormed.data as Record<string, unknown>).dataProvider).toEqual({
      provider: 'object',
      object: 'contact',
    });

    // The verdict the removal moved: refused BY NAME at `dataProvider.provider`
    // while the member was declared, accepted now — through the member schema
    // and through the published entry point alike.
    const malformed = { type: 'object-data-table', dataProvider: { provider: 42 } };
    expect(ObjectDataTableZod.safeParse(malformed).success).toBe(true);
    expect(safeValidateSchema(malformed).success).toBe(true);
  });
});
