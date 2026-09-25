/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The shared record-delete core (objectui#10383, ADR-0094), pinned at the unit
 * level: the question, the single delete, the bulk delete, the partial failure
 * and the package-owned permission-set reset — with the runner-facing result
 * shape each path returns, because the console registers `run` as its action
 * runner's `delete` handler and those shapes are what keep the runner from
 * toasting a second time.
 *
 * The translator echoes the key (plus `|defaultValue` when one is passed) so
 * each assertion names the copy it expects without depending on a pack.
 */

import { describe, it, expect, vi } from 'vitest';
import { recordDelete } from '../recordDelete';

const t = (key: string, options?: Record<string, unknown>) => {
  const vars = { ...(options ?? {}) };
  delete vars.defaultValue;
  const suffix = Object.keys(vars).length ? ` ${JSON.stringify(vars)}` : '';
  return `${key}${suffix}`;
};

function harness(opts: {
  objectName?: string;
  failIds?: string[];
  findOne?: (resource: string, id: string) => Promise<unknown>;
} = {}) {
  const failIds = opts.failIds ?? [];
  const dataSource = {
    delete: vi.fn(async (_resource: string, id: string) => {
      if (failIds.includes(id)) throw new Error(`refused ${id}`);
      return true;
    }),
    findOne: vi.fn(opts.findOne ?? (async () => null)),
  };
  const toast = { success: vi.fn(), error: vi.fn() };
  const onRefresh = vi.fn();
  const deps = {
    objectName: opts.objectName ?? 'crm_lead',
    label: 'Lead',
    t,
    dataSource,
    toast,
    onRefresh,
  };
  return { deps, dataSource, toast, onRefresh };
}

describe('recordDelete.confirmText', () => {
  it('asks the plain delete question for an ordinary record', () => {
    expect(recordDelete.confirmText({ objectName: 'crm_lead', t }, { id: 'l1' })).toBe(
      'objectActions.deleteConfirm',
    );
  });

  it('asks the RESET question for a package-owned permission set (ADR-0094)', () => {
    expect(
      recordDelete.confirmText(
        { objectName: 'sys_permission_set', t },
        { id: 'ps1', managed_by: 'package' },
      ),
    ).toBe('objectActions.resetPackageSetConfirm');
  });

  it('keeps the plain question for an environment-owned permission set, or with no row', () => {
    expect(
      recordDelete.confirmText({ objectName: 'sys_permission_set', t }, { id: 'ps1', managed_by: 'user' }),
    ).toBe('objectActions.deleteConfirm');
    expect(recordDelete.confirmText({ objectName: 'sys_permission_set', t })).toBe(
      'objectActions.deleteConfirm',
    );
  });
});

describe('recordDelete.run — one record', () => {
  it('deletes, refreshes, toasts success, and returns the silent success the runner expects', async () => {
    const { deps, dataSource, toast, onRefresh } = harness();
    const res = await recordDelete.run(deps, { params: { recordId: 'l1' } });

    expect(dataSource.delete).toHaveBeenCalledTimes(1);
    expect(dataSource.delete).toHaveBeenCalledWith('crm_lead', 'l1');
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith('objectActions.deleteSuccess {"label":"Lead"}');
    expect(toast.error).not.toHaveBeenCalled();
    expect(res).toEqual({ success: true, reload: true, silent: true });
  });

  it('a refused delete toasts the failure with its message, does not refresh, and returns no `error`', async () => {
    const { deps, toast, onRefresh } = harness({ failIds: ['l1'] });
    const res = await recordDelete.run(deps, { params: { recordId: 'l1' } });

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith('objectActions.deleteFailed {"label":"Lead"}', {
      description: 'refused l1',
    });
    expect(onRefresh).not.toHaveBeenCalled();
    expect(res).toEqual({ success: false });
  });

  it('reads the id off `params.record`, then a single `params.records` entry, then the legacy top-level `recordId`', async () => {
    const a = harness();
    await recordDelete.run(a.deps, { params: { record: { id: 'from-record' } } });
    expect(a.dataSource.delete).toHaveBeenCalledWith('crm_lead', 'from-record');

    const b = harness();
    await recordDelete.run(b.deps, { params: { records: [{ id: 'only-one' }] } });
    expect(b.dataSource.delete).toHaveBeenCalledWith('crm_lead', 'only-one');

    const c = harness();
    await recordDelete.run(c.deps, { recordId: 'legacy' });
    expect(c.dataSource.delete).toHaveBeenCalledWith('crm_lead', 'legacy');
  });

  it('with no id at all, deletes nothing and returns the `error` for the runner to report', async () => {
    const { deps, dataSource, toast } = harness();
    const res = await recordDelete.run(deps, { params: {} });

    expect(dataSource.delete).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(res).toEqual({ success: false, error: 'objectActions.noRecordId' });
  });
});

describe('recordDelete.run — several records', () => {
  it('deletes each record, refreshes once, and toasts ONE summary', async () => {
    const { deps, dataSource, toast, onRefresh } = harness();
    const res = await recordDelete.run(deps, {
      params: { records: [{ id: 'a' }, { id: 'b' }, { name: 'no id — skipped' }] },
    });

    expect(dataSource.delete).toHaveBeenCalledTimes(2);
    expect(dataSource.delete).toHaveBeenCalledWith('crm_lead', 'a');
    expect(dataSource.delete).toHaveBeenCalledWith('crm_lead', 'b');
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith(
      'objectActions.bulkDeleteSuccess {"count":2,"label":"Lead"}',
    );
    expect(res).toEqual({ success: true, reload: true, silent: true });
  });

  it('a partial failure toasts "N deleted, M failed" once, still refreshes, and returns no `error`', async () => {
    const { deps, dataSource, toast, onRefresh } = harness({ failIds: ['b'] });
    const res = await recordDelete.run(deps, { params: { records: [{ id: 'a' }, { id: 'b' }] } });

    expect(dataSource.delete).toHaveBeenCalledTimes(2);
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith(
      'objectActions.bulkDeletePartial {"succeeded":1,"failed":1}',
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(res).toEqual({ success: false });
  });
});

describe('recordDelete.run — ADR-0094 package-owned permission set', () => {
  it('toasts the RESET when the row passed in is package-owned, without a lookup', async () => {
    const { deps, dataSource, toast } = harness({ objectName: 'sys_permission_set' });
    await recordDelete.run(deps, {
      params: { recordId: 'ps1', record: { id: 'ps1', managed_by: 'package' } },
    });

    expect(dataSource.delete).toHaveBeenCalledWith('sys_permission_set', 'ps1');
    expect(dataSource.findOne).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('objectActions.resetPackageSetSuccess');
  });

  it('looks the row up with findOne when only the id is known, and toasts the reset', async () => {
    const { deps, dataSource, toast } = harness({
      objectName: 'sys_permission_set',
      findOne: async () => ({ id: 'ps1', managed_by: 'package' }),
    });
    await recordDelete.run(deps, { params: { recordId: 'ps1' } });

    expect(dataSource.findOne).toHaveBeenCalledWith('sys_permission_set', 'ps1');
    expect(toast.success).toHaveBeenCalledWith('objectActions.resetPackageSetSuccess');
  });

  it('an environment-owned set, or a failed lookup, keeps the plain delete copy (control)', async () => {
    const env = harness({ objectName: 'sys_permission_set' });
    await recordDelete.run(env.deps, {
      params: { recordId: 'ps1', record: { id: 'ps1', managed_by: 'user' } },
    });
    expect(env.toast.success).toHaveBeenCalledWith('objectActions.deleteSuccess {"label":"Lead"}');

    const lost = harness({
      objectName: 'sys_permission_set',
      findOne: async () => {
        throw new Error('lookup failed');
      },
    });
    await recordDelete.run(lost.deps, { params: { recordId: 'ps1' } });
    // Best-effort: the lookup failing does not block the delete.
    expect(lost.dataSource.delete).toHaveBeenCalledWith('sys_permission_set', 'ps1');
    expect(lost.toast.success).toHaveBeenCalledWith('objectActions.deleteSuccess {"label":"Lead"}');
  });

  it('an ordinary object is never looked up', async () => {
    const { deps, dataSource } = harness();
    await recordDelete.run(deps, { params: { recordId: 'l1' } });
    expect(dataSource.findOne).not.toHaveBeenCalled();
  });
});
