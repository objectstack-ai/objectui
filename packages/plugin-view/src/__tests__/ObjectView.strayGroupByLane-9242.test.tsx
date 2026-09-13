/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#9242 — a stray `groupBy` in `viewOptions.kanban` OVERRODE the lane
 * `generateViewSchema` had just resolved. THE SECOND ROUTE.
 *
 * `generateViewSchema`'s kanban branch destructured
 * `columns`/`groupByField`/`groupField`/`titleField`/`conditionalFormatting`
 * out of `viewOptions.kanban` and spread the REST *after* its own `groupBy`. So
 * an authored `kanban.groupBy` survived into `restKanban` and won over the
 * canonical `groupByField` the branch had already resolved — the board grouped
 * by the stray key, and nothing said so.
 *
 * ## WHY THIS IS A SECOND ROUTE, NOT A DUPLICATE OF objectui#8365
 *
 * `generateViewSchema` runs precisely when no host supplied `renderListView` —
 * the authored `object-view` element — so it never passes through `ListView`,
 * and PR objectui#9236's destructure fix does not reach it. This is the same
 * distinction the `calendar` branch a few lines below records for objectui#7029.
 *
 * ## THE RULING — already made; this card only applies it to the second route
 *
 * Maintainer ruling of 2026-09-12 (decision batch #117 item 5, verbatim
 * 「8365 同意」) — option B: the CANONICAL spelling wins and the stray key is
 * refused BY NAME. Option A (strip the key and re-group in silence) was NOT
 * taken. ⛔ This is not an open question; see objectui#8365 / PR objectui#9236.
 *
 * ## THE DISTINGUISHING FIXTURE, and why one lane name would not do
 *
 * The two spellings carry two DIFFERENT lane names. With a single name the
 * override arm cannot fail BY CONSTRUCTION — which is exactly how the twin
 * defect stayed invisible for so long on the first route: the one producer that
 * fed it wrote both spellings with the same value.
 *
 *     kanban = { groupBy: 'LANE_FROM_STRAY_GROUPBY',
 *                groupByField: 'LANE_FROM_CANONICAL' }
 *
 * ## ⭐ THE ARM THAT IS **MEASURED HERE**, NOT COPIED FROM THE TWIN
 *
 * `ListView` floors its lane on `detectStatusField(objectDef)`. THIS branch
 * floors it on the LITERAL `'status'` (`groupByField || groupField || 'status'`),
 * so the "stray key alone" control answers differently on the two routes and
 * copying the twin's assertion would have pinned the wrong thing.
 *
 * Measured on this tree before this file was written (base `96919a459`, every
 * lit control firing), `node.groupBy` per fixture:
 *
 *   | kanban config                          | BEFORE fix | AFTER fix  |
 *   | -------------------------------------- | ---------- | ---------- |
 *   | `{ groupBy: S, groupByField: C }`      | **S** ⛔   | C          |
 *   | `{ groupBy: S }`                       | **S** ⛔   | `'status'` |
 *   | `{ groupBy: S }`, object has NO status | **S** ⛔   | `'status'` |
 *   | `{}`                                   | `'status'` | `'status'` |
 *   | `{ groupByField: C }`                  | C          | C          |
 *   | `{ groupField: C }`                    | C          | C          |
 *
 * The third row is the one that tells a LITERAL floor apart from a detector: an
 * object declaring no `status` field still floors at `'status'` here, where the
 * twin would have produced `undefined`. Pinned below for exactly that reason.
 *
 * ## WHAT THIS CARD DELIBERATELY DOES NOT TOUCH — four faces
 *
 *  1. THE CONTRACT HALF. `KanbanConfig`'s `aliasKeyRefusal` for `groupBy`
 *     (`@object-ui/types`, `zod/objectql.zod.ts`) landed with PR objectui#9236
 *     and already covers BOTH routes — a view carrying the key is refused at
 *     every validating door. It is pinned in
 *     `packages/plugin-list/src/__tests__/ListView.strayGroupByRefused-8365.test.tsx`
 *     and `packages/types/src/__tests__/kanban-stray-group-by-refusal-8365.test.ts`;
 *     ⛔ not re-pinned here, because what remains on this route is a BEHAVIOUR
 *     gap — a document that never went through a validator.
 *  2. THE LIVE LEGACY ALIAS `kanban.groupField`, a legacy spelling of the spec's
 *     `groupByField`. Still read, still resolves the lane — CONTROL below.
 *  3. `groupBy` ON THE GENERATED NODE. That is the canonical lane key
 *     `ObjectKanban` actually reads (thirteen `schema.groupBy` reads in
 *     `ObjectKanban.tsx`); the stray key is a VIEW-CONFIG spelling. Do not
 *     confuse the two — the whole fix is to stop the second from reaching the
 *     first.
 *  4. `ListView` — objectui#8365's face, closed.
 *
 * ## REVERSE VERIFICATION (the ablation leg), direction predicted before running
 *
 * Run in its STRONGEST form: this file was written and run BEFORE
 * `ObjectView.tsx` was touched, so the "unmodified" arm is the REAL BASE TREE
 * rather than an injected mutation — no on-disk mutation to prove, no restore
 * leg to get wrong. Predicted and then observed on `96919a459`: the three
 * override arms go RED naming `LANE_FROM_STRAY_GROUPBY`, while every CONTROL
 * arm (canonical, legacy alias, floor, passthrough, sibling keys) stays GREEN.
 * The asymmetry is what shows the controls are not carrying the override arms.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';
