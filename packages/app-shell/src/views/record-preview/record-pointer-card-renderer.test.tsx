/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * A2's record card is the details grid's face for a `referenceVia` pointer
 * pair (objectui#12045, B1 of objectui#2763).
 *
 * The real details grid (`DetailSection` from `@object-ui/plugin-detail`)
 * resolves the pair; this package's registration draws it as
 * `RecordPreviewCard`, which reads the target through the console's adapter.
 * Pinned on `sys_approval_request.record_id` and on a non-approval pair,
 * `sys_activity.source_id`, whose sibling column is not called `object_name`.
 *
 * States are read from the card's `data-record-preview` attribute and the
 * target from the adapter's own call log, never from copy.
 */

import * as React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { AdapterCtx, MetadataCtx } from '@object-ui/react';
import { getCellRenderer, RECORD_POINTER_CARD_TYPE } from '@object-ui/fields';
import { DetailSection } from '@object-ui/plugin-detail';
import type { DetailViewSection } from '@object-ui/types';
import { RecordPointerCardRenderer } from './record-pointer-card-renderer';

afterEach(() => cleanup());

const DEFS: Record<string, unknown> = {
  invoice: {
    name: 'invoice',
    label: 'Invoice',
    nameField: 'subject',
    highlightFields: ['amount'],
    fields: { subject: { type: 'text', label: 'Subject' }, amount: { type: 'number', label: 'Amount' } },
  },
  sys_email: {
    name: 'sys_email',
    label: 'Email',
    nameField: 'subject',
    highlightFields: [],
    fields: { subject: { type: 'text', label: 'Subject' } },
  },
};

const RECORDS: Record<string, Record<string, unknown>> = {
  'invoice::inv_1': { id: 'inv_1', subject: 'Laptop refresh', amount: 4200 },
  'sys_email::em_7': { id: 'em_7', subject: 'Re: renewal terms' },
};

function mount(objectSchema: Record<string, unknown>, fields: string[], data: Record<string, unknown>) {
  const findOne = vi.fn(async (objectName: string, id: string) => RECORDS[`${objectName}::${id}`] ?? null);
  const metadata = {
    apps: [], objects: [], dashboards: [], reports: [], pages: [],
    loading: false, error: null,
    refresh: async () => {}, invalidate: () => {}, ensureType: async () => [],
    getItem: async (type: string, name: string) => (type === 'object' ? (DEFS[name] ?? null) : null),
    getItemsByType: () => [],
    getTypeStatus: () => 'ready' as const,
  };
  const utils = render(
    <MetadataCtx.Provider value={metadata as never}>
      <AdapterCtx.Provider value={{ findOne } as never}>
        <DetailSection
          section={{ title: 'Details', fields: fields.map((name) => ({ name, label: name })) } as DetailViewSection}
          data={data}
          objectSchema={objectSchema}
          objectName="probe_12045"
        />
      </AdapterCtx.Provider>
    </MetadataCtx.Provider>,
  );
  return { ...utils, findOne };
}

const cardState = (container: HTMLElement) =>
  container.querySelector('[data-record-preview]')?.getAttribute('data-record-preview');

describe('the record card is the pointer face (objectui#12045)', () => {
  it('is what the registry answers for the pointer key once this package is loaded', () => {
    expect(getCellRenderer(RECORD_POINTER_CARD_TYPE)).toBe(RecordPointerCardRenderer);
  });

  it('sys_approval_request.record_id draws the target invoice as a card', async () => {
    const { container, findOne } = mount(
      {
        fields: {
          object_name: { type: 'text', label: 'Object' },
          record_id: { type: 'text', label: 'Record', referenceVia: 'object_name' },
        },
      },
      ['record_id'],
      { object_name: 'invoice', record_id: 'inv_1' },
    );
    await waitFor(() => expect(cardState(container)).toBe('readable'));
    expect(findOne).toHaveBeenCalledTimes(1);
    expect(findOne.mock.calls[0].slice(0, 2)).toEqual(['invoice', 'inv_1']);
    expect(container.textContent).toContain('Laptop refresh');
  });

  it('a non-approval pair, sys_activity.source_id, draws the record its own sibling names', async () => {
    const { container, findOne } = mount(
      {
        fields: {
          source_object: { type: 'text', label: 'Source Object' },
          source_id: { type: 'text', label: 'Source ID', referenceVia: 'source_object' },
        },
      },
      ['source_id'],
      { source_object: 'sys_email', source_id: 'em_7', object_name: 'contact' },
    );
    await waitFor(() => expect(cardState(container)).toBe('readable'));
    expect(findOne.mock.calls.map((call) => call.slice(0, 2))).toEqual([['sys_email', 'em_7']]);
    expect(container.textContent).toContain('Re: renewal terms');
  });

  it('control: a plain text field with no referenceVia draws no card and reads nothing', async () => {
    const { container, findOne } = mount(
      { fields: { object_name: { type: 'text' }, record_id: { type: 'text', label: 'Record' } } },
      ['record_id'],
      { object_name: 'invoice', record_id: 'inv_1' },
    );
    expect(container.textContent).toContain('inv_1');
    expect(cardState(container)).toBeUndefined();
    expect(findOne).not.toHaveBeenCalled();
  });
});
