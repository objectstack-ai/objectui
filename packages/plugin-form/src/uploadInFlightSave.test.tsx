/**
 * A record form may NOT be saved while an upload is still in flight
 * (objectui#10166).
 *
 * ## What is pinned here, and why it is a DIFFERENTIAL
 *
 * The defect is not an error — it is a success. A `file`/`image` value only
 * becomes its fileId once the presigned upload settles, so a Save pressed
 * during that window wrote the record WITHOUT the attachment and reported
 * success. Nothing threw, nothing warned, and the record looked saved.
 *
 * ⛔ A pin that asserts "no error" therefore passes on exactly the defect, and
 * so does one that asserts the mid-upload Save produced no attachment — that is
 * the defect's own behaviour. These rows compare the SAME save gesture at two
 * timings and assert the STORED VALUE at each:
 *
 *   - issued while the upload is pending → nothing is written at all;
 *   - issued after it resolves           → the record is written WITH the fileId.
 *
 * Each row asserts the stored value FIRST, before any affordance, so it fails
 * on the WRITE rather than on a missing label. And each closes on the invariant
 * no weakening can satisfy on the defect: exactly one record reached the
 * adapter across both gestures, and it carries the file the user picked.
 *
 * ## What is real here and what is faked
 *
 * Only the upload TRANSPORT is faked. The stub widget drives the real
 * `useUploadingSignal` from `@object-ui/fields`, so the signal path under test
 * is the shipping one: `useUploadingSignal` → `UploadingScope` →
 * the host's gate. Faking the transport is what makes the mid-upload window
 * deterministic; `ActionParamDialog.uploading.test.tsx` fakes it the same way
 * for the one host that already had a gate.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { ComponentRegistry } from '@object-ui/core';
import { registerAllFields, useUploadingSignal } from '@object-ui/fields';
import { ObjectForm } from './ObjectForm';
import { ModalForm } from './ModalForm';

registerAllFields();

/**
 * Stands in for `FileField` — a control whose value is only usable once the
 * upload settles. It publishes through the REAL hook, so nothing about the
 * signal path is simulated.
 */
function FakeUploadWidget({ onChange }: { onChange?: (v: unknown) => void }) {
  const [uploading, setUploading] = React.useState(false);
  useUploadingSignal(uploading);
  return (
    <div>
      <button type="button" data-testid="start-upload" onClick={() => setUploading(true)}>
        start
      </button>
      <button
        type="button"
        data-testid="finish-upload"
        onClick={() => {
          onChange?.('file_123');
          setUploading(false);
        }}
      >
        finish
      </button>
    </div>
  );
}

beforeAll(() => {
  ComponentRegistry.register('file', FakeUploadWidget as any, { namespace: 'field' });
});
afterAll(() => {
  // Put the real lazy entry back: the registry is shared by every test in this
  // worker, and a leaked stub would shadow `field:file` for all of them.
  registerAllFields();
});

const objectSchema = {
  name: 'o',
  fields: {
    name: { type: 'text', label: 'Name' },
    attachment: { type: 'file', label: 'Attachment' },
  },
};

function makeDataSource() {
  const created: Record<string, any>[] = [];
  return {
    created,
    ds: {
      getObjectSchema: vi.fn().mockResolvedValue(objectSchema),
      create: vi.fn(async (_o: string, data: Record<string, any>) => {
        created.push(data);
        return { id: 'r1', ...data };
      }),
      update: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn().mockResolvedValue([]),
    } as any,
  };
}

const UPLOADING_LABEL = 'Uploading…';
const REASON = 'Wait for the upload to finish before saving.';

/**
 * Let a submit that WAS accepted reach the adapter before asserting that none
 * was. The submit path is async (react-hook-form → the host's handler → the
 * adapter), so asserting straight after the click would pass on the defect too
 * — the write simply would not have landed yet. This is the flush, not a
 * timeout papering over a race: on the defect the record IS written and this
 * wait is what lets the row see it.
 */
async function settleSubmit() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 50));
  });
}

describe('record form — save while an upload is in flight (objectui#10166)', () => {
  it('stores nothing mid-upload and the attachment once it resolves (ObjectForm)', async () => {
    const { created, ds } = makeDataSource();
    render(
      <ObjectForm
        schema={{
          type: 'object-form',
          objectName: 'o',
          mode: 'create',
          fields: ['name', 'attachment'],
        } as any}
        dataSource={ds}
      />,
    );
    const save = () => screen.getByRole('button', { name: /Create|Uploading/ });
    await screen.findByTestId('start-upload');

    // ── Leg A: the SAME save gesture, issued while the upload is pending.
    // The STORED VALUE is asserted first and on its own, so this row fails on
    // the write and not merely on a missing affordance.
    fireEvent.click(screen.getByTestId('start-upload'));
    fireEvent.click(save());
    await settleSubmit();
    expect(created).toEqual([]);
    expect(ds.create).not.toHaveBeenCalled();

    // The affordance says WHY, in words — not merely "nothing happened".
    expect(screen.getByTestId('upload-in-flight-notice').textContent).toBe(REASON);
    expect(save().textContent).toContain(UPLOADING_LABEL);

    // ── Leg B: the same gesture after the upload resolves.
    fireEvent.click(screen.getByTestId('finish-upload'));
    await waitFor(() => expect(screen.queryByTestId('upload-in-flight-notice')).toBeNull());
    fireEvent.click(save());

    await waitFor(() => expect(ds.create).toHaveBeenCalledTimes(1));
    // The differential, as one statement: ONE record reached the adapter across
    // both gestures, and it carries the file the user picked. A mid-upload write
    // shows up here as a second, attachment-less row — which is the defect, and
    // which no weakening of the rows above can hide.
    expect(created).toHaveLength(1);
    expect(created[0].attachment).toBe('file_123');
    expect(created.every((r) => r.attachment === 'file_123')).toBe(true);
  });

  it('disables Save and names the reason while uploading (ModalForm footer)', async () => {
    const { created, ds } = makeDataSource();
    render(
      <ModalForm
        schema={{
          type: 'object-modal-form',
          objectName: 'o',
          mode: 'create',
          open: true,
          fields: ['name', 'attachment'],
        } as any}
        dataSource={ds}
      />,
    );
    await screen.findByTestId('start-upload');
    const save = () => screen.getByRole('button', { name: /Create|Uploading/ });

    expect(save()).not.toBeDisabled();

    fireEvent.click(screen.getByTestId('start-upload'));
    // Again the stored value first: the save gesture mid-upload writes nothing.
    fireEvent.click(save());
    await settleSubmit();
    expect(created).toEqual([]);

    await waitFor(() => expect(save()).toBeDisabled());
    expect(screen.getByTestId('upload-in-flight-notice').textContent).toBe(REASON);
    expect(save().textContent).toContain(UPLOADING_LABEL);

    fireEvent.click(screen.getByTestId('finish-upload'));
    await waitFor(() => expect(save()).not.toBeDisabled());
    expect(screen.queryByTestId('upload-in-flight-notice')).toBeNull();
  });
});
