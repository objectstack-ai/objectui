/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10919 — the `cloud:plan-status` arm (`../zod/cloud.zod.ts`).
 *
 * `@object-ui/app-shell` registers `cloud:plan-status` for the Cloud pricing
 * page, and this arm lands with it so `AnyComponentSchema` claims the type
 * instead of refusing it at `type`. The arm is declared from the widget's read
 * points: a required `properties` bag holding exactly `plan`, a non-empty
 * string, and both content channels refused by name.
 *
 * Refusals are asserted by issue `code` and `path` — the envelope a consumer
 * reads — and not by message wording.
 */

import { describe, expect, it } from 'vitest';

import {
  AnyComponentSchema,
  CloudPlanStatusSchema,
  StrictAnyComponentSchema,
  safeValidateSchema,
} from '../zod/index.zod.js';

const TYPE = 'cloud:plan-status';

/** The issues of a refused parse, as `code` + dotted `path`. */
function issuesOf(document: unknown): { code: string; path: string; message: string }[] {
  const result = safeValidateSchema(document);
  expect(result.success, 'expected a refusal').toBe(false);
  if (result.success) return [];
  return result.error.issues.map((issue) => ({
    code: issue.code,
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

describe('`cloud:plan-status` — the node the pricing page authors (objectui#10919)', () => {
  it('accepts one plan-card marker on every face', () => {
    const node = { type: TYPE, properties: { plan: 'free' } };
    expect(CloudPlanStatusSchema.safeParse(node).success).toBe(true);
    expect(safeValidateSchema(node).success).toBe(true);
    expect(StrictAnyComponentSchema.safeParse(node).success).toBe(true);
  });

  it('accepts the node inside a page, with the spec page-component keys cloud writes beside it', () => {
    const page = {
      type: 'page',
      children: [
        {
          type: TYPE,
          id: 'plan_free_current',
          className: 'self-start',
          properties: { plan: 'free' },
        },
      ],
    };
    expect(safeValidateSchema(page).success).toBe(true);
  });

  it('is claimed at `type` — the union no longer refuses the literal', () => {
    // The ratchet's reading (`registered-types-validate-ratchet-10859.test.ts`):
    // a bare `{ type }` fails on the missing bag, NOT with `invalid_union` at `type`.
    const issues = issuesOf({ type: TYPE });
    expect(issues.some((i) => i.code === 'invalid_union' && i.path === 'type')).toBe(false);
    // Control: an unclaimed `cloud:` literal IS refused there.
    const unclaimed = issuesOf({ type: 'cloud:no-such-widget-10919', properties: { plan: 'free' } });
    expect(unclaimed.some((i) => i.code === 'invalid_union' && i.path === 'type')).toBe(true);
  });
});

describe('`cloud:plan-status` — what the arm refuses (objectui#10919)', () => {
  it('refuses a node with no `properties` bag', () => {
    expect(issuesOf({ type: TYPE })).toEqual([
      expect.objectContaining({ code: 'invalid_type', path: 'properties' }),
    ]);
  });

  it('refuses a bag that names no plan', () => {
    expect(issuesOf({ type: TYPE, properties: {} })).toEqual([
      expect.objectContaining({ code: 'invalid_type', path: 'properties.plan' }),
    ]);
  });

  it('refuses an empty plan', () => {
    expect(issuesOf({ type: TYPE, properties: { plan: '' } })).toEqual([
      expect.objectContaining({ code: 'too_small', path: 'properties.plan' }),
    ]);
  });

  it('refuses a plan that is not a string', () => {
    expect(issuesOf({ type: TYPE, properties: { plan: 1 } })).toEqual([
      expect.objectContaining({ code: 'invalid_type', path: 'properties.plan' }),
    ]);
  });

  it('refuses a key the widget does not read, inside the bag', () => {
    expect(issuesOf({ type: TYPE, properties: { plan: 'free', label: 'Current' } })).toEqual([
      expect.objectContaining({ code: 'unrecognized_keys', path: 'properties' }),
    ]);
  });

  it('refuses a flat `plan` — the widget reads the bag only', () => {
    // Tolerant face: the bag is missing, so the node is refused there.
    expect(issuesOf({ type: TYPE, plan: 'free' })).toEqual([
      expect.objectContaining({ code: 'invalid_type', path: 'properties' }),
    ]);
    // Strict face: a flat `plan` beside a valid bag is an unknown node key.
    const strict = StrictAnyComponentSchema.safeParse({ type: TYPE, plan: 'free', properties: { plan: 'free' } });
    expect(strict.success).toBe(false);
    expect(strict.error?.issues.map((i) => i.code)).toContain('unrecognized_keys');
  });

  it.each(['children', 'body'])('refuses `%s` by name — the widget reads neither content channel', (key) => {
    const issues = issuesOf({ type: TYPE, properties: { plan: 'free' }, [key]: [{ type: 'text', content: 'x' }] });
    expect(issues).toEqual([expect.objectContaining({ code: 'invalid_type', path: key })]);
    expect(issues[0].message).toContain(TYPE);
  });

  it('reaches the arm through the union, not a second schema', () => {
    // The union dispatches on the literal to this arm: the same refusal either way.
    const bare = CloudPlanStatusSchema.safeParse({ type: TYPE, properties: { plan: '' } });
    const viaUnion = AnyComponentSchema.safeParse({ type: TYPE, properties: { plan: '' } });
    expect(bare.success).toBe(false);
    expect(viaUnion.success).toBe(false);
    expect(viaUnion.error?.issues.map((i) => [i.code, i.path.join('.')])).toEqual(
      bare.error?.issues.map((i) => [i.code, i.path.join('.')]),
    );
  });
});
