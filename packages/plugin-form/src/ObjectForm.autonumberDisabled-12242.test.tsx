/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#12242 — `ObjectForm` disables an auto-number field spelled the way
 * `@objectstack/spec`'s `FieldType` spells it: `autonumber`.
 *
 * The object-field builder disables the computed types (`formula`, `summary`,
 * and the auto-number) so the form never asks a person for a value the backend
 * mints. Its auto-number arm compared against `auto_number`, which is the
 * form's WIDGET key (`field:auto_number`) and never a field type: the spec
 * refuses it at `type`. So an auto-number field on a real object, which can
 * only carry `autonumber`, was drawn enabled. Declared `required`, it was also
 * required on a create form, where the number does not exist yet.
 *
 * Every row mounts the real `ObjectForm` over a data source that serves the
 * object, with the real field registry.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { FieldSchema } from '@objectstack/spec/data';

import { ObjectForm } from './ObjectForm';
import { registerAllFields } from '@object-ui/fields';

registerAllFields();

const SEQ = { type: 'autonumber', label: 'Ticket No', required: true, format: 'TKT-{0000}' } as const;

const ticketSchema = {
  name: 'ticket',
  fields: {
    title: { type: 'text', label: 'Title' },
    seq: SEQ,
  },
};

const makeDS = () => ({
  getObjectSchema: vi.fn().mockResolvedValue(ticketSchema),
  create: vi.fn(async (_o: string, d: Record<string, unknown>) => ({ id: 'r1', ...d })),
  update: vi.fn(),
  findOne: vi.fn(),
});

const waitInput = (c: HTMLElement, name: string) =>
  waitFor(() => {
    const el = c.querySelector(`input[name="${name}"]`) as HTMLInputElement | null;
    if (!el) throw new Error(`${name} not ready`);
    return el;
  });

describe('ObjectForm disables a spec-spelled `autonumber` field (objectui#12242)', () => {
  it('CONTROL — the field under test is a spec-valid field def, and `auto_number` is not', () => {
    expect(FieldSchema.safeParse({ name: 'seq', ...SEQ }).success).toBe(true);
    expect(FieldSchema.safeParse({ name: 'seq', ...SEQ, type: 'auto_number' }).success).toBe(false);
  });

  it('a create form with a required `autonumber` field submits once the person fills what they can', async () => {
    const ds = makeDS();
    const { container } = render(
      <ObjectForm
        schema={{ type: 'object-form', objectName: 'ticket', mode: 'create' } as any}
        dataSource={ds as any}
      />,
    );
    fireEvent.change(await waitInput(container, 'title'), { target: { value: 'Printer on fire' } });
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    await waitFor(() => expect(ds.create).toHaveBeenCalledTimes(1));
    const payload = ds.create.mock.calls[0][1];
    expect(payload.title).toBe('Printer on fire');
    // The backend mints the number: the form sends none.
    expect(payload.seq).toBeUndefined();
  });
});
