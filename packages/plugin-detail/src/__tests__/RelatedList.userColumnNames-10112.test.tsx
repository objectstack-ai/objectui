/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10112 — a `user` column in a related list draws the referenced
 * person's display name, the way every ordinary list already does.
 *
 * The field is not off-spec and the data is not broken: `user` is a
 * reference-bearing type fixed to `sys_user`, and it is a member of
 * `@object-ui/core`'s `EXPANDABLE_FIELD_TYPES`. What diverged was this one
 * renderer. It asked for no `$expand` at all, so every reference column
 * arrived as its stored key; `lookup` / `master_detail` were caught by this
 * file's batch label fallback, whose predicate named only those two, and
 * `UserCellRenderer` has no resolver of its own — so the stored id was drawn
 * where the standalone list of the same object draws a name.
 *
 * ## What each case is for
 *
 *  - The auto-fetch case is the reported defect: the list fetches its own
 *    rows, so the repair is the `$expand` an ordinary list already sends.
 *  - The caller-data case is the other supported input — a parent that hands
 *    `data` down. No query of this list's is involved, so only the batch
 *    fallback can resolve it, and that is the half whose predicate widened.
 *  - The CONTROL renders the same column, same fixture, with resolution made
 *    impossible (the referenced record cannot be fetched). It must show the
 *    raw id. Without it, `not.toContain(THE STORED ID)` above is unfalsifiable
 *    prose: an assertion that the id is absent proves nothing until the same
 *    column has been seen printing it.
 *  - The identity pins spy on the `has` of the object `@object-ui/core`
 *    exports. A member-identical private copy of the family leaves the spy
 *    empty and fails here, where a membership check would pass ON the defect
 *    — the shape objectui#5874 / #5692 / #4815 use in this package already.
 *
 * ## Ablation direction, predicted before running
 *
 * Remove the `$expand` line from the auto-fetch and the auto-fetch case goes
 * RED printing the stored id, while the caller-data case stays GREEN (it never
 * reached that line). Restore the private `lookup`/`master_detail` disjunction
 * in the batch loop and the caller-data case goes RED while the auto-fetch
 * case stays GREEN. Two independent halves, so neither repair can be read as
 * covering for the other; the control stays red-proof in both directions,
 * which is what makes it a control rather than a third copy of the pin.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import * as React from 'react';
import { EXPANDABLE_FIELD_TYPES } from '@object-ui/core';
import { RelatedList } from '../RelatedList';

/**
 * Desktop, pinned rather than inherited (objectui#8399): below the 768
 * breakpoint `RelatedList` renders a gallery with no cells at all, and cells
 * are what this file reads.
 */
beforeAll(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
});

// Capture the schema RelatedList hands to SchemaRenderer (the data-table), so
// a single column's cell can be rendered on its own — the whole table is not
// what is under test, one cell's text is.
const h = vi.hoisted(() => ({ schema: null as any }));
vi.mock('@object-ui/react', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    SchemaRenderer: (props: any) => {
      h.schema = props.schema;
      return null;
    },
  };
});

/** The card's own observed value: a 32-character opaque `sys_user` id. */
const OWNER_ID = 'lDPJgIdeRsnAguu8xj9vgeUzXSjsmxGd';
const OWNER_NAME = 'Dev Admin';

const opportunitySchema = {
  name: 'demo_opportunity',
  // ADR-0085 prominence — the derivation the card's reproduction goes through,
  // so the Owner column exists for the same reason it exists in the report.
  highlightFields: ['name', 'owner_id'],
  fields: {
    name: { type: 'text', label: 'Name' },
    account_id: { type: 'lookup', label: 'Account', reference: 'demo_account' },
    owner_id: { type: 'user', label: 'Owner', reference: 'sys_user' },
  },
};

const userSchema = { name: 'sys_user', fields: { name: { type: 'text', label: 'Name' } } };