import { ObjectView } from '../ObjectView';
import type { ObjectViewSchema } from '@object-ui/types';

/** The two lane names the fixture holds apart. */
const STRAY = 'LANE_FROM_STRAY_GROUPBY';
const CANONICAL = 'LANE_FROM_CANONICAL';
/** The literal this branch floors the lane at — NOT a detector. */
const FLOOR = 'status';

/** Every schema the view hands to SchemaRenderer, in order. */
const rendered: any[] = [];

vi.mock('@object-ui/react', async (importOriginal) => {
  const ReactMod = await import('react');
  return {
    ...(await importOriginal<Record<string, unknown>>()),
    SchemaRenderer: ({ schema }: any) => {
      rendered.push(schema);
      return <div data-testid="schema-renderer">{schema?.type}</div>;
    },
    SchemaRendererContext: ReactMod.createContext(null),
    subscribeDataChanges: () => () => {},
    notifyDataChanged: () => {},
  };
});
vi.mock('@object-ui/plugin-grid', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ObjectGrid: () => <div data-testid="object-grid" />,
}));
vi.mock('@object-ui/plugin-form', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ObjectForm: () => <div data-testid="object-form" />,
}));

/** An object that DOES declare a `status` field. */
const WITH_STATUS = { status: { name: 'status', type: 'text', label: 'Status' } };
/** An object that declares NO `status` field — tells a literal floor from a detector. */
const WITHOUT_STATUS = { name: { name: 'name', type: 'text', label: 'Name' } };

const dataSource = (fields: Record<string, unknown> = WITH_STATUS): any => ({
  find: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  findOne: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getObjectSchema: vi.fn().mockResolvedValue({ name: 'task', fields }),
});

/**
 * Renders a kanban view through the REGISTERED renderer's path — i.e. with no
 * `renderListView` — and returns the `object-kanban` node the branch emits.
 *
 * ⚠️ `cleanup()` is load-bearing, not hygiene. Without it the previously
 * mounted `ObjectView`s stay mounted and keep pushing into `rendered`, so
 * `rendered[rendered.length - 1]` returns a STALE node and every reading comes
 * back shifted by one fixture. That failure was hit while measuring this card:
 * it renders as a plausible table in which the lit controls quietly answer the
 * previous row's question. ⛔ Do not drop it.
 */
async function generatedKanbanNode(
  kanban: Record<string, unknown>,
  fields?: Record<string, unknown>,
): Promise<any> {
  cleanup();
  rendered.length = 0;
  render(
    <ObjectView
      schema={{ type: 'object-view', objectName: 'task' } as unknown as ObjectViewSchema}
      views={[{ id: 'k', label: 'Board', type: 'kanban' as any, kanban }] as any}
      dataSource={dataSource(fields)}
    />,
  );
  await waitFor(() => expect(rendered.length).toBeGreaterThan(0));
  const node = rendered[rendered.length - 1];
  expect(node.type).toBe('object-kanban');
  return node;
}

beforeEach(() => {
  rendered.length = 0;
});

