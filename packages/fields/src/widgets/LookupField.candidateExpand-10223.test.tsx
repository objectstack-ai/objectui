/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * One dropdown open, one candidate query — objectui#10223.
 *
 * Reported from a real deployment: a scheduling form's lookup to a
 * `task_version` object, whose `highlightFields` include the master_detail
 * field `task`. The lookup declares no `lookup_columns`, so the dropdown
 * previews the first highlight columns — `task` among them. The candidate
 * query sent no `$expand`, every candidate's `task` came back as a bare
 * foreign key, and the lookup cell renderer resolved each one with its own
 * `findOne`: one request per candidate on every open, on top of the list
 * query. The display was right; the load was not.
 *
 * The fixture mirrors that shape: a full page of candidates, one master_detail
 * column inside the derived preview columns, no `lookup_columns`. What is
 * pinned:
 *
 *  - the open costs ONE candidate query, and it carries `$expand` for exactly
 *    the previewed reference column — no per-row `findOne` follows, and the
 *    subtitle still names each related record;
 *  - the control: with no reference column previewed the query carries no
 *    `$expand` key at all;
 *  - the browse-all picker behind the dropdown, the same way;
 *  - expansion changes nothing a host or a user reads besides the request
 *    count. The option labels (including a `titleFormat` template that names
 *    the expanded field), the preview text, and the record handed to
 *    `onSelectRecord` / `onSelectRecords` are the same whether or not the
 *    backend honours `$expand` — the second backend returns bare ids, which is
 *    also the fallback for a backend that ignores the parameter.
 */

import * as React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SchemaRendererContext } from '@object-ui/react';
import { LookupField } from './LookupField';
import { RecordPickerDialog } from './RecordPickerDialog';
import { getCellRenderer } from '../index';

/** A full dropdown page — the page size the inline dropdown asks for. */
const CANDIDATES = 50;

const TASK_VERSION_FIELDS: Record<string, any> = {
  name: { type: 'text', label: 'Name' },
  code: { type: 'text', label: 'Code' },
  task: { type: 'master_detail', label: 'Task', reference_to: 'task' },
  version: { type: 'number', label: 'Version' },
};

interface BackendOptions {
  /**
   * Unique per test. The lookup cell renderer's name cache is module-level, so
   * a task id resolved by one test would read as "no fetch needed" in the next.
   */
  prefix: string;
  highlightFields: string[];
  /** A backend that ignores `$expand` returns bare foreign keys. */
  honoursExpand?: boolean;
  titleFormat?: string;
}

function makeBackend({ prefix, highlightFields, honoursExpand = true, titleFormat }: BackendOptions) {
  const tasks: Record<string, { id: string; name: string }> = {};
  const rows: Record<string, any>[] = [];
  for (let i = 0; i < CANDIDATES; i++) {
    const taskId = `${prefix}_task_${i}`;
    tasks[taskId] = { id: taskId, name: `Assembly step ${i}` };
    rows.push({ id: `${prefix}_tv_${i}`, name: `TV-${i}`, code: `C-${i}`, task: taskId, version: i + 1 });
  }

  const find = vi.fn(async (objectName: string, params?: Record<string, any>) => {
    if (objectName !== 'task_version') return { data: [], total: 0 };
    const expand: string[] = honoursExpand && Array.isArray(params?.$expand) ? params!.$expand : [];
    const skip = Number(params?.$skip ?? 0);
    const top = Number(params?.$top ?? rows.length);
    const data = rows
      .slice(skip, skip + top)
      .map((r) => (expand.includes('task') ? { ...r, task: tasks[r.task] } : { ...r }));
    return { data, total: rows.length };
  });
  const findOne = vi.fn(async (objectName: string, id: string) =>
    objectName === 'task' ? tasks[id] ?? null : null,
  );
  const getObjectSchema = vi.fn(async (objectName: string) => {
    if (objectName === 'task_version') {
      return {
        name: 'task_version',
        fields: TASK_VERSION_FIELDS,
        highlightFields,
        ...(titleFormat ? { titleFormat } : {}),
      };
    }
    if (objectName === 'task') {
      return { name: 'task', fields: { name: { type: 'text', label: 'Name' } } };
    }
    return undefined;
  });

  return { dataSource: { find, findOne, getObjectSchema } as any, rows };
}

