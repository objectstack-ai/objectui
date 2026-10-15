/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The snapshot summary the decision panel draws (objectui#12483): which keys
 * of a record snapshot it draws, and that it draws them only against the
 * object's DECLARED fields. The same face on the real record page, over the
 * console's routed approvals source and objectstack's served page, is pinned
 * in the console's `approvalRequestsDataSource.servedPageSummary-12483.test.tsx`.
 */

import * as React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MetadataCtx } from '@object-ui/react';
import { RecordSnapshotSummary } from './RecordSnapshotSummary';
import { distinctLabels, planSnapshotSummary } from './snapshotSummaryPlan';

afterEach(cleanup);

const FIELDS: Record<string, Record<string, unknown>> = {
  owner_id: { type: 'lookup', reference: 'sys_user', label: 'Owner', system: true },
  name: { type: 'text', label: 'Name' },
  account: { type: 'lookup', reference: 'account', label: 'Account' },
  secret: { type: 'text', label: 'Secret', hidden: true },
  budget: { type: 'number', label: 'Budget' },
  fee: { type: 'currency', label: 'Fee' },
  amount: { type: 'currency', label: 'Amount' },
  note: { type: 'text', label: 'Note' },
};

describe('planSnapshotSummary (objectui#12483)', () => {
  it('reads the declared shape only: undeclared, hidden, bookkeeping, empty and unresolved-reference keys take no row', () => {
    const plan = planSnapshotSummary(
      {
        id: 'r1', owner_id: 'u_1', name: 'N', account: 'acc_1', secret: 's', budget: 5,
        legacy: 'x', note: '  ', amount: 10,
      },
      FIELDS,
      undefined,
    );
    expect(plan).toEqual({ lead: 'amount', rows: ['name', 'budget'] });
  });

  it('a reference the service resolved is a row', () => {
    expect(planSnapshotSummary({ account: 'acc_1' }, FIELDS, { account: 'Fabrikam' }).rows).toEqual(['account']);
  });

  it('the first non-zero declared currency leads, else the first declared currency; a name never does', () => {
    expect(planSnapshotSummary({ fee: 0, amount: 7 }, FIELDS, undefined).lead).toBe('amount');
    expect(planSnapshotSummary({ fee: 0, amount: 0 }, FIELDS, undefined)).toEqual({ lead: 'fee', rows: ['amount'] });
    // `budget` is a key the sheet's name guess matches, declared `number`.
    expect(planSnapshotSummary({ budget: 900 }, FIELDS, undefined)).toEqual({ lead: null, rows: ['budget'] });
  });

  it('a hidden field is dropped before the row cut, so the next one takes its slot', () => {
    const plan = planSnapshotSummary({ name: 'N', secret: 's', budget: 1, note: 'z' }, FIELDS, undefined, 2);
    expect(plan.rows).toEqual(['name', 'budget']);
  });
});

describe('distinctLabels (objectui#12483)', () => {
  it('qualifies only the shared labels, and every label when a qualified one still collides', () => {
    expect(distinctLabels([{ key: 'a', label: 'X' }, { key: 'b', label: 'X' }, { key: 'c', label: 'Y' }]))
      .toEqual(['X (a)', 'X (b)', 'Y']);
    expect(distinctLabels([{ key: 'a', label: 'X' }, { key: 'b', label: 'X' }, { key: 'c', label: 'X (a)' }]))
      .toEqual(['X (a)', 'X (b)', 'X (a) (c)']);
  });
});

function mount(defs: Record<string, unknown>, props: React.ComponentProps<typeof RecordSnapshotSummary>) {
  const metadata = { getItem: async (type: string, name: string) => (type === 'object' ? (defs[name] ?? null) : null) };
  return render(
    <MetadataCtx.Provider value={metadata as never}>
      <RecordSnapshotSummary {...props} />
    </MetadataCtx.Provider>,
  );
}

describe('RecordSnapshotSummary (objectui#12483)', () => {
  it('draws the lead and the rows under the declared labels once the definition answers', async () => {
    mount({ invoice: { name: 'invoice', fields: FIELDS } }, {
      objectName: 'invoice',
      snapshot: { name: 'INV-1', account: 'acc_1', amount: 0 },
      display: { account: 'Fabrikam' },
    });
    const summary = await screen.findByTestId('record-snapshot-summary');
    expect(summary.querySelector('[data-summary-lead]')?.getAttribute('data-summary-lead')).toBe('amount');
    const rows = [...summary.querySelectorAll('[data-summary-field]')].map((r) => r.textContent);
    expect(rows).toEqual(['NameINV-1', 'AccountFabrikam']);
  });

  it('CONTROL: draws nothing without the definition, without a snapshot, or for a definition of another object', async () => {
    const seen: string[] = [];
    const defs = { other: { name: 'other', fields: FIELDS } };
    const metadata = {
      getItem: async (_t: string, name: string) => {
        seen.push(name);
        return name === 'invoice' ? { name: 'other', fields: FIELDS } : null;
      },
    };
    render(
      <MetadataCtx.Provider value={metadata as never}>
        <RecordSnapshotSummary objectName="invoice" snapshot={{ name: 'INV-1' }} />
      </MetadataCtx.Provider>,
    );
    await waitFor(() => expect(seen).toContain('invoice'));
    expect(screen.queryByTestId('record-snapshot-summary')).toBeNull();
    cleanup();
    mount(defs, { objectName: 'other', snapshot: undefined });
    mount(defs, { objectName: 'missing', snapshot: { name: 'INV-1' } });
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByTestId('record-snapshot-summary')).toBeNull();
  });
});