describe('objectui#9242 — the CANONICAL lane wins on the node `generateViewSchema` emits', () => {
  it('the distinguishing fixture resolves the lane from `groupByField`, not the stray `groupBy`', async () => {
    const node = await generatedKanbanNode({ groupBy: STRAY, groupByField: CANONICAL });
    // Before the fix this read `LANE_FROM_STRAY_GROUPBY`: the `...restKanban`
    // spread landed after the branch's own `groupBy`.
    expect(node.groupBy).toBe(CANONICAL);
    expect(node.groupBy).not.toBe(STRAY);
  });

  it('the stray VALUE does not reach the generated node under any key at all', async () => {
    const node = await generatedKanbanNode({ groupBy: STRAY, groupByField: CANONICAL });
    // The assertion above is about the lane key's VALUE. This one is about the
    // stray value: it must appear nowhere on the node, including under some
    // other key the spread might have carried it through.
    expect(Object.values(node)).not.toContain(STRAY);
    expect(Object.prototype.hasOwnProperty.call(node, 'groupByField')).toBe(false);
  });

  it('LANE CONTROL (measured here, ⛔ not copied from `ListView`): `groupBy` alone floors at the literal', async () => {
    // ⭐ THE ARM THE CARD SINGLED OUT. `ListView` answers this with
    // `detectStatusField(objectDef)`; this branch answers with the LITERAL
    // `'status'`. Option B, not a silent re-grouping: the stray key stops
    // steering the board, and what replaces it is this branch's own floor.
    const node = await generatedKanbanNode({ groupBy: STRAY });
    expect(node.groupBy).toBe(FLOOR);
    expect(node.groupBy).not.toBe(STRAY);
  });

  it('LANE CONTROL: the floor is a LITERAL — it holds when the object declares no `status` field', async () => {
    // This is the row that tells a literal floor apart from a detector, and so
    // the row that would redden first if anyone ever "aligned" this branch with
    // the twin by swapping in `detectStatusField`. That would be a behaviour
    // change on stored views and belongs on its own card, not in a tidy-up.
    const node = await generatedKanbanNode({ groupBy: STRAY }, WITHOUT_STATUS);
    expect(node.groupBy).toBe(FLOOR);
    expect(node.groupBy).not.toBe(STRAY);
    expect(node.groupBy).toBeDefined();
  });
});

describe('objectui#9242 — the controls, each able to fire on its own', () => {
  it('CONTROL: the declared `kanban.groupByField` still resolves the lane by itself', async () => {
    const node = await generatedKanbanNode({ groupByField: CANONICAL });
    expect(node.groupBy).toBe(CANONICAL);
  });

  it('CONTROL: the LIVE legacy alias `kanban.groupField` still resolves the lane', async () => {
    // ⚠️ The VIEW-LEVEL legacy alias is live and untouched by this card — only
    // the third spelling is stripped. Without this arm the fix could have
    // narrowed the alias read too and nothing here would have noticed.
    const node = await generatedKanbanNode({ groupField: CANONICAL });
    expect(node.groupBy).toBe(CANONICAL);
  });

  it('CONTROL: with neither declared key the lane is the floor, exactly as before this card', async () => {
    const node = await generatedKanbanNode({});
    expect(node.groupBy).toBe(FLOOR);
  });

  it('PASSTHROUGH CONTROL: an undeclared sibling key still rides through onto the node', async () => {
    // The destructure strips exactly ONE more key. It does not close the bag:
    // `restKanban` is still how renderer-ahead knobs reach the kanban node.
    // Without this arm, someone could satisfy every assertion above by dropping
    // the passthrough altogether.
    const node = await generatedKanbanNode({ groupByField: CANONICAL, zzzBogusKey: 'rides-through' });
    expect(node.zzzBogusKey).toBe('rides-through');
    expect(node.groupBy).toBe(CANONICAL);
  });

  it('CONTROL: the rest of the kanban branch still resolves — titleField and cardFields', async () => {
    // Without this arm every assertion above would pass just as happily against
    // a kanban branch that had stopped emitting anything at all.
    const node = await generatedKanbanNode({
      groupByField: CANONICAL,
      columns: ['name', 'amount'],
      titleField: 'name',
    });
    expect(node.titleField).toBe('name');
    expect(node.cardFields).toEqual(['name', 'amount']);
    // `columns` on the node would be read as LANES by `object-kanban`, so the
    // branch maps it to `cardFields` and strips it. Unchanged by this card.
    expect(node.columns).toBeUndefined();
  });
});
