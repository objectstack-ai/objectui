/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#8980 — a READ POINT per protocol member a named list view declares.
 *
 * ## The card, and the ruling
 *
 * The protocol declares 17 live members on the value type of
 * `ViewSchema.listViews` / `ObjectSchema.listViews` (`ObjectListViewSchema`,
 * `@objectstack/spec/ui`) that `NamedListView` declared NONE of — objectui
 * NARROWER than the protocol, the direction the maintainer's standing principle
 * forbids. Director-seat class-one adjudication of 2026-09-13 ruled: declare all
 * 17 with their types taken from the protocol, and give each a read point IN THE
 * SAME DELIVERY. This file is that second half.
 *
 * ⛔ The declaration half is NOT re-pinned here; it lives with the census in
 * `packages/types/src/__tests__/object-view-unmirrored-keys-7779.test.ts`, which
 * partitions the interface into read (21) and unread (43) and fails in EITHER
 * direction when a member moves between them.
 *
 * ## The three routes out of `ObjectView`, and which member uses which
 *
 * The component has three exits, and the card's members do not all leave by the
 * same one. Pinning only one of them would have left two thirds of the ruling
 * unmeasured.
 *
 *  1. `generateViewSchema` — the AUTHORED path for a non-grid view: no host
 *     supplied `renderListView`, so this is what the REGISTERED `object-view`
 *     renderer runs. Carries the 8 view-kind blocks to `ObjectKanban`,
 *     `ObjectCalendar`, `ObjectGallery`, `ObjectTimeline`, `ObjectGantt`,
 *     `ObjectMap`, `ObjectChart`, `ObjectTree`.
 *  2. `gridSchema` → `ObjectGrid` — the AUTHORED path for `type: 'grid'`, and
 *     the read point for `grouping` / `rowColor`, both of which `ObjectGrid`
 *     already reads (`collectGroupingFieldRefs(schema.grouping)`,
 *     `useRowColor(schema.rowColor)`).
 *  3. the `renderListView` delegation — the HOST path (objectui#5097), whose
 *     sink is `ListView`, the renderer that reads `fieldOrder`, `grouping`,
 *     `rowColor`, `userActions`, `appearance` and `data`.
 *
 * ## ⚠️ THREE MEMBERS ARE REPORTED, NOT WIRED — the ruling's own item 2
 *
 * "A member for which the renderer has no behaviour to attach is REPORTED on
 * this card with the measurement, ⛔ not silently declared inert and ⛔ not
 * dropped from the type."
 *
 *  - `tabs` and `pageName` — no reader on this surface at all. The last describe
 *    block below pins BOTH the absence and the control that makes it a reading.
 *  - `chart` / `tree` — READ (case 8 below proves it), but objectui#5321 ruled
 *    both view KINDS host-composition-only, so a named view reaches them only by
 *    declaring no `type` of its own while a host `views` entry selects one. That
 *    narrow route is pinned rather than described.
 *
 * ## Reverse verification — direction predicted BEFORE the run
 *
 * Each FIX case was predicted to go RED on the base tree (`bbc9dc34e3`), where
 * the canonical top-level blocks were undeclarable and none of the six relay /
 * grid rungs existed; each CONTROL case rides a rung this card did not touch and
 * was predicted GREEN. The asymmetry is the point: a control that moves with the
 * fix is a control that was carrying the fix. Measured outcome on the PR.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';
import { ObjectView } from '../ObjectView';
import type { NamedListView, ObjectViewSchema } from '@object-ui/types';

/** Every node handed to SchemaRenderer, in order — route 1's sink. */
const rendered: any[] = [];
/** Every schema handed to ObjectGrid — route 2's sink. */
const gridSchemas: any[] = [];

vi.mock('@object-ui/react', async (importOriginal) => {
  const React = await import('react');
  return {
    ...(await importOriginal<Record<string, unknown>>()),
    SchemaRenderer: ({ schema }: any) => {
      rendered.push(schema);
      return <div data-testid="schema-renderer">{schema?.type}</div>;
    },
    SchemaRendererContext: React.createContext(null),
    subscribeDataChanges: () => () => {},
    notifyDataChanged: () => {},
  };
});
vi.mock('@object-ui/plugin-grid', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ObjectGrid: ({ schema }: any) => {
    gridSchemas.push(schema);
    return <div data-testid="object-grid" />;
  },
}));
vi.mock('@object-ui/plugin-form', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ObjectForm: () => <div data-testid="object-form" />,
}));

