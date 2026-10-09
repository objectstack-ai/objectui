/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The approval decision panel (objectui#12045, B1 of objectui#2763): how it
 * composes A3's progress with the request's declared decision actions over the
 * bound record, and that this round registers it as no type (claim amendment 3,
 * `6081385696`: the registration lands with its zod arm, derived from the v18
 * spec row, in the page-mount step).
 *
 * The bar is doubled to a probe that records the props it was handed: what is
 * under test here is the panel's wiring (which object, which record, which
 * location, what happens after a decision). The real bar, its dialog and the
 * POST it sends are pinned over the real record page in the console's
 * `approvalRequestsDataSource.decisionPage.test.tsx`.
 */

import * as React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const barProps: Array<Record<string, unknown>> = [];
vi.mock('../DeclaredActionsBar.js', () => ({
  DeclaredActionsBar: (props: Record<string, unknown>) => {
    barProps.push(props);
    return <div data-testid="declared-actions-probe" />;
  },
}));

import { ComponentRegistry } from '@object-ui/core';
import { RecordContextProvider, subscribeDataChanges, type DataChange } from '@object-ui/react';
import { ApprovalDecisionRenderer } from './ApprovalDecisionPanel';

afterEach(() => {
  cleanup();
  barProps.length = 0;
});

const REQUEST = {
  id: 'req_12045',
  process_name: 'invoice_approval',
  object_name: 'invoice',
  record_id: 'inv_1',
  status: 'pending',
  pending_approvers: ['u1', 'u2', 'u3'],
  viewer: { can_act: true, is_submitter: false, can_override: false },
  decision_progress: { behavior: 'quorum', got: 1, need: 2 },
};

function mountOn(objectName: string, data: Record<string, unknown> | undefined) {
  return render(
    <RecordContextProvider objectName={objectName} recordId={(data?.id as string) ?? null} data={data}>
      <ApprovalDecisionRenderer />
    </RecordContextProvider>,
  );
}

describe('the approval decision panel (objectui#12045)', () => {
  it('is module-internal this round: loading it registers no component type', () => {
    expect(ComponentRegistry.has('record:approval_decision')).toBe(false);
    expect(ComponentRegistry.has('approval_decision')).toBe(false);
  });

  it("draws the request's tally and runs its declared actions at record_section against the request row", () => {
    mountOn('sys_approval_request', REQUEST);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('1');
    expect(bar.getAttribute('aria-valuemax')).toBe('2');
    expect(barProps).not.toHaveLength(0);
    const props = barProps[barProps.length - 1];
    expect(props.objectName).toBe('sys_approval_request');
    expect(props.location).toBe('record_section');
    expect(props.record).toMatchObject({ id: 'req_12045', viewer: REQUEST.viewer });
    expect(props.exclude, 'nothing is excluded: no other part of this page offers a decision').toBeUndefined();
  });

  it('draws no tally for a node that carries none, and still offers the actions', () => {
    mountOn('sys_approval_request', { ...REQUEST, decision_progress: undefined });
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByTestId('declared-actions-probe')).toBeTruthy();
  });

  it('after a decision, the request record and the timeline are invalidated, not remounted', () => {
    mountOn('sys_approval_request', REQUEST);
    const changes: DataChange[] = [];
    const unsubscribe = subscribeDataChanges((change) => changes.push(change));
    try {
      (barProps[barProps.length - 1].onDone as () => void)();
    } finally {
      unsubscribe();
    }
    expect(changes).toEqual([
      { objectName: 'sys_approval_request', recordId: 'req_12045' },
      { objectName: 'sys_approval_action' },
    ]);
  });

  it.each([
    ['another object', 'invoice', { id: 'inv_1' }],
    ['a request page whose record has not loaded', 'sys_approval_request', undefined],
  ])('renders nothing on %s', (_case, objectName, data) => {
    const { container } = mountOn(objectName, data);
    expect(container.innerHTML).toBe('');
    expect(barProps).toHaveLength(0);
  });
});
