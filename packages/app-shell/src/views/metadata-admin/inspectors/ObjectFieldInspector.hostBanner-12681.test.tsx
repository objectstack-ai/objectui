// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#12681, read where the author reads it — the validation banner of
 * the metadata-admin object designer.
 *
 * The page is the real `MetadataResourceEditPage` with its registered object
 * canvas, field inspector and `object` resource config, so the banner comes
 * from the page's own live check (`validateMetadataDraft` in edit mode, over
 * the body `fromDraft` serialises). Only the client's reads and transport are
 * doubles. The object is the one the card's reproduction creates over REST.
 *
 * The banner is judged by the SUBJECT of each line — the issue location the
 * page renders before the message — not by the spec's wording: the defect is a
 * line located at the formula field itself (`… → est_total`), where the spec
 * reports an unrecognized key, beside the lint lines located at its
 * `expression`, which are the author's to see while the expression is
 * incomplete.
 */

import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MetadataClient } from '@object-ui/data-objectstack';

type Row = Record<string, unknown>;

const objectWith = (estTotal: Row): Row => ({
  name: 'qavrf_job',
  label: 'QA Job',
  sharingModel: 'private',
  fields: {
    name: { type: 'text', label: 'Name' },
    est_hours: { type: 'number', label: 'Est' },
    est_total: estTotal,
  },
});

const CLEAN = objectWith({
  type: 'formula',
  label: 'Est Total',
  expression: 'record.est_hours * 1.1',
  returnType: 'number',
});
const LEGACY = objectWith({ type: 'formula', label: 'Est Total', formula: 'record.est_hours * 1.1' });

let served: Row = CLEAN;

const OBJECT_ENTRY = {
  type: 'object',
  name: 'object',
  label: 'Object',
  allowEnvironmentOverlay: true,
  schema: { type: 'object', properties: { label: { type: 'string', title: 'Label' } } },
};

const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
  if (init?.method === 'PUT') {
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  return new Response('null', { status: 404, headers: { 'content-type': 'application/json' } });
});

const client = new MetadataClient({ baseUrl: 'http://test.local', fetch: fetchImpl as unknown as typeof fetch });
Object.assign(client, {
  list: vi.fn(async () => []),
  listDrafts: vi.fn(async () => []),
  get: vi.fn(async () => served),
  references: vi.fn(async () => []),
  layered: vi.fn(async () => ({ effective: served, code: served, editable: true })),
  getDraft: vi.fn(async () => null),
});

vi.mock('../useMetadata', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../useMetadata')>();
  return {
    ...mod,
    useMetadataClient: () => client,
    useMetadataTypes: () => ({ entries: [OBJECT_ENTRY] }),
  };
});

vi.stubGlobal(
  'fetch',
  vi.fn(async () => new Response('null', { status: 404, headers: { 'content-type': 'application/json' } })),
);

import { MetadataResourceEditPage } from '../ResourceEditPage';
// The load-time registrations and the built-in resource configs, exactly as the
// package entry runs them.
import '../register-builtins';
import '../../../services/builtinComponents.js';
// The built-in designers, registered at module scope so they exist before the
// first render (the package entry loads them from a dynamic chunk).
import { registerBuiltinDesigners } from '../register-builtin-designers';
registerBuiltinDesigners();

afterEach(() => {
  cleanup();
  fetchImpl.mockClear();
  served = CLEAN;
});

function renderDesigner(body: Row) {
  served = body;
  render(
    <MemoryRouter initialEntries={['/metadata/object/qavrf_job']}>
      <MetadataResourceEditPage type="object" name="qavrf_job" />
    </MemoryRouter>,
  );
}

/** Select `est_total` on the canvas and return its Formula (CEL) editor. */
async function openFormulaEditor(): Promise<HTMLTextAreaElement> {
  const card = (await screen.findAllByText('Est Total', {}, { timeout: 8000 }))
    .map((el) => el.closest('[role="button"]'))
    .find((el): el is HTMLElement => !!el);
  expect(card, 'the `est_total` field is on the canvas').toBeTruthy();
  fireEvent.click(card!);
  let editor: HTMLElement | null = null;
  await waitFor(
    () => {
      editor = document.getElementById('field-formula-est_total');
      expect(editor).toBeTruthy();
    },
    { timeout: 8000 },
  );
  return editor! as HTMLTextAreaElement;
}

/** The issue location of every line the validation banner shows (empty when there is no banner). */
function bannerLocations(): string[] {
  const banner = screen.queryByTestId('metadata-validation-banner');
  if (!banner) return [];
  return Array.from(banner.querySelectorAll('li > span')).map((s) => (s.textContent ?? '').trim());
}

/** A banner line located at the formula field itself — where the spec reports an unrecognized key. */
const AT_FIELD = /→ est_total$/;
/** A banner line located at the field's expression — the CEL lint. */
const AT_EXPRESSION = /→ est_total → expression$/;

describe('object designer banner — editing a clean formula field shows no retired-key line (objectui#12681)', () => {
  it("THE PIN: the card's keystrokes never put a line at the field itself on the banner", async () => {
    renderDesigner(CLEAN);
    const editor = await openFormulaEditor();
    expect(editor).toHaveValue('record.est_hours * 1.1');

    // ` +` leaves a dangling operator: the banner MUST come up for the lint at
    // `expression` — the positive reading that the page judged the edited draft.
    fireEvent.change(editor, { target: { value: 'record.est_hours * 1.1 ' } });
    fireEvent.change(editor, { target: { value: 'record.est_hours * 1.1 +' } });
    await waitFor(() => expect(bannerLocations().some((l) => AT_EXPRESSION.test(l))).toBe(true), {
      timeout: 4000,
    });
    expect(bannerLocations().filter((l) => AT_FIELD.test(l))).toEqual([]);

    // ` + 1` completes the expression: the banner goes away entirely, well
    // before the autosave could round-trip a fresh body into the draft.
    fireEvent.change(editor, { target: { value: 'record.est_hours * 1.1 + ' } });
    fireEvent.change(editor, { target: { value: 'record.est_hours * 1.1 + 1' } });
    await waitFor(() => expect(bannerLocations()).toEqual([]), { timeout: 1500 });
  });

  it('the legacy pointer stands on a stored `formula` key until the first edit, and that edit clears it', async () => {
    renderDesigner(LEGACY);
    // Before the edit: the banner carries the line at the field (the
    // objectui#6526 pointer rides on it).
    await waitFor(() => expect(bannerLocations().some((l) => AT_FIELD.test(l))).toBe(true), { timeout: 8000 });

    const editor = await openFormulaEditor();
    expect(editor).toHaveValue('record.est_hours * 1.1');
    fireEvent.change(editor, { target: { value: 'record.est_hours * 1.1 + 1' } });
    await waitFor(() => expect(bannerLocations()).toEqual([]), { timeout: 1500 });
  });
});