const dataSource = (): any => ({
  find: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  findOne: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getObjectSchema: vi.fn().mockResolvedValue({ name: 'task', fields: {} }),
});

const NODE = { type: 'object-view', objectName: 'task' } as unknown as ObjectViewSchema;

/**
 * ⚠️ `cleanup()` is load-bearing, not hygiene — the trap recorded on
 * objectui#9242: without it the previously mounted `ObjectView`s keep pushing
 * into the sinks, so the last entry answers the PREVIOUS fixture's question and
 * every reading comes back shifted by one.
 */
function resetSinks() {
  cleanup();
  rendered.length = 0;
  gridSchemas.length = 0;
}

/** Route 1 — the node `generateViewSchema` emits for a NAMED view. */
async function generatedNodeFor(view: NamedListView, views?: any[]): Promise<any> {
  resetSinks();
  render(
    <ObjectView
      schema={{ ...NODE, listViews: { v1: view } } as unknown as ObjectViewSchema}
      views={views}
      dataSource={dataSource()}
    />,
  );
  await waitFor(() => expect(rendered.length).toBeGreaterThan(0));
  return rendered[rendered.length - 1];
}

/** Route 2 — the `object-grid` schema a `type: 'grid'` named view produces. */
async function gridSchemaFor(view: NamedListView): Promise<any> {
  resetSinks();
  render(
    <ObjectView
      schema={{ ...NODE, listViews: { v1: view } } as unknown as ObjectViewSchema}
      dataSource={dataSource()}
    />,
  );
  await waitFor(() => expect(gridSchemas.length).toBeGreaterThan(0));
  return gridSchemas[gridSchemas.length - 1];
}

/** Route 3 — the `list-view` schema the host delegation hands down. */
function delegatedSchemaFor(view: NamedListView, nodeExtra: Record<string, unknown> = {}): any {
  resetSinks();
  const seen: any[] = [];
  render(
    <ObjectView
      schema={{ ...NODE, ...nodeExtra, listViews: { v1: view } } as unknown as ObjectViewSchema}
      dataSource={dataSource()}
      renderListView={({ schema: s }: any) => {
        seen.push(s);
        return <div data-testid="delegated" />;
      }}
    />,
  );
  expect(seen.length).toBeGreaterThan(0);
  return seen[0];
}

beforeEach(resetSinks);

/* ─────────────────────────────────────────────────────────────────────────────
 * Route 1 — the eight view-KIND blocks, at the protocol's own top level
 * ────────────────────────────────────────────────────────────────────────── */

