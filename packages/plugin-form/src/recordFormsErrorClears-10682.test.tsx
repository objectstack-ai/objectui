/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10682 — a failed read must not keep a record form on its error
 * screen after a later read of the same source succeeds (the objectui#10578
 * shape, applied per source).
 *
 * Every layout `ObjectForm` routes to (the default arm, `DrawerForm`,
 * `ModalForm`, `SplitForm`, `TabbedForm`, `WizardForm`) renders its error
 * screen ahead of the form whenever its load error is set. Each wrote that
 * error from two reads, the object schema (`getObjectSchema`) and the record
 * (`findOne`), and cleared it nowhere, so one failed read kept the form off
 * screen until a remount.
 *
 * What clears it, and which run may touch it:
 *
 *   - PER SOURCE. A read's failure is cleared when a later run of the SAME
 *     read commits. A record read that succeeds says nothing about the object
 *     schema: it can only run over the schema of an EARLIER object (the one
 *     already in state), so it must not clear a schema failure.
 *   - Only the CURRENT run of a read writes its failure at all. A run a newer
 *     one of the same read has superseded may neither clear the current
 *     failure nor raise its own over the current values.
 *   - A failed BACKGROUND re-read of the record does NOT keep the last good
 *     values on screen. No form has a silent mode, so the failure is reported
 *     like any other, and the next re-read that succeeds takes the screen
 *     back. The default arm's background re-read is the data-invalidation bus
 *     (objectui#10572). The five other layouts do not subscribe to the bus;
 *     theirs is a host re-render that rebuilds `initialValues`, which re-runs
 *     their record read in place.
 *
 * Rendered through the real `SchemaRenderer` and this package's own
 * registration (`object-form` is the one door all six are reached through).
 * Every `getObjectSchema` and `findOne` is held open by hand, so each
 * in-flight assertion is made while the read really is in flight. The error
 * screen is read through the message the adapter threw; its English heading
 * is not what this card is about.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup, waitFor } from '@testing-library/react';
import { SchemaRenderer, SchemaRendererProvider, notifyDataChanged } from '@object-ui/react';
// Registers `object-form` through this package's own entry.
import './index';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

type SchemaRead = Deferred<any> & { objectName: string };
type RecordRead = Deferred<any> & { objectName: string; recordId: string };

/** Every schema read and record read returns a promise the test settles by hand. */
function makeDeferredDataSource() {
  const schemaReads: SchemaRead[] = [];
  const recordReads: RecordRead[] = [];
  const dataSource = {
    getObjectSchema: vi.fn((objectName: string) => {
      const d = deferred<any>();
      schemaReads.push({ ...d, objectName });
      return d.promise;
    }),
    findOne: vi.fn((objectName: string, recordId: string) => {
      const d = deferred<any>();
      recordReads.push({ ...d, objectName, recordId });
      return d.promise;
    }),
    find: vi.fn(async () => ({ data: [], total: 0 })),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  return { dataSource, schemaReads, recordReads };
}

type DS = ReturnType<typeof makeDeferredDataSource>['dataSource'];

/** The `n`-th read (1-based) once it has been issued. */
async function nth<T>(reads: T[], n: number): Promise<T> {
  await waitFor(() => {
    if (reads.length < n) throw new Error(`read ${n} not issued yet (${reads.length} so far)`);
  });
  return reads[n - 1];
}

async function settle(fn: () => void) {
  await act(async () => {
    fn();
    await Promise.resolve();
  });
}

const answerSchema = (read: SchemaRead) =>
  settle(() => read.resolve({ name: read.objectName, fields: { name: { type: 'text', label: 'Name' } } }));
const answerRecord = (read: RecordRead, name: string) =>
  settle(() => read.resolve({ id: read.recordId, name }));
const fail = (read: Deferred<any>, message: string) => settle(() => read.reject(new Error(message)));

async function invalidate() {
  await act(async () => {
    notifyDataChanged({ objectName: '*' });
  });
}

/** The six layouts, each reached through `object-form`; `undefined` is the default arm. */
const FORMS: ReadonlyArray<{ form: string; formType: string | undefined }> = [
  { form: 'ObjectForm (default arm)', formType: undefined },
  { form: 'DrawerForm', formType: 'drawer' },
  { form: 'ModalForm', formType: 'modal' },
  { form: 'SplitForm', formType: 'split' },
  { form: 'TabbedForm', formType: 'tabbed' },
  { form: 'WizardForm', formType: 'wizard' },
];

/** An edit-mode form over one `name` field; every layout takes sections. */
const blockFor = (formType: string | undefined, over: Record<string, unknown> = {}) => ({
  type: 'object-form',
  objectName: 'deal',
  mode: 'edit',
  recordId: 'r1',
  sections: [{ name: 'main', label: 'Main', fields: ['name'] }],
  ...(formType ? { formType } : {}),
  ...over,
});

function mount(dataSource: DS, block: Record<string, unknown>) {
  const tree = (b: Record<string, unknown>) => (
    <SchemaRendererProvider dataSource={dataSource as any}>
      <SchemaRenderer schema={b as any} />
    </SchemaRendererProvider>
  );
  const view = render(tree(block));
  return { rerender: (next: Record<string, unknown>) => view.rerender(tree(next)) };
}

/** The error screen's text, or `null` when none is on screen (drawer and modal portal out). */
function shownError(): string | null {
  const heading = Array.from(document.body.querySelectorAll('h3')).find(
    (h) => h.textContent === 'Error loading form',
  );
  return heading ? (heading.parentElement?.textContent ?? '') : null;
}

const shownValue = () =>
  (document.body.querySelector('input[name="name"]') as HTMLInputElement | null)?.value ?? null;

/**
 * The form's own same-record re-read, the one that runs in the background over
 * values already on screen: the data-invalidation bus on the default arm, a host
 * re-render that rebuilds `initialValues` on the other five.
 */
async function backgroundReread(
  formType: string | undefined,
  view: ReturnType<typeof mount>,
  over: Record<string, unknown> = {},
) {
  if (formType === undefined) {
    await invalidate();
  } else {
    view.rerender(blockFor(formType, { ...over, initialValues: {} }));
  }
}

/** Mounts one form and lands its first schema read and first record read. */
async function mountShowing(formType: string | undefined, name: string) {
  const ds = makeDeferredDataSource();
  const view = mount(ds.dataSource, blockFor(formType));
  await answerSchema(await nth(ds.schemaReads, 1));
  await answerRecord(await nth(ds.recordReads, 1), name);
  await waitFor(() => expect(shownValue()).toBe(name));
  return { ...ds, view };
}

beforeEach(() => {
  // Best-effort metadata probes are not what these cases are about.
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}), text: async () => '{}' })));
  // Each failure below is logged by the form; keep the run readable.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  cleanup();
});

