/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#7353 — the widget node no longer carries `dataProvider`
 * (ADR-0049, remove arm; ruled on the card).
 *
 * ## What was retired
 *
 * Both dashboard surfaces turned a `provider: 'object'` widget into a node for
 * the table / pivot widgets and wrote the whole provider config onto it as
 * `dataProvider: widgetData`, beside `objectName: widgetData.object`. Nothing
 * read `dataProvider` — the widgets read `objectName` — so the key was a second
 * spelling of the same information that only the declarations kept alive
 * (`ObjectDataTableSchema.dataProvider` in `@object-ui/types`, and the
 * `schema.dataProvider` member of `ObjectPivotTableProps`). All three writes and
 * every declaration went in one change; no reader was added.
 *
 * ## Why the pin reads the NODE, not the screen
 *
 * An unread key changes nothing visible, so a screen assertion is green on both
 * sides. What the removal changes is the node each widget is HANDED — so this
 * file records every node that reaches `SchemaRenderer` (the real one renders
 * it; the recorder only listens) and asserts on those. The object-data-table
 * case also reads the `data-table` node `ObjectDataTable` renders onward,
 * because that widget spreads its own node into it: the key travelled one hop
 * further than any producer wrote it.
 *
 * ## Controls, and what they are for
 *
 *  - `objectName` is still written on every one of those nodes — the key the
 *    widgets read. Without it, "no `dataProvider`" would also be satisfied by a
 *    branch that stopped emitting the node's binding altogether.
 *  - The object-data-table widget still FETCHES through `objectName`: the
 *    adapter's `find` is called for that object. That is the behaviour the
 *    retired key was never part of, and it must not move.
 *
 * ## Direction, stated before the reverse verification
 *
 * RED on the unmodified tree: every "carries no `dataProvider`" assertion (the
 * producers wrote it). GREEN on both sides: every control. The type-level half
 * (neither widget prop type DECLARES the member any more) is enforced by
 * `tsconfig.test.json`, which this package's `type-check` chains.
 */

import * as React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';

/**
 * Every node handed to `SchemaRenderer`, in arrival order. Hoisted so the mock
 * factory below can close over it.
 */
const received = vi.hoisted(() => [] as Array<Record<string, unknown>>);

vi.mock('@object-ui/react', async () => {
  const actual: any = await vi.importActual('@object-ui/react');
  const RealSchemaRenderer = actual.SchemaRenderer;
  return {
    ...actual,
    // A listener, not a stub: the node is recorded and then rendered by the
    // REAL renderer, so the widgets below mount, fetch and render as they do in
    // production. Everything else is the real export by identity.
    SchemaRenderer: (props: any) => {
      if (props?.schema && typeof props.schema === 'object') received.push(props.schema);
      return <RealSchemaRenderer {...props} />;
    },
  };
});

import { SchemaRendererProvider } from '@object-ui/react';
import type { DashboardComponentSchema } from '@object-ui/types';
// Side-effect imports at MODULE scope (never inside a case or a hook) per
// AGENTS.md's flaky-test rule: `@object-ui/components` registers `data-table`,
// the package barrel registers `object-data-table` / `pivot`.
import '@object-ui/components';
import { DashboardRenderer, DashboardGridLayout } from '../index';
import type { ObjectPivotTableProps } from '../ObjectPivotTable';
import type { ObjectDataTableProps } from '../ObjectDataTable';

afterEach(() => {
  cleanup();
  received.length = 0;
});

const ROWS = [{ id: 'a1', name: 'Acme', region: 'EMEA', amount: 3 }];

function makeAdapter() {
  return {
    find: vi.fn(async (_objectName: string, _params?: unknown) => ({ data: ROWS })),
    getObjectSchema: vi.fn(async (_objectName: string) => ({
      name: 'account',
      fields: { name: { type: 'text', label: 'Name' }, region: { type: 'text' }, amount: { type: 'number' } },
    })),
  };
}

/** The live provider surface: `options.data = { provider: 'object', object }`. */
const OBJECT_PROVIDER = { provider: 'object', object: 'account' } as const;

const dash = (widgets: Record<string, unknown>[]): DashboardComponentSchema =>
  ({ type: 'dashboard', widgets }) as unknown as DashboardComponentSchema;

const nodesOfType = (type: string) => received.filter((n) => n.type === type);