describe('objectui#8980 — a canonical top-level view-kind block reaches the renderer ObjectView dispatches to', () => {
  it('`kanban` → `object-kanban` (ObjectKanban)', async () => {
    const node = await generatedNodeFor({ label: 'Board', type: 'kanban', kanban: { groupByField: 'stage' } });
    expect(node.type).toBe('object-kanban');
    // The lane the branch resolves is the one the CANONICAL block declared.
    expect(node.groupBy).toBe('stage');
  });

  it('`calendar` → `object-calendar` (ObjectCalendar)', async () => {
    const node = await generatedNodeFor({ label: 'Cal', type: 'calendar', calendar: { startDateField: 'due_at' } });
    expect(node.type).toBe('object-calendar');
    expect(node.startDateField).toBe('due_at');
  });

  it('`gallery` → `object-gallery` (ObjectGallery)', async () => {
    const node = await generatedNodeFor({ label: 'Cards', type: 'gallery', gallery: { coverField: 'photo' } });
    expect(node.type).toBe('object-gallery');
    expect(node.imageField).toBe('photo');
  });

  it('`timeline` → `object-timeline` (ObjectTimeline)', async () => {
    const node = await generatedNodeFor({ label: 'Feed', type: 'timeline', timeline: { startDateField: 'created_at' } });
    expect(node.type).toBe('object-timeline');
    expect(node.startDateField).toBe('created_at');
  });

  it('`gantt` → `object-gantt` (ObjectGantt)', async () => {
    // ⚠️ `titleField` is not decoration here: unlike the four blocks this
    // package keeps a local `.partial()` dialect for, `gantt` flows into the
    // mirror straight from `SpecListViewSchema.shape`, so the protocol's own
    // three required bindings are required on the declared face too. Measured
    // by tsc while this file was written — the fixture without it does not
    // compile, which is the narrowing being declared rather than described.
    const node = await generatedNodeFor({
      label: 'Plan',
      type: 'gantt',
      gantt: { startDateField: 'start_at', endDateField: 'end_at', titleField: 'subject' },
    });
    expect(node.type).toBe('object-gantt');
    expect(node.startDateField).toBe('start_at');
    expect(node.endDateField).toBe('end_at');
  });

  it('`map` → `object-map` (ObjectMap)', async () => {
    const node = await generatedNodeFor({ label: 'Where', type: 'map', map: { latitudeField: 'lat', longitudeField: 'lng' } });
    expect(node.type).toBe('object-map');
    expect(node.latitudeField).toBe('lat');
    expect(node.longitudeField).toBe('lng');
  });

  it('`chart` and `tree` are READ, on the ONE route objectui#5321 leaves open to a named view', async () => {
    // ⚠️ Neither kind is a member of `NamedListView['type']`, so a named view
    // cannot select the branch itself. It reaches it by declaring no `type`
    // while a host `views` entry selects one — and the CONFIG still comes off
    // the named view, which is what makes the declaration meaningful. This is
    // the reachability reading reported on objectui#8980; ⛔ not a reason to
    // drop either member from the type.
    // ⚠️ MEASURED WHILE WRITING THIS FILE, and reported on objectui#8980: the
    // protocol's chart config is the ADR-0021 DATASET-BOUND shape alone
    // (`dataset` + `values`, required). The renderer still carries a legacy
    // inline-aggregate branch below it (`xAxisField` / `valueField` /
    // `aggregation`), and the declared face cannot express that branch — tsc
    // refuses the fixture. That is the protocol narrowing a legacy escape
    // hatch, ⛔ not a defect in this declaration, and ⛔ not licence to widen
    // the type locally: the legacy shape still reaches the branch through the
    // untyped `options.chart` bag.
    const chartNode = await generatedNodeFor(
      { label: 'Agg', chart: { dataset: 'deals_by_stage', dimensions: ['stage'], values: ['amount'], chartType: 'line' } },
      [{ id: 'c', label: 'Agg', type: 'chart' }],
    );
    expect(chartNode.type).toBe('object-chart');
    expect(chartNode.chartType).toBe('line');
    expect(chartNode.dataset).toBe('deals_by_stage');
    expect(chartNode.xAxisKey).toBe('stage');

    const treeNode = await generatedNodeFor(
      { label: 'Tree', tree: { parentField: 'parent_id' } },
      [{ id: 't', label: 'Tree', type: 'tree' }],
    );
    expect(treeNode.type).toBe('object-tree');
    expect(treeNode.parentField).toBe('parent_id');
  });
});