type Backend = ReturnType<typeof makeBackend>;

/** The candidate queries — `find` on the referenced object itself. */
function candidateQueries(backend: Backend): Array<Record<string, any>> {
  return backend.dataSource.find.mock.calls
    .filter(([objectName]: [string]) => objectName === 'task_version')
    .map(([, params]: [string, Record<string, any>]) => params);
}

/** Every read that is NOT a candidate query: per-row resolution of `task`. */
function perRowReads(backend: Backend): number {
  const finds = backend.dataSource.find.mock.calls.filter(
    ([objectName]: [string]) => objectName !== 'task_version',
  ).length;
  return finds + backend.dataSource.findOne.mock.calls.length;
}

/**
 * Macrotask flushes, as in `LookupField.pickerAgreement.test.tsx`: the schema
 * fetches, any per-id resolution and the re-render that carries a resolved
 * name all settle, without a predicate that would have to encode the answer.
 */
async function settle(): Promise<void> {
  for (let i = 0; i < 6; i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
}

/**
 * Mount the lookup the way a form does and wait for the referenced schema,
 * which lands at mount — before any user can reach the trigger.
 */
async function mountLookup(backend: Backend, extra: Record<string, unknown> = {}): Promise<void> {
  render(
    <SchemaRendererContext.Provider value={{ dataSource: backend.dataSource } as any}>
      <LookupField
        value={undefined}
        onChange={() => {}}
        dataSource={backend.dataSource}
        field={{ reference_to: 'task_version' } as never}
        {...(extra as object)}
      />
    </SchemaRendererContext.Provider>,
  );
  await waitFor(() => expect(backend.dataSource.getObjectSchema).toHaveBeenCalledWith('task_version'));
  await settle();
}

async function openDropdown(backend: Backend, extra: Record<string, unknown> = {}): Promise<void> {
  await mountLookup(backend, extra);
  await act(async () => {
    fireEvent.click(screen.getByTestId('lookup-trigger'));
  });
  await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(CANDIDATES));
  await settle();
}

function previewTexts(field: string): string[] {
  return Array.from(document.querySelectorAll(`[data-lookup-preview="${field}"]`)).map(
    (el) => el.textContent ?? '',
  );
}

afterEach(() => {
  cleanup();
  // Selecting an option records it as "recently used"; keep tests independent.
  try {
    localStorage.clear();
  } catch {
    /* no storage in this environment */
  }
});

describe('LookupField — the dropdown expands the reference columns it previews (objectui#10223)', () => {
  it('one open costs one candidate query carrying `$expand`, and no per-row read', async () => {
    const backend = makeBackend({ prefix: 'card', highlightFields: ['code', 'task', 'version'] });
    await openDropdown(backend);

    const queries = candidateQueries(backend);
    expect(queries).toHaveLength(1);
    expect(queries[0].$expand).toEqual(['task']);
    expect(perRowReads(backend)).toBe(0);

    // The subtitle still names every related record.
    const tasks = previewTexts('task');
    expect(tasks).toHaveLength(CANDIDATES);
    expect(tasks[0]).toBe('Assembly step 0');
    expect(tasks[CANDIDATES - 1]).toBe(`Assembly step ${CANDIDATES - 1}`);
  });

  it('control: with no reference column previewed, the query carries no `$expand` key', async () => {
    const backend = makeBackend({ prefix: 'ctrl', highlightFields: ['code', 'version'] });
    await openDropdown(backend);

    const queries = candidateQueries(backend);
    expect(queries).toHaveLength(1);
    expect('$expand' in queries[0]).toBe(false);
    expect(perRowReads(backend)).toBe(0);
    expect(previewTexts('task')).toHaveLength(0);
    expect(previewTexts('code')[0]).toBe('C-0');
  });

  it('the browse-all picker behind it expands the same column, and reads nothing per row', async () => {
    const backend = makeBackend({ prefix: 'pick', highlightFields: ['code', 'task', 'version'] });
    await mountLookup(backend);
    await act(async () => {
      fireEvent.click(screen.getByTestId('browse-all-records'));
    });
    await waitFor(() => expect(screen.getByText('TV-0')).toBeInTheDocument());
    await settle();

    const queries = candidateQueries(backend);
    expect(queries).toHaveLength(1);
    expect(queries[0].$expand).toEqual(['task']);
    expect(perRowReads(backend)).toBe(0);

    const cells = Array.from(document.querySelectorAll('[data-lookup-cell="task"]'));
    expect(cells.length).toBeGreaterThan(0);
    expect(cells[0].textContent).toBe('Assembly step 0');
  });
});

