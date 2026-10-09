/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `element:repeater` declares the node-level `dataSource` binding, by
 * reference to the spec's `ElementDataSourceSchema`, and keeps
 * `properties.object` required (objectui#11880, the repeater half; ruling
 * objectstack-ai/objectstack#11509, A-narrow, objectui first).
 *
 * ## The defect these pin
 *
 * Since objectui#11880 the repeater's renderer reads the binding first, with
 * its flat `properties` query keys as the fallback until the spec's v18 pin
 * bump retires them. The arm declared no `dataSource`, so the published
 * strict face (`StrictAnyComponentSchema`) refused the node the designer and
 * the spec both accept — `properties.object` plus a node-level `dataSource` —
 * with `unrecognized_keys [dataSource]`, naming a key the renderer honours.
 *
 * ## Every face that moves, and the one that does not
 *
 *   - strict: ACCEPTS a well-formed binding beside the bag (it refused the key
 *     outright before), and still refuses a bogus node key.
 *   - tolerant (`safeValidateSchema`, `.passthrough()` at the node): it
 *     accepted any `dataSource` value before, judging nothing; it now judges
 *     the binding as the spec's own node schema does, so a malformed binding is
 *     refused at `dataSource` on both faces.
 *   - the TypeScript authoring face (`PublicBlockNodeOf<'element:repeater'>`,
 *     derived from the arm's shape) types `dataSource` as the spec's binding.
 *   - NOT moved: `properties.object` stays REQUIRED. The spec row requires it,
 *     and this arm mirrors no waiver for it, so a bag without `object` is
 *     refused at `properties.object` on both faces whatever the binding says.
 */

import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { ComponentPropsMap, ElementDataSourceSchema, PageComponentSchema } from '@objectstack/spec/ui';

import { ElementRepeaterBlockSchema, StrictAnyComponentSchema, safeValidateSchema } from '../zod/index.zod.js';
import { stripImportedDefaults } from '../zod/imported-defaults.js';
import type { PublicBlockNodeOf } from '../authoring-nodes.js';

const TYPE = 'element:repeater';

/** The spec's row, as the published map carries it. */
const ROW = (ComponentPropsMap as unknown as Record<string, z.ZodObject>)[TYPE];

type Result = { success: boolean; error?: { issues: z.core.$ZodIssue[] } };

const FACES: ReadonlyArray<readonly [string, (document: unknown) => Result]> = [
  ['tolerant', (document) => safeValidateSchema(document)],
  ['strict', (document) => StrictAnyComponentSchema.safeParse(document)],
];

const issuesAt = (result: Result, path: string): z.core.$ZodIssue[] =>
  result.success ? [] : result.error!.issues.filter((issue) => issue.path.join('.') === path);

const BAG = { object: 'contact', titleField: 'name', fields: ['email'] } as const;
const BINDING = {
  object: 'contact',
  filter: [{ field: 'status', operator: 'equals', value: 'active' }],
  sort: [{ field: 'name', order: 'asc' }],
  limit: 5,
} as const;

describe('`element:repeater` takes the node-level `dataSource` (objectui#11880)', () => {
  it('the designer-shaped node — `properties.object` plus a binding — is accepted on every face', () => {
    const document = { type: TYPE, properties: { ...BAG }, dataSource: { ...BINDING } };
    // Controls: the spec's node schema, its row and its binding schema each
    // accept their part, so the verdicts below are the arm's own.
    expect(PageComponentSchema.safeParse(document).success).toBe(true);
    expect(ROW.safeParse(document.properties).success).toBe(true);
    expect(ElementDataSourceSchema.safeParse(document.dataSource).success).toBe(true);
    for (const [face, parse] of FACES) {
      expect(parse(document).success, face).toBe(true);
    }
  });

  it('a binding does not stand in for `properties.object`: a bag without it is refused on both faces', () => {
    const document = { type: TYPE, properties: { titleField: 'name' }, dataSource: { object: 'contact' } };
    // The row requires `object` (control), and the arm mirrors no waiver.
    expect(issuesAt(ROW.safeParse(document.properties) as Result, 'object').map((i) => i.code)).toEqual(['invalid_type']);
    for (const [face, parse] of FACES) {
      const result = parse(document);
      expect(result.success, face).toBe(false);
      expect(issuesAt(result, 'properties.object').map((i) => i.code), face).toEqual(['invalid_type']);
    }
  });

  it('control: a bogus node key beside the binding is still refused by the strict face', () => {
    const result = StrictAnyComponentSchema.safeParse({
      type: TYPE,
      properties: { ...BAG },
      dataSource: { object: 'contact' },
      inventedKey11880: 1,
    });
    expect(result.success).toBe(false);
    const keys = result.success
      ? []
      : result.error.issues.flatMap((issue) => ((issue as { keys?: string[] }).keys ?? []));
    expect(keys).toContain('inventedKey11880');
    expect(keys).not.toContain('dataSource');
  });

  it.each([
    ['a string', 'contact'],
    ['a non-string object', { object: 42 }],
    ['a member the binding does not declare', { object: 'contact', objectName: 'contact' }],
    ['the retired record-form filter', { object: 'contact', filter: { status: 'active' } }],
  ] as const)('a malformed binding (%s) is refused at `dataSource`, as the spec node schema refuses it', (_name, dataSource) => {
    const document = { type: TYPE, properties: { ...BAG }, dataSource };
    // Control: the spec's node schema refuses the same node.
    expect(PageComponentSchema.safeParse(document).success).toBe(false);
    for (const [face, parse] of FACES) {
      const result = parse(document);
      expect(result.success, face).toBe(false);
      expect(
        result.success ? [] : result.error!.issues.map((issue) => String(issue.path[0])),
        face,
      ).toContain('dataSource');
    }
  });
});

/**
 * The differential: on every probe the strict face answers what the spec
 * answers — its node schema (`PageComponentSchema`, which judges `dataSource`)
 * together with its row over the bag, judged only when a bag is present, with
 * no waiver on `object`. The spec's props lint carries a type-blind
 * `dataSource` waiver that would let a `dataSource`-only repeater through; the
 * arm deliberately does not mirror it for this element (triage on
 * objectui#11880: `properties.object` stays required until the v18 pin bump).
 */
describe('the strict face answers as the spec node schema plus its row do (objectui#11880)', () => {
  const specAccepts = (node: Readonly<Record<string, unknown>>): boolean => {
    if (!PageComponentSchema.safeParse(node).success) return false;
    const bag = node.properties;
    return bag === undefined || ROW.safeParse(bag).success;
  };

  const PROBES: ReadonlyArray<readonly [string, Record<string, unknown>]> = [
    ['flat bag only', { properties: { ...BAG } }],
    ['bag and binding', { properties: { ...BAG }, dataSource: { ...BINDING } }],
    ['bag and binding naming a saved view', { properties: { ...BAG }, dataSource: { object: 'contact', view: 'active' } }],
    ['bag without object, binding', { properties: { titleField: 'name' }, dataSource: { object: 'contact' } }],
    ['binding only, no bag', { dataSource: { object: 'contact' } }],
    ['bag and a binding with an alias member', { properties: { ...BAG }, dataSource: { object: 'contact', objectName: 'contact' } }],
    ['bag and a binding that is a string', { properties: { ...BAG }, dataSource: 'contact' }],
    ['bag and a bogus node key', { properties: { ...BAG }, inventedKey11880: true }],
  ];

  it.each(PROBES)('%s', (_name, fields) => {
    const node = { type: TYPE, ...fields };
    expect(StrictAnyComponentSchema.safeParse(node).success).toBe(specAccepts(node));
  });

  it('the probes include both verdicts (non-vacuity)', () => {
    const verdicts = PROBES.map(([, fields]) => specAccepts({ type: TYPE, ...fields }));
    expect(verdicts).toContain(true);
    expect(verdicts).toContain(false);
  });
});

describe('`dataSource` on the repeater arm IS the spec\'s binding (objectui#11880)', () => {
  it('declared by reference, through the import boundary', () => {
    const member = (ElementRepeaterBlockSchema.shape as unknown as Record<string, z.ZodType>).dataSource as unknown as
      | z.ZodOptional
      | undefined;
    expect(member, 'the arm declares no `dataSource`').toBeDefined();
    const spec = ElementDataSourceSchema as unknown as z.ZodObject;
    // The import boundary hands back the spec's own schema (the binding has no
    // default and no `z.lazy`)…
    expect(stripImportedDefaults(spec)).toBe(spec);
    // …and the arm holds it: its DEFINITION is the spec's. Not `toBe(spec)`:
    // the spec publishes the binding as a lazy proxy whose methods run on the
    // real schema, so `.optional()` wraps the object behind the proxy, and the
    // definition is the identity that survives (the rule
    // `held-public-block-arms-10872.test.ts` applies to the rows).
    const inner = member!.unwrap() as unknown as z.ZodObject;
    expect((inner as unknown as { _zod: { def: unknown } })._zod.def)
      .toBe((spec as unknown as { _zod: { def: unknown } })._zod.def);
    expect(Object.keys(inner.shape).sort()).toEqual(Object.keys(spec.shape).sort());
  });

  it('the TypeScript authoring face types the binding as the spec\'s, and refuses a member it does not declare', () => {
    const bound: PublicBlockNodeOf<'element:repeater'> = {
      type: TYPE,
      properties: { object: 'contact', fields: ['name'] },
      dataSource: { object: 'contact', view: 'active', limit: 5 },
    };
    const aliased: PublicBlockNodeOf<'element:repeater'> = {
      type: TYPE,
      properties: { object: 'contact' },
      // @ts-expect-error `objectName` is not a member of the spec's ElementDataSourceSchema
      dataSource: { object: 'contact', objectName: 'contact' },
    };
    expect([bound, aliased].map((node) => node.type)).toEqual([TYPE, TYPE]);
  });
});