const storedRow = {
  id: 'opp_1',
  name: 'Northwind renewal',
  account_id: 'acc_1',
  owner_id: OWNER_ID,
};
const ownerRecord = { id: OWNER_ID, name: OWNER_NAME };

/**
 * A server that honours `$expand` and nothing else.
 *
 * A root the query NAMES comes back as the related record; every other
 * reference column stays the stored key. That asymmetry is the only behaviour
 * this double has, and it is the one the repair depends on — a double that
 * resolved regardless would pass on the defect.
 */
const makeDataSource = (opts: { resolvableUsers?: boolean } = {}) => {
  const { resolvableUsers = true } = opts;
  return {
    getObjectSchema: vi.fn(async (api: string) =>
      api === 'sys_user' ? userSchema : opportunitySchema,
    ),
    find: vi.fn(async (api: string, params: any) => {
      if (api === 'sys_user') {
        if (!resolvableUsers) throw new Error('sys_user is not readable here');
        const ids: string[] = params?.$filter?.id?.$in ?? [];
        return { data: [ownerRecord].filter((u) => ids.includes(u.id)) };
      }
      const expand: string[] = Array.isArray(params?.$expand) ? params.$expand : [];
      const row: Record<string, any> = { ...storedRow };
      if (expand.includes('owner_id')) row.owner_id = ownerRecord;
      if (expand.includes('account_id')) row.account_id = { id: 'acc_1', name: 'Northwind' };
      return { data: [row], total: 1 };
    }),
  };
};

const ownerColumn = () =>
  h.schema?.columns?.find((c: any) => c.accessorKey === 'owner_id');

/** The Owner value as it reached the table — expanded record or stored key. */
const ownerValue = () => (h.schema?.data ?? [])[0]?.owner_id;

/**
 * Render the Owner cell ONCE and return its text.
 *
 * Never called from inside a `waitFor`: that callback re-runs on DOM
 * mutations, so a rendering predicate feeds its own next run and leaks a
 * container per run (objectui#7756).
 */
const ownerCellText = (): string => {
  const col = ownerColumn();
  if (!col?.cell) return '';
  const { container, unmount } = render(<>{col.cell(ownerValue())}</>);
  const text = container.textContent ?? '';
  unmount();
  return text;
};

/** Side-effect free readiness signal: has the Owner value stopped being a key? */
const ownerResolved = (): boolean => typeof ownerValue() === 'object' && ownerValue() !== null;

/** Side-effect free readiness signal for the batch fallback's id -> name map. */
const batchNameLanded = (): boolean => {
  const el = ownerColumn()?.cell?.(OWNER_ID) as any;
  return typeof el?.props?.value === 'object' && el?.props?.value !== null;
};

const renderAutoFetch = (dataSource: any) =>
  render(
    <RelatedList
      title="Opportunities"
      type="table"
      api="demo_opportunity"
      objectName="demo_opportunity"
      referenceField="account_id"
      parentId="acc_1"
      dataSource={dataSource}
    />,
  );

const renderCallerData = (dataSource: any) =>
  render(
    <RelatedList
      title="Opportunities"
      type="table"
      api="demo_opportunity"
      objectName="demo_opportunity"
      referenceField="account_id"
      parentId="acc_1"
      data={[storedRow]}
      dataSource={dataSource}
    />,
  );

beforeEach(() => {
  h.schema = null;
});

afterEach(() => {
  // The identity pins spy on a Set exported by core — a shared module-level
  // object. A leaked spy would follow every later file in this worker.
  vi.restoreAllMocks();
});

