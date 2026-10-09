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
 *
 * Off a request page the node draws a localized notice instead of nothing
 * (objectui#12072), so a block placed on the wrong page is visible to its
 * author. On a request page whose row has not loaded it still draws nothing.
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
import { I18nProvider } from '@object-ui/i18n';
import { builtInLocales } from '@object-ui/i18n/locales';
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

/** The notice's pack key, and what one pack says for it. */
const NOTICE_KEY = 'approvalsInbox.decisionPanelOffRequestPage';
const packNotice = (language: string): unknown =>
  NOTICE_KEY.split('.').reduce<unknown>(
    (node, part) => (node as Record<string, unknown> | undefined)?.[part],
    (builtInLocales as Record<string, unknown>)[language],
  );

const noticeText = () => screen.getByTestId('approval-decision-off-request-page').textContent;

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
    expect(screen.getByTestId('approval-decision-panel')).toBeTruthy();
    expect(screen.queryByTestId('approval-decision-off-request-page'), 'no notice on a request page').toBeNull();
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

  it('renders nothing on a request page whose record has not loaded', () => {
    const { container } = mountOn('sys_approval_request', undefined);
    expect(container.innerHTML).toBe('');
    expect(barProps).toHaveLength(0);
  });
});

describe('off an approval request page, a localized notice instead of nothing (objectui#12072)', () => {
  it.each([
    ["another object's record page", () => mountOn('invoice', { id: 'inv_1' })],
    ['a page with no record context', () => render(<ApprovalDecisionRenderer />)],
  ])('draws the notice on %s, and no panel', (_case, mount) => {
    mount();
    expect(noticeText()).toBe(packNotice('en'));
    expect(screen.queryByTestId('approval-decision-panel')).toBeNull();
    expect(barProps).toHaveLength(0);
  });

  it("keeps the node's className and designer attributes on the notice", () => {
    render(<ApprovalDecisionRenderer className="mt-4" data-obj-id="node_1" data-obj-type="record:approval_decision" />);
    const wrapper = screen.getByTestId('approval-decision-off-request-page').parentElement!;
    expect(wrapper.className).toBe('mt-4');
    expect(wrapper.getAttribute('data-obj-id')).toBe('node_1');
    expect(wrapper.getAttribute('data-obj-type')).toBe('record:approval_decision');
  });

  it('the notice copy is a key in all ten language packs', () => {
    const languages = Object.keys(builtInLocales);
    expect(languages).toHaveLength(10);
    for (const language of languages) {
      const value = packNotice(language);
      expect(typeof value, `${language} defines ${NOTICE_KEY}`).toBe('string');
      expect((value as string).trim(), `${language} defines ${NOTICE_KEY}`).not.toBe('');
    }
  });

  it('renders the active language: the zh pack value under a zh provider', () => {
    render(
      <I18nProvider config={{ defaultLanguage: 'zh', detectBrowserLanguage: false }} persistLanguage={false}>
        <RecordContextProvider objectName="invoice" recordId="inv_1" data={{ id: 'inv_1' }}>
          <ApprovalDecisionRenderer />
        </RecordContextProvider>
      </I18nProvider>,
    );
    expect(noticeText()).toBe(packNotice('zh'));
  });

  it('CONTROL: the en provider renders the en value, and the two packs differ', () => {
    render(
      <I18nProvider config={{ defaultLanguage: 'en', detectBrowserLanguage: false }} persistLanguage={false}>
        <RecordContextProvider objectName="invoice" recordId="inv_1" data={{ id: 'inv_1' }}>
          <ApprovalDecisionRenderer />
        </RecordContextProvider>
      </I18nProvider>,
    );
    expect(noticeText()).toBe(packNotice('en'));
    expect(packNotice('zh')).not.toBe(packNotice('en'));
  });
});
