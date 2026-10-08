// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#11785 — on the Studio data page, a save the write guard holds shows
 * the author a sentence, not the guard's developer text.
 *
 * The card's measured case: add a field, switch its type to Picklist, and the
 * draft autosave is held because a choice field has no options. The strip used
 * to print the guard's message verbatim (a class name and tracker ids). It now
 * shows a sentence naming the field by its label, a "Show me" button that
 * opens that field, and the raw text inside a closed "Details" disclosure.
 *
 * The client is a real `MetadataClient`, so the door that runs the guard is the
 * production one; only the transport under it is a double, as in
 * `DataPillar.choiceWithoutOptions-11253.test.tsx`.
 */

import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MetadataClient } from '@object-ui/data-objectstack';

const objectDef = {
  name: 'showcase_task',
  label: 'Task',
  fields: [{ name: 'title', label: 'Title', type: 'text' }],
};

const puts: unknown[] = [];

const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
  if (init?.method === 'PUT') {
    puts.push(JSON.parse(String(init.body)));
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
  return new Response('null', { status: 404, headers: { 'content-type': 'application/json' } });
});

const client = new MetadataClient({ baseUrl: 'http://test.local', fetch: fetchImpl as unknown as typeof fetch });
Object.assign(client, {
  list: vi.fn(async () => [{ name: 'showcase_task', label: 'Task' }]),
  listDrafts: vi.fn(async () => []),
  layered: vi.fn(async () => ({ effective: objectDef, code: objectDef })),
  getDraft: vi.fn(async () => null),
});

vi.mock('../metadata-admin/useMetadata', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../metadata-admin/useMetadata')>();
  return { ...mod, useMetadataClient: () => client, useMetadataTypes: () => ({ entries: [] }) };
});

vi.mock('./packages-io', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./packages-io')>();
  return { ...mod, fetchPackages: vi.fn(async () => []) };
});

vi.mock('@object-ui/react', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@object-ui/react')>();
  return { ...mod, useAdapter: () => dataSource };
});

import { DataPillar } from './StudioDesignSurface';
import { createEmptyDataSource } from './__tests__/emptyDataSource';
import { registerBuiltinInspectors } from '../metadata-admin/inspectors';
import { t, tFormat } from '../metadata-admin/i18n';

const dataSource = createEmptyDataSource();
registerBuiltinInspectors();

afterEach(() => {
  cleanup();
  puts.length = 0;
  fetchImpl.mockClear();
});

/** The inspector control under a visible label. */
function controlUnder(label: string): HTMLElement {
  const lab = screen.getByText(label, { selector: 'label' });
  return lab.parentElement!.querySelector('input, [role="combobox"]') as HTMLElement;
}

describe('Studio data page — a held Picklist reads as a sentence (objectui#11785)', () => {
  it('names the field by its label, shows no developer text, and keeps the raw text under Details', async () => {
    render(
      <MemoryRouter initialEntries={['/studio/com.example.showcase/data']}>
        <DataPillar packageId="com.example.showcase" />
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Form' }));
    fireEvent.click(await screen.findByTitle(/^Add a field/));
    await screen.findByText('Type', { selector: 'label' }, { timeout: 4000 });
    const apiName = (controlUnder('API name') as HTMLInputElement).value;
    const label = (controlUnder('Label') as HTMLInputElement).value;
    expect(apiName, 'the new field has no API name: the harness is dead').not.toBe('');
    expect(label, 'the new field has no label: the harness is dead').not.toBe('');
    await userEvent.click(controlUnder('Type'));
    await userEvent.click(await screen.findByRole('option', { name: /· Picklist$/ }));

    // Past the autosave's 1.5 s debounce: the guard holds the save.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 2300));
    });
    expect(puts, 'the guard must hold this save').toEqual([]);

    const strip = await screen.findByTestId('studio-refusal');
    const message = within(strip).getByTestId('studio-refusal-message');
    expect(message).toHaveTextContent(
      tFormat('engine.studio.refusal.choiceWithoutOptions', 'en', { field: label }),
    );
    expect(message.textContent).not.toMatch(/MetadataClient|objectstack#|objectui#|`/);
    // The API name is the guard's word for the field; the author reads its label.
    expect(label).not.toBe(apiName);
    expect(message.textContent).not.toContain(apiName);

    // The raw text is still there, closed until the author asks for it.
    const details = within(strip).getByTestId('studio-refusal-detail') as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(within(details).getByText(t('engine.studio.refusal.details', 'en'))).toBeVisible();
    const raw = details.querySelector('pre')!;
    expect(raw).not.toBeVisible();
    expect(raw).toHaveTextContent(new RegExp(`\`${apiName}\` is a \`select\` with no options`));
    fireEvent.click(within(details).getByText(t('engine.studio.refusal.details', 'en')));
    expect(details.open).toBe(true);
  });

  it('"Show me" opens the named field\'s inspector after it was closed', async () => {
    render(
      <MemoryRouter initialEntries={['/studio/com.example.showcase/data']}>
        <DataPillar packageId="com.example.showcase" />
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Form' }));
    fireEvent.click(await screen.findByTitle(/^Add a field/));
    await screen.findByText('Type', { selector: 'label' }, { timeout: 4000 });
    const apiName = (controlUnder('API name') as HTMLInputElement).value;
    await userEvent.click(controlUnder('Type'));
    await userEvent.click(await screen.findByRole('option', { name: /· Picklist$/ }));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 2300));
    });
    const strip = await screen.findByTestId('studio-refusal');

    // The rail's own header close (the field inspector inside carries another).
    const railHeader = screen.getByText(t('engine.studio.data.fieldProps', 'en')).closest('header') as HTMLElement;
    fireEvent.click(within(railHeader).getByRole('button', { name: t('engine.studio.close', 'en') }));
    expect(screen.queryByText('API name', { selector: 'label' })).toBeNull();

    fireEvent.click(within(strip).getByRole('button', { name: t('engine.studio.refusal.show', 'en') }));
    expect(await screen.findByText('API name', { selector: 'label' })).toBeInTheDocument();
    expect((controlUnder('API name') as HTMLInputElement).value).toBe(apiName);
  });
});