describe('objectui#8980 — the legacy `options.<kind>` nesting keeps working, and the canonical block wins key-by-key', () => {
  it('CONTROL: the legacy nesting alone still resolves the lane — untouched by this card', async () => {
    // The firing control for every canonical case above: the same query through
    // the path that already worked. Without it, a canonical case passing would
    // not tell us the merge left the legacy route intact.
    const node = await generatedNodeFor({ label: 'Board', type: 'kanban', options: { kanban: { groupByField: 'legacy_lane' } } } as any);
    expect(node.groupBy).toBe('legacy_lane');
  });

  it('the canonical block WINS for a key both spell', async () => {
    const node = await generatedNodeFor({
      label: 'Board',
      type: 'kanban',
      kanban: { groupByField: 'canonical_lane' },
      options: { kanban: { groupByField: 'legacy_lane' } },
    } as any);
    expect(node.groupBy).toBe('canonical_lane');
    expect(node.groupBy).not.toBe('legacy_lane');
  });

  it('a key the canonical block does NOT restate survives from the legacy nesting — the merge is per-key, not wholesale', async () => {
    // The arm that tells a MERGE apart from a REPLACE. A wholesale swap would
    // blank `titleField` here, silently, on every stored view that mixes the two
    // spellings — which is exactly the population this change has to protect.
    const node = await generatedNodeFor({
      label: 'Board',
      type: 'kanban',
      kanban: { groupByField: 'canonical_lane' },
      options: { kanban: { titleField: 'subject' } },
    } as any);
    expect(node.groupBy).toBe('canonical_lane');
    expect(node.titleField).toBe('subject');
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * Route 2 — the authored grid path
 * ────────────────────────────────────────────────────────────────────────── */

describe('objectui#8980 — `grouping` and `rowColor` reach ObjectGrid from a named view', () => {
  const GROUPING = { fields: [{ field: 'owner' }] };
  const ROW_COLOR = { field: 'stage', colors: { won: '#16a34a' } };

  it('THE FIX: both keys arrive on the `object-grid` schema', async () => {
    const grid = await gridSchemaFor({ label: 'All', type: 'grid', grouping: GROUPING, rowColor: ROW_COLOR } as any);
    expect(grid.type).toBe('object-grid');
    expect(grid.grouping).toEqual(GROUPING);
    expect(grid.rowColor).toEqual(ROW_COLOR);
  });

  it('ABSENCE CONTROL: a named view that declares neither leaves both undefined — the value before this card, for every document', async () => {
    const grid = await gridSchemaFor({ label: 'All', type: 'grid' });
    expect(grid.grouping).toBeUndefined();
    expect(grid.rowColor).toBeUndefined();
    // …and the rest of the grid schema is still assembled, so the absence above
    // is a reading of these two keys and not of a renderer that never ran.
    expect(grid.objectName).toBe('task');
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * Route 3 — the host delegation, whose sink is `ListView`
 * ────────────────────────────────────────────────────────────────────────── */

describe('objectui#8980 — the host delegation relays the named view\'s protocol keys', () => {
  const VIEW: NamedListView = {
    label: 'All',
    type: 'grid',
    data: { provider: 'api' } as any,
    fieldOrder: ['name', 'stage'],
    grouping: { fields: [{ field: 'owner' }] } as any,
    rowColor: { field: 'stage' } as any,
    userActions: { group: true } as any,
    appearance: { showDescription: false } as any,
  };

  it('THE FIX: all six reach the `list-view` schema the host receives', () => {
    const s = delegatedSchemaFor(VIEW);
    expect(s.type).toBe('list-view');
    expect(s.data).toEqual({ provider: 'api' });
    expect(s.fieldOrder).toEqual(['name', 'stage']);
    expect(s.grouping).toEqual({ fields: [{ field: 'owner' }] });
    expect(s.rowColor).toEqual({ field: 'stage' });
    expect(s.appearance).toEqual({ showDescription: false });
    expect(s.userActions.group).toBe(true);
  });

  it('`userActions` MERGES rather than replaces — a named view toggling one action does not blank the node\'s others', () => {
    // Spread, not `??`. This slot is a merge of toggle sets: the node's legacy
    // `show*` flags fold into it through `normalizeListViewSchema`, and a named
    // view that sets `group` must not delete the `search: false` the node set.
    const s = delegatedSchemaFor(VIEW, { showSearch: false });
    expect(s.userActions.group).toBe(true);
    expect(s.userActions.search).toBe(false);
  });

  it('ABSENCE CONTROL: with none of the six declared, every slot reads undefined and the relay still runs', () => {
    const s = delegatedSchemaFor({ label: 'All', type: 'grid', columns: ['name'] });
    expect(s.fieldOrder).toBeUndefined();
    expect(s.appearance).toBeUndefined();
    expect(s.grouping).toBeUndefined();
    expect(s.rowColor).toBeUndefined();
    // The firing control on the same object: a rung this card did not touch.
    expect(s.columns).toEqual(['name']);
  });

  it('`data` is relayed WITHOUT the `as any` cast on the named-view config — objectui#7928\'s open half', () => {
    // The cast is gone from the source; this is the behavioural half of the
    // same fact. The source half is pinned in the types census
    // (`object-view-unmirrored-keys-7779.test.ts`).
    const s = delegatedSchemaFor({ label: 'All', type: 'grid', data: { provider: 'api' } as any });
    expect(s.data).toEqual({ provider: 'api' });
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * `name` — the tab strip's display fallback
 * ────────────────────────────────────────────────────────────────────────── */

describe('objectui#8980 — `name` is read on the named-view tab strip', () => {
  const twoViews = (v1: NamedListView) => ({ ...NODE, listViews: { v1, v2: { label: 'Other', type: 'grid' } } } as unknown as ObjectViewSchema);

  it('THE FIX: a view declaring `name` and no `label` shows the NAME, not the record key', async () => {
    resetSinks();
    const { findByText } = render(<ObjectView schema={twoViews({ name: 'my_deals', type: 'grid' } as any)} dataSource={dataSource()} />);
    expect(await findByText('my_deals')).toBeTruthy();
  });

  it('PRECEDENCE CONTROL: `label` still wins over `name` — the existing rung is untouched', async () => {
    resetSinks();
    const { findByText, queryByText } = render(
      <ObjectView schema={twoViews({ label: 'My Deals', name: 'my_deals', type: 'grid' } as any)} dataSource={dataSource()} />,
    );
    expect(await findByText('My Deals')).toBeTruthy();
    expect(queryByText('my_deals')).toBeNull();
  });

  it('KEY CONTROL: with neither, the record key is still the label — the value before this card', async () => {
    resetSinks();
    const { findByText } = render(<ObjectView schema={twoViews({ type: 'grid' } as any)} dataSource={dataSource()} />);
    expect(await findByText('v1')).toBeTruthy();
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * The REPORTED members — ruling item 2's "no behaviour to attach" clause
 * ────────────────────────────────────────────────────────────────────────── */

describe('objectui#8980 — `tabs` and `pageName` are declared and NOT read here, which is the ruled outcome', () => {
  it('neither reaches the host delegation, and the control on the same object fires', () => {
    // ⭐ The measurement the ruling requires to be REPORTED rather than silently
    // absorbed. `tabs` on the list shape is the `ViewTabSchema[]` multi-tab
    // definition list (⛔ NOT `userFilters.tabs`, which `ObjectUserFiltersSchema`
    // omits as page-only); objectui's tab bar for an object is the HOST-owned
    // saved-view switcher (ADR-0053), so nothing on this surface reads it.
    // `pageName` configures the protocol's `type: 'page'` branch, and `page` is
    // not a member of `NamedListView['type']`, so no authored named view can
    // select it.
    //
    // ⛔ Do NOT "fix" this by relaying the keys: a rung with no reader behind it
    // is objectui#7924's defect pointed the other way. Either the reader lands
    // on its own card, or the protocol card the report feeds decides otherwise.
    const s = delegatedSchemaFor({
      label: 'All',
      type: 'grid',
      columns: ['name'],
      tabs: [{ name: 'open' }] as any,
      pageName: 'deals_page' as any,
    });
    expect(s.tabs).toBeUndefined();
    expect(s.pageName).toBeUndefined();
    // The firing control: a key declared on the SAME fixture that the same relay
    // does carry. Without it these two `undefined`s are an unrun probe.
    expect(s.columns).toEqual(['name']);
  });
});
