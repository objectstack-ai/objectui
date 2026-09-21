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
 * The last assertion in the first row is the one that cannot be satisfied by
 * the defect under any weakening: every record this form ever stored carries
 * the attachment.
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
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    fireEvent.click(screen.getByTestId('start-upload'));
    await screen.findByTestId('upload-in-flight-notice');
    fireEvent.click(save());
    // The stored value is the assertion: nothing was written. On the defect the
    // record was written here, without the attachment, and reported success.
    await waitFor(() => expect(screen.getByTestId('upload-in-flight-notice')).toBeTruthy());
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
    expect(created).toHaveLength(1);
    expect(created[0].attachment).toBe('file_123');
    // The invariant behind both legs, stated so no weakening of the rows above
    // can leave the defect green: this form never stored a record without the
    // attachment the user had picked.
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
    await waitFor(() => expect(save()).toBeDisabled());
    expect(screen.getByTestId('upload-in-flight-notice').textContent).toBe(REASON);
    expect(save().textContent).toContain(UPLOADING_LABEL);

    // A click on the disabled control writes nothing.
    fireEvent.click(save());
    expect(created).toEqual([]);

    fireEvent.click(screen.getByTestId('finish-upload'));
    await waitFor(() => expect(save()).not.toBeDisabled());
    expect(screen.queryByTestId('upload-in-flight-notice')).toBeNull();
  });
});
