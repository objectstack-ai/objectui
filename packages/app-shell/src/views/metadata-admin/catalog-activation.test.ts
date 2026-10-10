// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#7611 — the row-state seam behind the Setup catalog's active switch
 * (`catalog-activation.ts`): the one place the catalog pages still read and
 * write a catalog row, pending the activation ledger. Pinned so that the seam
 * stays ONE seam: which object each type's flag lives on, the by-name answer,
 * the row write, and the type it refuses.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  hasCatalogActivation,
  readCatalogRowStates,
  writeCatalogActive,
  type CatalogRowDoor,
} from './catalog-activation';

function door(rows: unknown): CatalogRowDoor & { find: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> } {
  return {
    find: vi.fn(async () => rows),
    update: vi.fn(async () => ({})),
  };
}

describe('catalog-activation (objectui#7611)', () => {
  it('offers a switch for permission sets and positions, never for capabilities', () => {
    expect(hasCatalogActivation('permission')).toBe(true);
    expect(hasCatalogActivation('position')).toBe(true);
    // The capability registry is incomplete (it serves package capabilities
    // only), so Setup does not list it at all — and has no switch for it.
    expect(hasCatalogActivation('capability')).toBe(false);
  });

  it('answers each row by its item NAME, reading the type’s own object', async () => {
    const d = door({
      data: [
        { id: 'ps_1', name: 'alpha', active: true },
        { id: 'ps_2', name: 'beta', active: false },
        // No `active` column value: the column's default, active.
        { id: 'ps_3', name: 'gamma' },
        // A row with no name cannot be joined to an item.
        { id: 'ps_4' },
      ],
    });
    const states = await readCatalogRowStates(d, 'permission');
    expect(d.find).toHaveBeenCalledWith('sys_permission_set', { $select: ['id', 'name', 'active'], $top: 1000 });
    expect([...states.entries()]).toEqual([
      ['alpha', { id: 'ps_1', active: true }],
      ['beta', { id: 'ps_2', active: false }],
      ['gamma', { id: 'ps_3', active: true }],
    ]);

    const p = door({ data: [] });
    await readCatalogRowStates(p, 'position');
    expect(p.find.mock.calls[0][0]).toBe('sys_position');
  });

  it('reads nothing for a type without a switch', async () => {
    const d = door({ data: [{ id: 'c1', name: 'x' }] });
    expect((await readCatalogRowStates(d, 'capability')).size).toBe(0);
    expect(d.find).not.toHaveBeenCalled();
  });

  it('writes the flag on the row the data door addresses, and refuses an unknown type', async () => {
    const d = door({ data: [] });
    await writeCatalogActive(d, 'position', 'pos_1', false);
    expect(d.update).toHaveBeenCalledWith('sys_position', 'pos_1', { active: false });
    await expect(writeCatalogActive(d, 'capability', 'c1', true)).rejects.toThrow(/capability/);
  });

  it('propagates a refused read rather than answering "active"', async () => {
    const d: CatalogRowDoor = {
      find: async () => {
        throw new Error('403');
      },
      update: async () => ({}),
    };
    await expect(readCatalogRowStates(d, 'permission')).rejects.toThrow('403');
  });
});