describe('RelatedList user columns render names, not stored ids (objectui#10112)', () => {
  it('auto-fetch: asks the server to expand the user reference and draws the name', async () => {
    const dataSource = makeDataSource();
    renderAutoFetch(dataSource as any);

    await waitFor(() => expect(ownerResolved()).toBe(true));

    const text = ownerCellText();
    expect(text).toContain(OWNER_NAME);
    expect(text).not.toContain(OWNER_ID);
  });

  it('expands the visible relation and NOT the parent FK the list never draws', async () => {
    const dataSource = makeDataSource();
    renderAutoFetch(dataSource as any);

    await waitFor(() =>
      expect(dataSource.find).toHaveBeenCalledWith(
        'demo_opportunity',
        expect.objectContaining({ $expand: ['owner_id'] }),
      ),
    );

    // `account_id` is the parent relationship: `filterFK` removes it from every
    // column list this component draws, so expanding it could only buy a
    // sub-read nothing renders. `name` is not reference-bearing at all.
    const expands = dataSource.find.mock.calls
      .filter(([api]: any[]) => api === 'demo_opportunity')
      .map(([, params]: any[]) => params?.$expand)
      .filter(Boolean)
      .flat();
    expect(expands).not.toContain('account_id');
    expect(expands).not.toContain('name');
  });

  it('caller-supplied rows: the batch fallback resolves the user column too', async () => {
    const dataSource = makeDataSource();
    renderCallerData(dataSource as any);

    // No list query is sent on this path, so the name can only come from the
    // batch fallback — which skipped `user` entirely before this card.
    await waitFor(() =>
      expect(dataSource.find).toHaveBeenCalledWith('sys_user', expect.anything()),
    );
    await waitFor(() => expect(batchNameLanded()).toBe(true));

    const { container, unmount } = render(<>{ownerColumn()!.cell!(OWNER_ID)}</>);
    const text = container.textContent ?? '';
    unmount();
    expect(text).toContain(OWNER_NAME);
    expect(text).not.toContain(OWNER_ID);
  });

  it('CONTROL: the same column prints the stored id when nothing can resolve it', async () => {
    // Same fixture, same column, resolution made impossible. This is the
    // reading the two cases above assert the absence of — an absence is not
    // evidence until the presence has been seen on the same instrument.
    const dataSource = makeDataSource({ resolvableUsers: false });
    renderCallerData(dataSource as any);

    await waitFor(() =>
      expect(dataSource.find).toHaveBeenCalledWith('sys_user', expect.anything()),
    );
    await waitFor(() => expect(ownerColumn()).toBeTruthy());

    const { container, unmount } = render(<>{ownerColumn()!.cell!(OWNER_ID)}</>);
    const text = container.textContent ?? '';
    unmount();
    expect(text).toContain(OWNER_ID);
    expect(text).not.toContain(OWNER_NAME);
  });
});

describe('the reference family is core’s object, not a copy (objectui#10112)', () => {
  it('the `$expand` roots are decided by `@object-ui/core` EXPANDABLE_FIELD_TYPES', async () => {
    const spy = vi.spyOn(EXPANDABLE_FIELD_TYPES, 'has');
    const dataSource = makeDataSource();
    renderAutoFetch(dataSource as any);

    await waitFor(() => expect(ownerResolved()).toBe(true));
    // Recorded only if the projection consulted THAT object; a private
    // `new Set([...])` with the same members leaves this empty.
    expect(spy.mock.calls.map(([k]) => k)).toContain('user');
  });

  it('the batch fallback consults that same object, not a private disjunction', async () => {
    const dataSource = makeDataSource();
    renderCallerData(dataSource as any);

    await waitFor(() =>
      expect(dataSource.find).toHaveBeenCalledWith('sys_user', expect.anything()),
    );
    const spy = vi.spyOn(EXPANDABLE_FIELD_TYPES, 'has');
    // Re-render so the batch loop runs again with the spy installed: the
    // predicate under test is the one that decides which columns it gathers.
    renderCallerData(makeDataSource() as any);
    await waitFor(() => expect(spy.mock.calls.length).toBeGreaterThan(0));
    expect(spy.mock.calls.map(([k]) => k)).toContain('user');
  });
});