describe('LookupField — expansion changes the request count and nothing else (objectui#10223)', () => {
  /**
   * `titleFormat` names the expanded field on purpose: a template that
   * printed an expanded record would print an object where it used to print
   * the key.
   */
  const TITLE_FORMAT = '{code} - {task}';

  interface DropdownReading {
    labels: string[];
    previews: string[];
    picked: Record<string, unknown>;
  }

  async function readDropdown(honoursExpand: boolean): Promise<DropdownReading> {
    const backend = makeBackend({
      prefix: 'same',
      highlightFields: ['code', 'task', 'version'],
      honoursExpand,
      titleFormat: TITLE_FORMAT,
    });
    const onSelectRecord = vi.fn();
    await openDropdown(backend, { onSelectRecord });
    const options = screen.getAllByRole('option').slice(0, 3);
    const labels = options.map((o) => o.getAttribute('title') ?? '');
    const previews = previewTexts('task').slice(0, 3);
    await act(async () => {
      fireEvent.click(options[0]);
    });
    expect(onSelectRecord).toHaveBeenCalledTimes(1);
    const picked = onSelectRecord.mock.calls[0][0] as Record<string, unknown>;
    cleanup();
    localStorage.clear();
    return { labels, previews, picked };
  }

  it('dropdown: same labels, same subtitles, same record handed to onSelectRecord', async () => {
    // The expanding backend first: it resolves nothing per row, so it leaves
    // the module-level name cache empty for the bare-id run that follows.
    const expanded = await readDropdown(true);
    const bare = await readDropdown(false);

    expect(expanded).toEqual(bare);
    expect(expanded.labels[0]).toBe('C-0 - same_task_0');
    expect(expanded.previews[0]).toBe('Assembly step 0');
    expect(expanded.picked.task).toBe('same_task_0');
  });

  interface PickerReading {
    titles: string[];
    tasks: string[];
    picked: Record<string, unknown>[];
  }

  async function readPicker(honoursExpand: boolean): Promise<PickerReading> {
    const backend = makeBackend({
      prefix: 'samepick',
      highlightFields: ['code', 'task', 'version'],
      honoursExpand,
    });
    const onSelectRecords = vi.fn();
    render(
      <SchemaRendererContext.Provider value={{ dataSource: backend.dataSource } as any}>
        <RecordPickerDialog
          open
          onOpenChange={() => {}}
          dataSource={backend.dataSource}
          objectName="task_version"
          displayField="name"
          titleFormat={TITLE_FORMAT}
          columns={['name', 'code', 'task', 'version']}
          onSelect={() => {}}
          onSelectRecords={onSelectRecords}
          cellRenderer={getCellRenderer}
          fieldsMeta={TASK_VERSION_FIELDS}
        />
      </SchemaRendererContext.Provider>,
    );
    await waitFor(() => expect(screen.getByTestId('record-row-samepick_tv_0')).toBeInTheDocument());
    await settle();
    const read = (field: string) =>
      Array.from(document.querySelectorAll(`[data-lookup-cell="${field}"]`))
        .slice(0, 3)
        .map((el) => el.textContent ?? '');
    const titles = read('name');
    const tasks = read('task');
    await act(async () => {
      fireEvent.click(screen.getByTestId('record-row-samepick_tv_0'));
    });
    expect(onSelectRecords).toHaveBeenCalledTimes(1);
    const picked = onSelectRecords.mock.calls[0][0] as Record<string, unknown>[];
    cleanup();
    return { titles, tasks, picked };
  }

  it('picker: same title cells, same task cells, same records handed to onSelectRecords', async () => {
    const expanded = await readPicker(true);
    const bare = await readPicker(false);

    expect(expanded).toEqual(bare);
    expect(expanded.titles[0]).toBe('C-0 - samepick_task_0');
    expect(expanded.tasks[0]).toBe('Assembly step 0');
    expect(expanded.picked).toEqual([
      { id: 'samepick_tv_0', name: 'TV-0', code: 'C-0', task: 'samepick_task_0', version: 1 },
    ]);
  });
});