describe('objectui#7353 — DashboardRenderer: the object-data-table node carries no dataProvider', () => {
  it('writes objectName, not dataProvider, and the widget still fetches through objectName', async () => {
    const adapter = makeAdapter();
    render(
      <SchemaRendererProvider dataSource={adapter as never}>
        <DashboardRenderer
          schema={dash([{ id: 'accounts', type: 'table', title: 'Accounts', options: { data: OBJECT_PROVIDER } }])}
          dataSource={adapter}
        />
      </SchemaRendererProvider>,
    );

    // Non-vacuity: the widget really mounted and fetched, and the table it
    // renders onward really arrived — otherwise every "absent" below would be
    // satisfied by a render that never happened.
    await waitFor(() => expect(nodesOfType('data-table').length).toBeGreaterThan(0));

    const widgetNodes = nodesOfType('object-data-table');
    expect(widgetNodes.length).toBeGreaterThan(0);
    for (const node of widgetNodes) {
      expect(node.objectName).toBe('account');
      expect(Object.keys(node)).not.toContain('dataProvider');
    }

    // The hop the key used to travel: ObjectDataTable spreads its node into
    // the `data-table` it renders.
    for (const node of nodesOfType('data-table')) {
      expect(Object.keys(node)).not.toContain('dataProvider');
    }

    // Control: the fetch is keyed on objectName, as before.
    expect(adapter.find).toHaveBeenCalled();
    expect(adapter.find.mock.calls.every(([objectName]) => objectName === 'account')).toBe(true);
  });
});

describe('objectui#7353 — DashboardGridLayout: the table and pivot nodes carry no dataProvider', () => {
  it.each([
    ['table', 'data-table', {}],
    ['pivot', 'pivot', { rowField: 'region', valueField: 'amount' }],
  ])('a provider-object %s widget becomes a %s node with objectName and no dataProvider', async (widgetType, nodeType, extra) => {
    const adapter = makeAdapter();
    render(
      <SchemaRendererProvider dataSource={adapter as never}>
        <DashboardGridLayout
          schema={dash([{ id: 'w1', type: widgetType, options: { ...extra, data: OBJECT_PROVIDER } }])}
        />
      </SchemaRendererProvider>,
    );

    await waitFor(() => expect(nodesOfType(nodeType).length).toBeGreaterThan(0));
    for (const node of nodesOfType(nodeType)) {
      // Control: the binding the producer writes beside it is still there.
      expect(node.objectName).toBe('account');
      expect(Object.keys(node)).not.toContain('dataProvider');
    }
  });
});

/*
 * The declaration half, on the published prop type (`ObjectPivotTable` is
 * exported from this package's index). `PivotTableSchema` extends `BaseSchema`,
 * which carries `[key: string]: any` — so an authored `dataProvider:` STILL
 * COMPILES after the member is gone, and a `@ts-expect-error` pin would not
 * stick. The pinnable effect is that `dataProvider` stops being a DECLARED
 * member: the probe extracts the literal key set (`string extends K` filters out
 * the index signature), the same probe
 * `packages/types/src/__tests__/dashboard-title-retired-declaration.test.ts` uses.
 */
type DeclaredKeys<T> = { [K in keyof T as string extends K ? never : K]: T[K] };
type PivotDeclared = keyof DeclaredKeys<ObjectPivotTableProps['schema']>;
/**
 * The consumer-side half of the `@object-ui/types` removal: this package reads
 * `ObjectDataTableSchema` through the BUILT `.d.ts` (its `tsconfig.test.json`
 * empties `paths`), so this line is red on a stale `dist` that still declares
 * the member and green only on a rebuilt one.
 */
type DataTableDeclared = keyof DeclaredKeys<ObjectDataTableProps['schema']>;

describe('objectui#7353 — the widget prop types no longer declare schema.dataProvider', () => {
  it('dataProvider is not a declared member; the two members grown beside it still are', () => {
    // Type-level, erased at runtime: if the member came back, this annotation
    // would collapse to `false` and `tsc -p tsconfig.test.json` would fail here.
    const dataProviderNotDeclared: 'dataProvider' extends PivotDeclared ? false : true = true;
    // Positive controls through the same extraction — a probe that saw no
    // members at all would also report `dataProvider` absent.
    const objectNameDeclared: 'objectName' extends PivotDeclared ? true : false = true;
    const filterDeclared: 'filter' extends PivotDeclared ? true : false = true;
    const rowFieldDeclared: 'rowField' extends PivotDeclared ? true : false = true;
    expect(dataProviderNotDeclared && objectNameDeclared && filterDeclared && rowFieldDeclared).toBe(true);
  });

  it('ObjectDataTableProps (anchored to ObjectDataTableSchema) no longer declares it either', () => {
    const dataProviderNotDeclared: 'dataProvider' extends DataTableDeclared ? false : true = true;
    const objectNameDeclared: 'objectName' extends DataTableDeclared ? true : false = true;
    const drillDownDeclared: 'drillDown' extends DataTableDeclared ? true : false = true;
    expect(dataProviderNotDeclared && objectNameDeclared && drillDownDeclared).toBe(true);
  });
});