describe.each(FORMS)('$form clears its load error per source (objectui#10682)', ({ formType }) => {
  it('lit control: a form that never failed draws its record and no error screen', async () => {
    const { dataSource } = await mountShowing(formType, 'Record one');

    expect(shownError()).toBeNull();
    expect(dataSource.getObjectSchema).toHaveBeenCalledTimes(1);
    expect(dataSource.findOne).toHaveBeenCalledTimes(1);
  });

  it('a record read fails, then a later record read succeeds: the value is shown and the error screen is gone', async () => {
    const { dataSource, schemaReads, recordReads } = makeDeferredDataSource();
    const view = mount(dataSource, blockFor(formType));
    await answerSchema(await nth(schemaReads, 1));
    await fail(await nth(recordReads, 1), 'record read failed');
    await waitFor(() => expect(shownError(), 'the first failure was not reported').toContain('record read failed'));

    // The caller asks for another record (a drawer or modal opened over a list
    // row, say), and that read succeeds.
    view.rerender(blockFor(formType, { recordId: 'r2' }));
    await answerRecord(await nth(recordReads, 2), 'Record two');

    await waitFor(() => expect(shownError(), 'the error screen outlived a record read that succeeded').toBeNull());
    expect(shownValue()).toBe('Record two');
  });

  it('a failed BACKGROUND re-read over good values is reported, not hidden; the next re-read that succeeds takes the screen back', async () => {
    const { recordReads, view } = await mountShowing(formType, 'Record one');

    await backgroundReread(formType, view);
    await fail(await nth(recordReads, 2), 're-read failed');
    // No silent mode on any form: the failure is reported, and the last good
    // values stay in state but are not drawn.
    await waitFor(() => expect(shownError()).toContain('re-read failed'));
    expect(shownValue()).toBeNull();

    await backgroundReread(formType, view);
    await answerRecord(await nth(recordReads, 3), 'Record one, again');
    await waitFor(() => expect(shownError(), 'the error screen outlived a re-read that succeeded').toBeNull());
    expect(shownValue()).toBe('Record one, again');
  });

  it('per source: a schema read fails, then a RECORD read succeeds: the schema error stays', async () => {
    const { schemaReads, recordReads, view } = await mountShowing(formType, 'Record one');

    // The form is pointed at another object. Its record read runs over the
    // schema of the PREVIOUS object, still in state.
    view.rerender(blockFor(formType, { objectName: 'lead' }));
    const leadSchema = await nth(schemaReads, 2);
    const leadRecord = await nth(recordReads, 2);
    expect(leadSchema.objectName).toBe('lead');
    expect(leadRecord.objectName).toBe('lead');

    await fail(leadSchema, 'lead schema read failed');
    await waitFor(() => expect(shownError()).toContain('lead schema read failed'));
    await answerRecord(leadRecord, 'Lead one');
    // Give the record commit every chance to land before reading the screen.
    await settle(() => {});

    expect(shownError(), 'a record read cleared a schema failure it says nothing about').toContain(
      'lead schema read failed',
    );
  });

  it('control: a record read fails, then another fails: the newer failure is shown', async () => {
    const { dataSource, schemaReads, recordReads } = makeDeferredDataSource();
    const view = mount(dataSource, blockFor(formType));
    await answerSchema(await nth(schemaReads, 1));
    await fail(await nth(recordReads, 1), 'first failure');
    await waitFor(() => expect(shownError()).toContain('first failure'));

    view.rerender(blockFor(formType, { recordId: 'r2' }));
    await fail(await nth(recordReads, 2), 'second failure');

    await waitFor(() => expect(shownError()).toContain('second failure'));
    expect(shownError()).not.toContain('first failure');
  });

  it('a SUPERSEDED record read that fails does not raise the error screen over the current record', async () => {
    const { dataSource, schemaReads, recordReads } = makeDeferredDataSource();
    const view = mount(dataSource, blockFor(formType));
    await answerSchema(await nth(schemaReads, 1));
    const first = await nth(recordReads, 1);

    // Another record is asked for while the first read is still in flight.
    view.rerender(blockFor(formType, { recordId: 'r2' }));
    await answerRecord(await nth(recordReads, 2), 'Record two');
    await waitFor(() => expect(shownValue()).toBe('Record two'));
    await fail(first, 'superseded read failed');
    await settle(() => {});

    expect(shownError(), 'a superseded failure took the current record off screen').toBeNull();
    expect(shownValue()).toBe('Record two');
  });

  it('a SUPERSEDED record read that succeeds does not clear the error the current record read reported', async () => {
    const { dataSource, schemaReads, recordReads } = makeDeferredDataSource();
    const view = mount(dataSource, blockFor(formType));
    await answerSchema(await nth(schemaReads, 1));
    const first = await nth(recordReads, 1);

    view.rerender(blockFor(formType, { recordId: 'r2' }));
    await fail(await nth(recordReads, 2), 'current read failed');
    await waitFor(() => expect(shownError()).toContain('current read failed'));
    await answerRecord(first, 'Superseded record');
    await settle(() => {});

    expect(shownError(), 'a superseded answer cleared the current failure').toContain('current read failed');
  });

  it('a SUPERSEDED schema read that fails does not raise the error screen over the current object', async () => {
    const { dataSource, schemaReads, recordReads } = makeDeferredDataSource();
    const view = mount(dataSource, blockFor(formType));
    const dealSchema = await nth(schemaReads, 1);

    // The form is pointed at another object while the first schema read is in flight.
    view.rerender(blockFor(formType, { objectName: 'lead' }));
    await answerSchema(await nth(schemaReads, 2));
    const leadRecord = await nth(recordReads, 1);
    expect(leadRecord.objectName).toBe('lead');
    await answerRecord(leadRecord, 'Lead one');
    await waitFor(() => expect(shownValue()).toBe('Lead one'));

    await fail(dealSchema, 'superseded schema read failed');
    await settle(() => {});

    expect(shownError(), 'a superseded schema failure took the current form off screen').toBeNull();
    expect(shownValue()).toBe('Lead one');
  });

  it('a SUPERSEDED schema read that succeeds does not clear the schema failure the current read reported', async () => {
    const { dataSource, schemaReads } = makeDeferredDataSource();
    const view = mount(dataSource, blockFor(formType));
    const dealSchema = await nth(schemaReads, 1);

    view.rerender(blockFor(formType, { objectName: 'lead' }));
    await fail(await nth(schemaReads, 2), 'current schema read failed');
    await waitFor(() => expect(shownError()).toContain('current schema read failed'));
    await answerSchema(dealSchema);
    await settle(() => {});

    expect(shownError(), 'a superseded schema answer cleared the current schema failure').toContain(
      'current schema read failed',
    );
  });
});

describe('the default arm re-reads on the data-invalidation bus (objectui#10682, the filed probe)', () => {
  it('a record read fails, then a bus re-read succeeds: the value is shown and the error screen is gone', async () => {
    const { dataSource, schemaReads, recordReads } = makeDeferredDataSource();
    mount(dataSource, blockFor(undefined));
    await answerSchema(await nth(schemaReads, 1));
    await fail(await nth(recordReads, 1), 'record read failed');
    await waitFor(() => expect(shownError()).toContain('record read failed'));

    await invalidate();
    await answerRecord(await nth(recordReads, 2), 'Recovered');

    await waitFor(() => expect(shownError(), 'the error screen outlived a bus re-read that succeeded').toBeNull());
    expect(shownValue()).toBe('Recovered');
    expect(dataSource.findOne).toHaveBeenCalledTimes(2);
  });
});
