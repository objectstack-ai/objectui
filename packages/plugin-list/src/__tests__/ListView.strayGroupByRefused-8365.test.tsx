/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#8365 — a surviving `groupBy` in the kanban config OVERRODE the lane
 * `ListView` had just resolved.
 *
 * `ListView`'s kanban branch destructured
 * `columns`/`groupByField`/`groupField`/`cardFields`/`titleField` out of the
 * merged config and spread the REST *after* its own `groupBy: laneField`. So an
 * authored `kanban.groupBy` rode the `.passthrough()` `KanbanConfig` mirror into
 * `restKanban` and won over the canonical `groupByField` the branch had already
 * resolved — the board grouped by the stray key, and nothing said so.
 *
 * ## THE DISTINGUISHING FIXTURE, and why it had to be hand-built
 *
 * The override was measured as ACTIVE, not latent. It read as latent only
 * because the one producer that fed it (`app-shell`'s `kanbanViewOptions`,
 * retired by objectui#8213) wrote both spellings with the SAME value by
 * construction — so no fixture driven by that producer could tell them apart,
 * and an override row driven by it was a test that cannot fail. The two
 * spellings therefore carry two DIFFERENT lane names here, which is the whole
 * reason this file exists:
 *
 *     options.kanban = { groupBy: 'LANE_FROM_STRAY_GROUPBY' }
 *     kanban         = { groupByField: 'LANE_FROM_CANONICAL' }
 *
 * ## THE RULING, and the two halves it asks for
 *
 * Maintainer ruling of 2026-09-12 (decision batch #117 item 5, verbatim
 * 「8365 同意」) — option B. Option A (strip the key and re-group in silence)
 * was the fallback for a measured zero of stored views and was NOT taken.
 * Honouring `groupBy` as a declared alias was never on the table: the protocol
 * refuses it BY NAME (see the control below), and legalising it would be a spec
 * change on its own `objectstack` card, never a renderer-side widening
 * (AGENTS.md #0.1).
 *
 *   1. THE CANONICAL LANE WINS — `ListView` adds `groupBy` to the destructure,
 *      so the stray key can no longer reach `restKanban`. Asserted on the
 *      GENERATED `object-kanban` node, through a registry spy, because that node
 *      is the only place the override was ever observable.
 *   2. THE STRAY KEY IS REFUSED LOUDLY, at the READ DOOR of the view and in the
 *      sentence shape the platform contract already uses for the sibling alias.
 *      That door is the view-level `KanbanConfig` mirror in `@object-ui/types`
 *      (`zod/objectql.zod.ts`), reached here through the published
 *      `safeValidateSchema` — the same entry point the CLI's `os check` /
 *      `os validate` and the VS Code extension run, i.e. where the AUTHOR of the
 *      view is standing. ⛔ Deliberately NOT a `console.warn`: the ruling names
 *      that outcome and refuses it.
 *
 *      ⚠️ TWO NESTINGS, and the second one is load-bearing rather than thorough.
 *      `ListView` merges `{ ...options.kanban, ...kanban }`, and the producer
 *      objectui#8213 retired wrote into `options.kanban` — so that is where the
 *      stored views this ruling is ABOUT carry the key. `options` is
 *      `z.record(z.string(), z.any())` and can declare no member, so it takes the
 *      declared arm's guidance as a CHECK (`custom`) while the declared `kanban`
 *      slot reports the arm itself (`invalid_type`). Two codes, ONE message —
 *      asserted below, because a refusal that only reached the declared nesting
 *      would leave exactly the affected population silently re-grouped, i.e.
 *      option A wearing option B's name.
 *
 * ## THE CONTROLS, and what each one would catch
 *
 * - DARK CONTROL (`groupByField` alone) — parses GREEN through the same door.
 *   Without it, "the door refuses the fixture" is satisfied by a door that
 *   refuses everything.
 * - PASSTHROUGH CONTROL (an undeclared `zzzBogusKey`) — still parses GREEN.
 *   `KanbanConfig` stays `.passthrough()` for renderer-ahead knobs
 *   (`swimlaneField` is the live one); this card declared exactly ONE named
 *   refusal arm and did not close the object. Without this arm a later
 *   `.strict()` would satisfy every other assertion here.
 * - PROTOCOL CONTROL — `@objectstack/spec`'s own `KanbanConfigSchema` refuses
 *   `groupBy` by name, with a lit control (`zzzBogusKey`) firing and a dark
 *   control (`groupByField` alone) drawing no `unrecognized_keys`. This is what
 *   makes "the mirror stopped being more permissive than the spec" a reading
 *   rather than a claim, and it reddens first if a later spec bump ever DECLARES
 *   `groupBy`.
 * - LANE CONTROL (`groupBy` alone, no canonical key) — the board falls back to
 *   the detector / no lane, and does NOT silently keep grouping by the stray
 *   key. This is the arm that tells option B apart from "strip it and hope".
 *
 * REVERSE VERIFICATION — direction predicted before running, then observed:
 * remove `groupBy` from the destructure in `ListView.tsx` and the lane arms go
 * RED naming `LANE_FROM_STRAY_GROUPBY`, while every refusal arm stays GREEN;
 * remove the `groupBy` arm from `KanbanConfig` and the refusal arms go RED while
 * the lane arms stay GREEN. Two independent halves, two independent ablations —
 * the asymmetry is what proves neither arm is carrying the other.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { ComponentRegistry } from '@object-ui/core';
import { SchemaRendererProvider } from '@object-ui/react';
import { safeValidateSchema } from '@object-ui/types/zod';
import { KanbanConfigSchema } from '@objectstack/spec/ui';
import { ListView } from '../ListView';

const OBJECT = 'deal';

/** The two lane names the fixture holds apart. */
const STRAY = 'LANE_FROM_STRAY_GROUPBY';
const CANONICAL = 'LANE_FROM_CANONICAL';

const objectDef = {
  name: OBJECT,
  label: 'Deal',
  fields: {
    id: { name: 'id', type: 'text', label: 'Id' },
    name: { name: 'name', type: 'text', label: 'Name' },
    [CANONICAL]: { name: CANONICAL, type: 'text', label: 'Canonical lane' },
    [STRAY]: { name: STRAY, type: 'text', label: 'Stray lane' },
  },
};

/** Every `object-kanban` node the renderer generated, in order. */
let kanbanNodes: Array<Record<string, any>> = [];

ComponentRegistry.register(
  'object-kanban',
  (props: Record<string, any>) => {
    kanbanNodes.push(props.schema);
    return <div data-testid="kanban-spy" />;
  },
  { namespace: 'test', label: 'Kanban spy', category: 'view' },
);

const makeDataSource = () =>
  ({
    find: vi.fn(async () => []),
    findOne: vi.fn(async () => null),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(async () => 0),
    getObjectSchema: vi.fn(async () => objectDef),
    getObjects: vi.fn(async () => []),
    onMutation: () => () => {},
  }) as any;

/** Mount `ListView` on a view and return the last generated `object-kanban` node. */
async function generatedKanbanNode(view: Record<string, unknown>) {
  const dataSource = makeDataSource();
  render(
    <SchemaRendererProvider dataSource={dataSource}>
      <ListView
        schema={{ type: 'list-view', objectName: OBJECT, viewType: 'kanban', ...view } as never}
        dataSource={dataSource}
      />
    </SchemaRendererProvider>,
  );
  await waitFor(() => expect(kanbanNodes.length).toBeGreaterThan(0));
  return kanbanNodes[kanbanNodes.length - 1];
}

/**
 * THE FIXTURE, built once and used by BOTH halves — the lane assertions read it
 * through the renderer, the refusal assertions read it through the read door, so
 * neither half can drift onto a different document than the other.
 */
const DISTINGUISHING_VIEW = {
  type: 'list-view',
  objectName: OBJECT,
  viewType: 'kanban',
  options: { kanban: { groupBy: STRAY } },
  kanban: { groupByField: CANONICAL },
} as const;

/** Issues the read door raises at `kanban.groupBy`, if any. */
const refusalIssuesFor = (doc: unknown) => {
  const result = safeValidateSchema(doc);
  if (result.success) return [];
  return result.error.issues.filter((i) => i.path.join('.').endsWith('kanban.groupBy'));
};

beforeEach(() => {
  kanbanNodes = [];
});

describe('objectui#8365 · half 1 — the CANONICAL lane wins on the generated node', () => {
  it('the distinguishing fixture resolves the lane from `groupByField`, not the stray `groupBy`', async () => {
    const node = await generatedKanbanNode(DISTINGUISHING_VIEW);
    // Before the fix this read `LANE_FROM_STRAY_GROUPBY`: the `...restKanban`
    // spread landed after the branch's own `groupBy: laneField`.
    expect(node.groupBy).toBe(CANONICAL);
    expect(node.groupBy).not.toBe(STRAY);
  });

  it('the stray key does not reach the generated node under ANY spelling', async () => {
    const node = await generatedKanbanNode(DISTINGUISHING_VIEW);
    // The node's `groupBy` IS the live lane key `ObjectKanban` reads, so the
    // assertion is about its VALUE above. This one is about the stray value:
    // it must appear nowhere on the node, including under a key the merge might
    // have carried it through.
    expect(Object.values(node)).not.toContain(STRAY);
  });

  it('CONTROL: the declared `kanban.groupByField` still resolves the lane on its own', async () => {
    const node = await generatedKanbanNode({ kanban: { groupByField: CANONICAL } });
    expect(node.groupBy).toBe(CANONICAL);
  });

  it('CONTROL: the legacy `kanban.groupField` alias still resolves the lane', async () => {
    // The VIEW-LEVEL legacy alias is LIVE and untouched by this card — only the
    // third spelling is refused. Without this arm the fix could have narrowed
    // the alias read as well and nothing here would notice.
    const node = await generatedKanbanNode({ kanban: { groupField: CANONICAL } });
    expect(node.groupBy).toBe(CANONICAL);
  });

  it('LANE CONTROL: `groupBy` alone no longer sets the lane — option B, not a silent re-grouping', async () => {
    const node = await generatedKanbanNode({ options: { kanban: { groupBy: STRAY } } });
    expect(node.groupBy).not.toBe(STRAY);
  });
});

describe('objectui#8365 · half 2 — the stray key is REFUSED at the read door', () => {
  it('the distinguishing fixture is refused BY NAME, pointing at `groupByField`', () => {
    const issues = refusalIssuesFor(DISTINGUISHING_VIEW);
    expect(issues).toHaveLength(1);
    // ⭐ THE LEGACY NESTING. `options` is `z.record(z.string(), z.any())` and can
    // declare no MEMBER, so the refusal there is a CHECK — `custom`, not
    // `invalid_type`. Two codes, ONE message (the check reads the declared arm's
    // own `.description`), which is why the message assertions below are shared
    // between the two nestings while the code assertions are not.
    expect(issues[0].code).toBe('custom');
    expect(issues[0].path.join('.')).toBe('options.kanban.groupBy');
    // The lead sentence is the one the protocol's own `strictObject({ aliases })`
    // answers with, so an author meets ONE remedy on both faces.
    expect(issues[0].message).toContain('Unrecognized key(s) on this kanban configuration: `groupBy`.');
    expect(issues[0].message).toContain('Did you mean `groupBy` → `groupByField`?');
  });

  it('the DECLARED nesting is refused with the SAME message, as a declared member', () => {
    const declared = refusalIssuesFor({
      type: 'list-view',
      objectName: OBJECT,
      kanban: { groupByField: CANONICAL, groupBy: STRAY },
    });
    expect(declared).toHaveLength(1);
    // `aliasKeyRefusal` is a `z.never()` ARM here, so the envelope is
    // `invalid_type` at the key's own path.
    expect(declared[0].code).toBe('invalid_type');
    expect(declared[0].path.join('.')).toBe('kanban.groupBy');
    // ⭐ ONE STRING, BOTH NESTINGS — the assertion that keeps the check and the
    // arm from drifting into two dialects of one remedy.
    const legacy = refusalIssuesFor(DISTINGUISHING_VIEW);
    expect(declared[0].message).toBe(legacy[0].message);
  });

  it('DARK CONTROL: the canonical config alone parses GREEN through the same door', () => {
    const result = safeValidateSchema({
      type: 'list-view',
      objectName: OBJECT,
      kanban: { groupByField: CANONICAL },
    });
    expect(result.success).toBe(true);
  });

  it('PASSTHROUGH CONTROL: an undeclared sibling key still rides through GREEN', () => {
    // `KanbanConfig` keeps `.passthrough()` for renderer-ahead knobs. This card
    // declared ONE named refusal arm; it did not close the object.
    const result = safeValidateSchema({
      type: 'list-view',
      objectName: OBJECT,
      kanban: { groupByField: CANONICAL, zzzBogusKey: 'still accepted' },
    });
    expect(result.success).toBe(true);
  });
});

describe('objectui#8365 · the protocol is what this mirror is aligning to', () => {
  /** Keys `@objectstack/spec`'s strict `KanbanConfigSchema` names as refused. */
  const specRefusedKeys = (cfg: Record<string, unknown>) => {
    const r = KanbanConfigSchema.safeParse(cfg);
    if (r.success) return [];
    return r.error.issues.flatMap((i) => ((i as { keys?: string[] }).keys ?? []));
  };

  it('PROTOCOL CONTROL: the spec refuses `groupBy` BY NAME, with both controls firing', () => {
    // LIT: a bogus key is named. DARK: the canonical config draws no
    // `unrecognized_keys` at all. Between them, the middle row is a reading.
    expect(specRefusedKeys({ groupByField: 'stage', columns: ['name'], zzzBogusKey: 1 })).toContain('zzzBogusKey');
    expect(specRefusedKeys({ groupByField: 'stage', columns: ['name'] })).toEqual([]);
    expect(specRefusedKeys({ groupByField: 'stage', columns: ['name'], groupBy: 'stage' })).toContain('groupBy');
  });

  it('PROTOCOL CONTROL: `groupBy` is still not a key the spec DECLARES', () => {
    // If a later spec bump ever declares it, this reddens first and the refusal
    // arm above becomes the thing to re-decide — deliberately, on a new card.
    expect(Object.keys((KanbanConfigSchema as any).shape)).not.toContain('groupBy');
  });
});
