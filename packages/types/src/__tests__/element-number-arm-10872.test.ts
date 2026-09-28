/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `element:number` has a zod arm, with the spec's one `dataSource` waiver on
 * its required `object` (objectui#10872, batch 2).
 *
 * ## The defect these pin
 *
 * `element:number` is registered, curated by ADR-0080 and declared by the spec
 * (`ComponentPropsMap['element:number']`), and `AnyComponentSchema` carried no
 * arm for it — so `safeValidateSchema`, and `objectui validate` with it,
 * refused every `element:number` document with `invalid_union` at `type`,
 * whichever form it bound its object in.
 *
 * ## Why this block was held from batch 1
 *
 * Its row REQUIRES `object`, and the spec's own props gate waives exactly that
 * one member when the node binds through `dataSource.object`
 * (`DATASOURCE_SUPPLIED_PROP` / `suppliedByDataSource` in `@objectstack/lint`'s
 * `validate-component-props.ts`, pinned there by "does not report the required
 * `object` prop when `dataSource` supplies it"). The row alone would refuse
 * that spec-valid node. The arm mirrors the waiver — the bag is the row with
 * `object` alone made optional, and a node refinement restores the
 * requiredness wherever the waiver does not apply — so every row below
 * measures the arm against the INSTALLED spec rather than a transcription.
 */

import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { ComponentPropsMap, ElementDataSourceSchema, PageComponentSchema } from '@objectstack/spec/ui';

import {
  ElementNumberBlockSchema,
  PublicBlockComponentSchema,
  StrictAnyComponentSchema,
  safeValidateSchema,
} from '../zod/index.zod.js';
import * as zodBarrel from '../zod/index.zod.js';
import { stripImportedDefaults } from '../zod/imported-defaults.js';

const TYPE = 'element:number';

/** The spec's row, as the published map carries it. */
const ROW = (ComponentPropsMap as unknown as Record<string, z.ZodObject>)[TYPE];

type Result = { success: boolean; error?: { issues: z.core.$ZodIssue[] } };

/** The two faces a document is judged on: the tolerant one `objectui validate` runs, and the strict twin. */
const FACES: ReadonlyArray<readonly [string, (document: unknown) => Result]> = [
  ['tolerant', (document) => safeValidateSchema(document)],
  ['strict', (document) => StrictAnyComponentSchema.safeParse(document)],
];

const pathsOf = (result: Result): string[] =>
  result.success ? [] : result.error!.issues.map((issue) => issue.path.join('.'));

const issuesAt = (result: Result, path: string): z.core.$ZodIssue[] =>
  result.success ? [] : result.error!.issues.filter((issue) => issue.path.join('.') === path);

/** The arm's `properties` member with its `.optional()` peeled off. */
const bag = (): z.ZodObject =>
  (ElementNumberBlockSchema.shape.properties as unknown as z.ZodOptional).unwrap() as unknown as z.ZodObject;

/** A bag that names everything but `object` — valid by the row once `object` is supplied. */
const BAG_WITHOUT_OBJECT = { aggregate: 'sum', field: 'total' } as const;

describe('`element:number` validates, with the spec\'s `dataSource` waiver (objectui#10872 batch 2)', () => {
  it('a minimal `properties.object` document is accepted on both faces', () => {
    const properties = { object: 'order', aggregate: 'count' };
    // Fixture control: the bag is valid by the spec's own row.
    expect(ROW.safeParse(properties).success).toBe(true);
    for (const [face, parse] of FACES) {
      expect(parse({ type: TYPE, properties }).success, face).toBe(true);
    }
  });

  it('a `dataSource.object` document with no `properties.object` is accepted on both faces', () => {
    const document = { type: TYPE, dataSource: { object: 'order' }, properties: { ...BAG_WITHOUT_OBJECT } };
    for (const [face, parse] of FACES) {
      expect(parse(document).success, face).toBe(true);
    }
    // Control: the row ALONE refuses this bag at `object` — so the acceptance
    // above is the waiver's doing, not a bag that never needed it.
    const rowAlone = ROW.safeParse(BAG_WITHOUT_OBJECT) as Result;
    expect(rowAlone.success).toBe(false);
    expect(pathsOf(rowAlone)).toEqual(['object']);
  });

  it('a document with neither is refused on both faces, at `properties.object`', () => {
    const document = { type: TYPE, properties: { ...BAG_WITHOUT_OBJECT } };
    for (const [face, parse] of FACES) {
      const result = parse(document);
      expect(result.success, face).toBe(false);
      const [issue] = issuesAt(result, 'properties.object');
      expect(issue?.code, face).toBe('custom');
      expect((issue as { params?: { code?: string } } | undefined)?.params?.code, face)
        .toBe('ELEMENT_NUMBER_OBJECT_REQUIRED');
      // The remedy names both subjects the author can set.
      expect(issue?.message, face).toContain('properties.object');
      expect(issue?.message, face).toContain('dataSource.object');
    }
  });

  it('the missing `object` is reported BESIDE another bag issue, as the spec gate reports it', () => {
    // `when: () => true` on the refinement: without it zod skips the check once
    // the bad `aggregate` aborts the parse, and the author learns of `object`
    // only after fixing the first issue.
    const result = safeValidateSchema({ type: TYPE, properties: { aggregate: 'median' } });
    expect(pathsOf(result).sort()).toEqual(['properties.aggregate', 'properties.object']);
  });

  it('a `dataSource` whose `object` is empty, or not a string, supplies nothing', () => {
    for (const dataSource of [{ object: '' }, { object: 42 }, 'order']) {
      const document = { type: TYPE, dataSource, properties: { ...BAG_WITHOUT_OBJECT } };
      for (const [face, parse] of FACES) {
        const result = parse(document);
        expect(result.success, `${face} ${JSON.stringify(dataSource)}`).toBe(false);
        expect(issuesAt(result, 'properties.object').map((issue) => issue.code), `${face} ${JSON.stringify(dataSource)}`)
          .toEqual(['custom']);
      }
    }
    // Control: the spec's binding schema itself ACCEPTS the empty name — so the
    // refusal above is the waiver's non-empty rule (the gate's `strName`), not
    // the binding's own verdict.
    expect(ElementDataSourceSchema.safeParse({ object: '' }).success).toBe(true);
  });

  it('the waiver covers an OMITTED `object` only — a wrong one beside a binding is the row\'s refusal', () => {
    const document = { type: TYPE, dataSource: { object: 'order' }, properties: { object: 7, aggregate: 'count' } };
    for (const [face, parse] of FACES) {
      const result = parse(document);
      expect(result.success, face).toBe(false);
      expect(issuesAt(result, 'properties.object').map((issue) => issue.code), face).toEqual(['invalid_type']);
    }
  });

  it('a spec-invalid bag member is refused at the member, by reference', () => {
    for (const [properties, path] of [
      [{ object: 'order', aggregate: 'count', format: 'roman' }, 'properties.format'],
      // The record-form `filter` the spec's `element-number-filter-rule-array`
      // migration retired: refused at `filter` by the row, and so here.
      [{ object: 'order', aggregate: 'count', filter: { status: 'won' } }, 'properties.filter'],
    ] as const) {
      // Control: the spec's own row refuses the same bag, at the same member.
      expect(pathsOf(ROW.safeParse(properties) as Result), path).toContain(path.replace('properties.', ''));
      for (const [face, parse] of FACES) {
        const result = parse({ type: TYPE, properties });
        expect(result.success, `${face} ${path}`).toBe(false);
        expect(pathsOf(result), `${face} ${path}`).toContain(path);
      }
    }
  });

  it('an undeclared member inside the bag is refused by name — the row\'s strictness travels', () => {
    const result = safeValidateSchema({ type: TYPE, properties: { object: 'order', aggregate: 'count', inventedKey10872: 1 } });
    const [issue] = issuesAt(result, 'properties');
    expect(issue?.code).toBe('unrecognized_keys');
    expect((issue as { keys?: string[] } | undefined)?.keys).toEqual(['inventedKey10872']);
  });

  it('taught and shipped `element:number` documents validate', () => {
    for (const [source, document] of [
      // `@objectstack/spec` "should accept element:number component" — the
      // props form, the one form every `element:number` document the platform
      // teaches or ships uses (no example app authors one).
      ['spec component fixture', { type: TYPE, properties: { object: 'order', aggregate: 'count' } }],
      // The same suite's `PageComponent dataSource integration` document —
      // BOTH forms at once — with its `dataSource.filter` left out: the
      // installed spec's binding still takes the record-form filter there.
      [
        'spec dataSource-integration fixture',
        { type: TYPE, properties: { object: 'order', aggregate: 'sum', field: 'total' }, dataSource: { object: 'order', limit: 100 } },
      ],
      // The rule-array `filter` the spec's `element-number-filter-rule-array`
      // migration prescribes.
      [
        'spec migration prescription',
        { type: TYPE, properties: { object: 'task', aggregate: 'count', filter: [{ field: 'status', operator: 'equals', value: 'won' }] } },
      ],
    ] as const) {
      // Control: the spec's own node schema accepts each one.
      expect(PageComponentSchema.safeParse(document).success, source).toBe(true);
      for (const [face, parse] of FACES) {
        expect(parse(document).success, `${face} ${source}`).toBe(true);
      }
    }
  });

  it('the arm is a named export of the barrel and a member of the public-block union', () => {
    expect(Object.values(zodBarrel as unknown as Record<string, unknown>)).toContain(ElementNumberBlockSchema);
    const options = (PublicBlockComponentSchema as unknown as { options: z.ZodObject[] }).options;
    expect(options).toContain(ElementNumberBlockSchema);
  });
});

/**
 * The differential: on every probe, the arm answers exactly what the spec's
 * node schema (`PageComponentSchema`, which judges `dataSource`) answers,
 * together with THIS FILE'S MODEL of the spec gate's documented reading over
 * the row (`specGateAccepts` below — the gate's docblock, not the gate's code,
 * which is not importable here). Each probe is its own row, so a regression
 * names the document it broke.
 */
describe('`element:number` answers as the spec node schema plus the spec gate\'s documented reading do (objectui#10872 batch 2)', () => {
  /**
   * The spec gate's verdict on a node's bag: the row's issues, less the one the
   * gate waives — `object` ABSENT while `dataSource.object` is a non-empty
   * string (`DATASOURCE_SUPPLIED_PROP`, documented there as "the one prop whose
   * absence this rule does NOT report"). A node with no bag is not judged.
   *
   * ⚠️ Absence, as that docblock and this card's order state it ("may omit
   * `properties.object`"). The gate's `suppliedByDataSource` matches the issue
   * by PATH alone, so it also waives a present-but-wrong `object` (a number)
   * beside a binding; the arm does not, and the probe that tells the two apart
   * is its own row below.
   */
  function specGateAccepts(node: Readonly<Record<string, unknown>>): boolean {
    const props = node.properties;
    if (!props || typeof props !== 'object' || Array.isArray(props)) return true;
    const parsed = ROW.safeParse(props) as Result;
    if (parsed.success) return true;
    const ds = node.dataSource as { object?: unknown } | undefined;
    const supplied = !!ds && typeof ds === 'object' && typeof ds.object === 'string' && ds.object.length > 0;
    const absent = (props as { object?: unknown }).object === undefined;
    return parsed.error!.issues.every(
      (issue) => supplied && absent && issue.path.length === 1 && issue.path[0] === 'object',
    );
  }

  const PROBES: ReadonlyArray<readonly [string, Record<string, unknown>]> = [
    ['bare node', {}],
    ['props form', { properties: { object: 'order', aggregate: 'count' } }],
    ['bag without object, no binding', { properties: { ...BAG_WITHOUT_OBJECT } }],
    ['bag without object, dataSource.object', { properties: { ...BAG_WITHOUT_OBJECT }, dataSource: { object: 'order' } }],
    ['bag without object, empty dataSource.object', { properties: { ...BAG_WITHOUT_OBJECT }, dataSource: { object: '' } }],
    ['bag without object, numeric dataSource.object', { properties: { ...BAG_WITHOUT_OBJECT }, dataSource: { object: 42 } }],
    ['bag without object, dataSource a string', { properties: { ...BAG_WITHOUT_OBJECT }, dataSource: 'order' }],
    ['bag without object, dataSource with an alias key', { properties: { ...BAG_WITHOUT_OBJECT }, dataSource: { object: 'order', objectName: 'order' } }],
    ['props form, empty dataSource.object', { properties: { object: 'order', aggregate: 'count' }, dataSource: { object: '' } }],
    ['dataSource only, no bag', { dataSource: { object: 'order' } }],
    ['empty bag, dataSource.object', { properties: {}, dataSource: { object: 'order' } }],
    ['bag with a bad member, dataSource.object', { properties: { ...BAG_WITHOUT_OBJECT, format: 'roman' }, dataSource: { object: 'order' } }],
    ['bag with a non-string object, dataSource.object', { properties: { object: 7, aggregate: 'count' }, dataSource: { object: 'order' } }],
    ['bag not a record', { properties: 'order' }],
  ];

  it.each(PROBES)('%s', (_name, fields) => {
    const node = { type: TYPE, ...fields };
    const spec = PageComponentSchema.safeParse(node).success && specGateAccepts(node);
    for (const [face, parse] of FACES) {
      expect(parse(node).success, face).toBe(spec);
    }
  });

  it('the probes include both verdicts (non-vacuity)', () => {
    const verdicts = PROBES.map(([, fields]) => {
      const node = { type: TYPE, ...fields };
      return PageComponentSchema.safeParse(node).success && specGateAccepts(node);
    });
    expect(verdicts).toContain(true);
    expect(verdicts).toContain(false);
  });
});

describe('`element:number` reads the spec by reference (objectui#10872 batch 2)', () => {
  it('the bag declares exactly the row\'s members, and is closed as the row is', () => {
    expect(Object.keys(bag().shape).sort()).toEqual(Object.keys(ROW.shape).sort());
    expect((bag() as unknown as { _zod: { def: { catchall?: { _zod: { def: { type: string } } } } } })._zod.def.catchall?._zod.def.type)
      .toBe('never');
  });

  it('every member but `object` IS the row\'s own member object; `object` is the row\'s own, made optional', () => {
    const rowShape = ROW.shape as Record<string, z.ZodType>;
    const bagShape = bag().shape as Record<string, z.ZodType>;
    for (const key of Object.keys(rowShape).filter((k) => k !== 'object')) {
      expect(bagShape[key], key).toBe(rowShape[key]);
    }
    expect((bagShape.object as unknown as { _zod: { def: { type: string } } })._zod.def.type).toBe('optional');
    expect((bagShape.object as unknown as z.ZodOptional).unwrap()).toBe(rowShape.object);
    // Control: the row's own `object` is required, which is why the waiver exists.
    expect(ROW.safeParse({ aggregate: 'count' }).success).toBe(false);
  });

  it('`dataSource` is the spec\'s element binding, through the import boundary', () => {
    const member = (ElementNumberBlockSchema.shape.dataSource as unknown as z.ZodOptional).unwrap() as unknown as z.ZodObject;
    const spec = ElementDataSourceSchema as unknown as z.ZodObject;
    expect(Object.keys(member.shape).sort()).toEqual(Object.keys(spec.shape).sort());
    // The boundary's `lazy` arm rebuilds this one clean schema (the recursive
    // filter clause sits under `filter`), so it is an equal-answering clone —
    // `imported-defaults-8317.test.ts` names it in `REBUILT_CLEAN`.
    expect(stripImportedDefaults(spec)).not.toBe(spec);
    for (const probe of [{ object: 'order' }, { object: '' }, { object: 1 }, {}, { object: 'o', limit: 0 }, { object: 'o', objectName: 'o' }]) {
      expect(member.safeParse(probe).success, JSON.stringify(probe)).toBe(spec.safeParse(probe).success);
    }
  });

  /**
   * Measured WHERE the rebuild happens: `filter` is the member whose subtree
   * reaches the recursive filter clause's `z.lazy`, the one node the boundary's
   * walker rebuilds in this clean schema. Every probe above stops short of it.
   * Each probe here goes through `filter`, the nested ones through the lazy's
   * recursion, and each verdict is held to the spec's own schema — on the
   * member, and on the node through both faces (the strict face rebuilds the
   * same lazy a second time, as a fresh `z.lazy`).
   */
  it.each([
    ['record filter', { object: 'o', filter: { status: 'won' } }, true],
    ['nested $and / $or filter', { object: 'o', filter: { $and: [{ status: 'won' }, { $or: [{ amount: { $gt: 100 } }, { stage: { $in: ['a', 'b'] } }] }] } }, true],
    ['non-object filter', { object: 'o', filter: 5 }, false],
    ['non-object clause inside $and', { object: 'o', filter: { $and: [5] } }, false],
  ] as const)('`dataSource.filter` through the rebuilt binding answers as the spec does: %s', (_name, probe, expected) => {
    const member = (ElementNumberBlockSchema.shape.dataSource as unknown as z.ZodOptional).unwrap() as unknown as z.ZodObject;
    const spec = ElementDataSourceSchema as unknown as z.ZodObject;
    // Non-vacuity: the spec's own verdict is the one this row names.
    expect(spec.safeParse(probe).success).toBe(expected);
    expect(member.safeParse(probe).success).toBe(expected);
    const node = { type: TYPE, properties: { object: 'o', aggregate: 'count' }, dataSource: probe };
    expect(PageComponentSchema.safeParse(node).success).toBe(expected);
    for (const [face, parse] of FACES) {
      expect(parse(node).success, face).toBe(expected);
    }
  });
});
