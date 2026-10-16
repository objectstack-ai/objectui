/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#12613 — a field's declared `widget` picks its READ cell key, so a
 * host face can name what an `object-ref` / `recipient-picker` value references
 * instead of printing the api name.
 *
 * The platform declares both hints on `sys_sharing_rule` (`object_name` is
 * `Field.text({ widget: 'object-ref' })`, `recipient_id` is
 * `Field.text({ widget: 'recipient-picker' })`), and before this change
 * `resolveCellRendererType` read `type` and `format` only: both columns drew
 * through the text cell under the text key, where no face could reach them.
 *
 * This package owns the rule, the two keys and their DEFAULT face (the stored
 * text, as `RECORD_POINTER_CARD_TYPE`'s default is), plus the reads and the kind
 * table its edit widgets list from, published for the host face. The faces that
 * name the value are `@object-ui/app-shell`'s, and are pinned there
 * (`WidgetRefCellFaces-12613.test.tsx`).
 */

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  getCellRenderer,
  listCellRendererTypes,
  loadObjectCatalog,
  loadRecipientCandidates,
  recipientCandidateLabel,
  resolveCellRendererType,
  RECIPIENT_RECORD_KINDS,
  RECIPIENT_REGISTRY_KINDS,
  FIELD_RECIPIENT_TYPE,
  TextCellRenderer,
} from '../index';

afterEach(() => cleanup());

describe('objectui#12613 — the declared widget picks the cell key', () => {
  it('promotes a textual field declaring `object-ref` / `recipient-picker` to that key, and nothing else', () => {
    expect(resolveCellRendererType({ type: 'text', widget: 'object-ref' })).toBe('object-ref');
    expect(resolveCellRendererType({ type: 'text', widget: 'recipient-picker' })).toBe('recipient-picker');
    // Controls: no widget, a widget with no read cell of its own, and a
    // non-textual base type keep the answer they had.
    expect(resolveCellRendererType({ type: 'text' })).toBe('text');
    expect(resolveCellRendererType({ type: 'textarea', widget: 'filter-condition' })).toBe('textarea');
    expect(resolveCellRendererType({ type: 'select', widget: 'object-ref' })).toBe('select');
    // The widget wins over a `format` hint on the same text field: it names
    // what the value IS, the hint only how plain text is drawn.
    expect(resolveCellRendererType({ type: 'text', format: 'url', widget: 'object-ref' })).toBe('object-ref');
  });

  it('registers both keys with the stored text as their default face', () => {
    const types = listCellRendererTypes();
    expect(types).toContain('object-ref');
    expect(types).toContain('recipient-picker');
    expect(getCellRenderer('object-ref')).toBe(TextCellRenderer);
    expect(getCellRenderer('recipient-picker')).toBe(TextCellRenderer);

    const Renderer = getCellRenderer(resolveCellRendererType({ type: 'text', widget: 'recipient-picker' }));
    render(
      <div data-testid="cell">
        <Renderer value="sales_manager" field={{ name: 'f', type: 'recipient-picker' } as any} dependentValues={{ recipient_type: 'position' }} />
      </div>,
    );
    expect(screen.getByTestId('cell')).toHaveTextContent('sales_manager');
  });
});

describe('objectui#12613 — the published reads are the edit widgets\' reads', () => {
  it('`loadObjectCatalog` lists through `getObjects`, then the `sys_metadata` fallback', async () => {
    const getObjects = vi.fn(async () => [{ name: 'crm_account', label: 'Account' }]);
    expect(await loadObjectCatalog({ getObjects } as any)).toEqual([{ name: 'crm_account', label: 'Account' }]);

    const find = vi.fn(async () => ({ data: [{ name: 'crm_contact', label: 'Contact' }, { label: 'nameless' }] }));
    expect(await loadObjectCatalog({ find } as any)).toEqual([{ name: 'crm_contact', label: 'Contact' }]);
    expect(find).toHaveBeenCalledWith('sys_metadata', { $filter: { type: 'object' }, $top: 1000 });
  });

  it("`loadRecipientCandidates` is the picker's one candidate query, and labels follow the kind's fields", async () => {
    const find = vi.fn(async () => ({ data: [{ id: 'team_eu', name: 'EU Sales' }] }));
    const rows = await loadRecipientCandidates({ find } as any, RECIPIENT_RECORD_KINDS.team);
    expect(find).toHaveBeenCalledWith('sys_team', { $top: 500, $orderby: { name: 'asc' } });
    expect(recipientCandidateLabel(RECIPIENT_RECORD_KINDS.team.labelFields, rows[0])).toBe('EU Sales');
    // No label field filled ⇒ the id, as the picker labels such a row.
    expect(recipientCandidateLabel(RECIPIENT_RECORD_KINDS.user.labelFields, { id: 'usr_9' })).toBe('usr_9');
    expect(RECIPIENT_REGISTRY_KINDS.position.type).toBe('position');
    expect(FIELD_RECIPIENT_TYPE).toBe('field');
  });
});
