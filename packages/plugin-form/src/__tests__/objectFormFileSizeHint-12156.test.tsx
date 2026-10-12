/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#12156 — the flat `ObjectForm`'s file-size hint reads the spec's
 * `maxSize`, the one spelling.
 *
 * The form builds a `file` / `image` field's description from the object
 * schema and appends "Max size: …" when the field declares a limit. It read the
 * snake_case `max_size` until this card: a spelling the spec's `FieldSchema`
 * refuses by name, so metadata the server serves never carried it and the hint
 * never showed, while a field declaring the spec's `maxSize` got none. The
 * object schema is untyped at that read, so a misspelt key compiles; this file
 * is what catches it.
 *
 * Pinned through the public `ObjectForm` entry with the real registered field
 * widgets:
 *
 *   1. a `file` and an `image` field declaring `maxSize` show the hint, and an
 *      authored description keeps its place before it;
 *   2. the retired `max_size` is not read: a field carrying only that spelling
 *      shows no hint (no dual read, AGENTS.md #0.1);
 *   3. CONTROL: a field declaring no limit shows no hint.
 */

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';
import { registerAllFields } from '@object-ui/fields';
import { ObjectForm } from '../ObjectForm';

registerAllFields();

const MB = 1024 * 1024;

const OBJECT_SCHEMA = {
  name: 'claim',
  fields: {
    contract: { type: 'file', label: 'Contract', maxSize: 10 * MB },
    photo: { type: 'image', label: 'Photo', description: 'Front view.', maxSize: 5 * MB },
    // The retired spelling: refused by the spec, read by nothing.
    legacy: { type: 'file', label: 'Legacy', max_size: 10 * MB },
    // CONTROL: no limit declared.
    open: { type: 'file', label: 'Open' },
  },
};

const makeDS = () =>
  ({
    getObjectSchema: vi.fn().mockResolvedValue(OBJECT_SCHEMA),
    create: vi.fn().mockResolvedValue({ id: 'c1' }),
    update: vi.fn().mockResolvedValue({ id: 'c1' }),
    findOne: vi.fn().mockResolvedValue({ id: 'c1' }),
    find: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  }) as any;

const fieldRow = (name: string) => document.body.querySelector<HTMLElement>(`[data-field="${name}"]`);

const renderForm = async () => {
  render(
    <ObjectForm schema={{ type: 'object-form', objectName: 'claim', mode: 'create' } as any} dataSource={makeDS()} />,
  );
  await waitFor(() => {
    for (const name of Object.keys(OBJECT_SCHEMA.fields)) {
      if (!fieldRow(name)) throw new Error(`${name} not rendered`);
    }
  });
};

afterEach(() => cleanup());

describe('ObjectForm (flat) — the file-size hint reads `maxSize` (objectui#12156)', () => {
  it('shows the hint on a file field declaring `maxSize`', async () => {
    await renderForm();
    expect(fieldRow('contract')!.textContent).toContain('Max size: 10.0 MB');
  });

  it('appends the hint after an authored description on an image field', async () => {
    await renderForm();
    expect(fieldRow('photo')!.textContent).toContain('Front view. (Max size: 5.0 MB)');
  });

  it('does not read the retired `max_size`: no hint', async () => {
    await renderForm();
    expect(fieldRow('legacy')!.textContent).not.toContain('Max size');
  });

  it('CONTROL: no limit declared, no hint', async () => {
    await renderForm();
    expect(fieldRow('open')!.textContent).not.toContain('Max size');
  });
});
