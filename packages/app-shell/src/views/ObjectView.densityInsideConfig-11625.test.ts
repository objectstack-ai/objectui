/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#11625 — a toolbar patch on an envelope-shaped view row is written
 * inside `config`, where the save door keeps it.
 *
 * The defect: the grid's density toggle on a served view (the stock
 * `showcase_task.default` in the QA run) sent the whole active tab — which
 * carries the stored ViewItem envelope `{ name, object, viewKind, config }` —
 * with `rowHeight` spread BESIDE `config`. A body with a `config` is judged by
 * the spec's `viewItem` member of the `view` union, whose top level is
 * stripped, so the door answered `200` and stored no `rowHeight`; the density
 * reverted on reload. `sort` and `hiddenFields` went through the same spread.
 *
 * The store below judges every PUT with the spec's own `ViewMetadataSchema` and
 * keeps the parsed value, the way the door keeps "the parsed value of every key
 * its body carried". That is what makes the pre-fix control below go red for
 * the reason the live door drops the key, instead of passing because a stub
 * kept everything it was handed.
 */

import { describe, it, expect, vi } from 'vitest';
import { ViewMetadataSchema } from '@objectstack/spec/ui';
import { ObjectStackAdapter } from '@object-ui/data-objectstack';
import { buildPersistedViewBody, buildViewTabs, loadViewOverrides } from './ObjectView';

const OBJECT_NAME = 'showcase_task';
const VIEW_ID = 'showcase_task.default';

/** The stored row of a served view, as `/meta/view` serves it. */
const STORED_ROW = {
    name: VIEW_ID,
    object: OBJECT_NAME,
    viewKind: 'list',
    label: 'All Tasks',
    isDefault: true,
    isPinned: true,
    sortOrder: 2,
    visibility: 'organization',
    columnState: { widths: { name: 220 } },
    config: {
        type: 'grid',
        columns: ['name', 'status'],
        data: { provider: 'object', object: OBJECT_NAME },
        rowHeight: 'compact',
    },
};

/**
 * The active tab the toolbar fires on: the flattened body (`columns`, `type`,
 * `rowHeight` …) merged with the stored row itself, `config` included, plus
 * the tab's runtime `id` — the merge `buildViewTabs` produces for a served view.
 */
const ACTIVE_TAB = {
    ...STORED_ROW.config,
    ...STORED_ROW,
    id: VIEW_ID,
};

const ROW_STATE = {
    isDefault: STORED_ROW.isDefault,
    isPinned: STORED_ROW.isPinned,
    sortOrder: STORED_ROW.sortOrder,
    visibility: STORED_ROW.visibility,
    columnState: STORED_ROW.columnState,
};

/** A `sys_metadata`-shaped store whose PUT keeps what the spec's judge keeps. */
function makeJudgingStore() {
    const rows = new Map<string, any>();
    const meta = {
        getItems: vi.fn(async (type: string) => ({
            type,
            items: [...rows.entries()].filter(([k]) => k.startsWith(`${type}::`)).map(([, v]) => v),
        })),
        getItem: vi.fn(async (type: string, name: string) => {
            const item = rows.get(`${type}::${name}`);
            if (!item) {
                const err: any = new Error(`Not found: ${type}/${name}`);
                err.status = 404;
                throw err;
            }
            return { type, name, item };
        }),
        saveItem: vi.fn(async (type: string, name: string, item: any) => {
            const judged = ViewMetadataSchema.safeParse(item);
            if (!judged.success) {
                const err: any = new Error(`422 INVALID_METADATA: ${judged.error.message}`);
                err.status = 422;
                throw err;
            }
            rows.set(`${type}::${name}`, judged.data);
            return { success: true, item: judged.data };
        }),
    };
    return { meta, rows };
}

function makeAdapter(meta: any) {
    const ds: any = new ObjectStackAdapter({
        baseUrl: 'http://test.local',
        fetch: vi.fn(async () =>
            new Response(JSON.stringify({ success: true, data: { capabilities: {}, routes: {} } }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })),
    });
    ds.connected = true;
    ds.connectionState = 'connected';
    ds.client = { meta };
    return ds;
}

/** Write a toolbar patch the way `persistViewPatch` does on a saved view, then reload the tab. */
async function writeThenReload(body: Record<string, any>) {
    const { meta, rows } = makeJudgingStore();
    rows.set(`view::${VIEW_ID}`, { ...STORED_ROW });
    const ds = makeAdapter(meta);
    await ds.updateViewConfig(OBJECT_NAME, VIEW_ID, body, { isSavedView: true });
    const stored = rows.get(`view::${VIEW_ID}`);
    const savedViews = (await ds.listViews(OBJECT_NAME)).map((sv: any) => ({ ...sv, id: sv.name }));
    const viewOverrides = await loadViewOverrides(ds, OBJECT_NAME, [VIEW_ID]);
    const tab = buildViewTabs({
        definedViews: { [VIEW_ID]: { ...STORED_ROW.config, name: VIEW_ID, label: STORED_ROW.label } },
        savedViews,
        viewOverrides,
        fallbackTab: () => ({ id: 'all', label: 'All records', type: 'grid', columns: [] }),
    }).find((t) => t.id === VIEW_ID)!;
    return { stored, tab };
}

describe('objectui#11625 — the saved branch writes list-view keys inside `config`', () => {
    it('density lands in `config`, and no copy of it is left on the envelope', () => {
        const body = buildPersistedViewBody(ACTIVE_TAB, { rowHeight: 'medium' }, { isSavedView: true });

        expect(body.config.rowHeight).toBe('medium');
        expect(body).not.toHaveProperty('rowHeight');
        // The rest of the body the row is made of rides along unchanged.
        expect(body.config.columns).toEqual(STORED_ROW.config.columns);
        expect(body.config.data).toEqual(STORED_ROW.config.data);
        expect(body.name).toBe(VIEW_ID);
        expect(body.viewKind).toBe('list');
        expect(body.label).toBe(STORED_ROW.label);
    });

    it('`sort`, `hiddenFields` and `inlineEdit` go through the same door into `config`', () => {
        const sort = [{ field: 'name', order: 'asc' }];
        const patch = { sort, hiddenFields: ['status'], inlineEdit: true };
        const body = buildPersistedViewBody(ACTIVE_TAB, patch, { isSavedView: true });

        expect(body.config.sort).toEqual(sort);
        expect(body.config.hiddenFields).toEqual(['status']);
        expect(body.config.inlineEdit).toBe(true);
        expect(body).not.toHaveProperty('sort');
        expect(body).not.toHaveProperty('hiddenFields');
        expect(body).not.toHaveProperty('inlineEdit');
    });

    it('the row-owned keys stay on the envelope (objectui#11013) — `columnState` included', () => {
        const columnState = { order: ['status', 'name'], widths: { name: 180 } };
        const body = buildPersistedViewBody(ACTIVE_TAB, { rowHeight: 'medium', columnState }, { isSavedView: true });

        expect(body.columnState).toEqual(columnState);
        expect(body.config).not.toHaveProperty('columnState');
        expect(body.isDefault).toBe(ROW_STATE.isDefault);
        expect(body.isPinned).toBe(ROW_STATE.isPinned);
        expect(body.sortOrder).toBe(ROW_STATE.sortOrder);
        expect(body.visibility).toBe(ROW_STATE.visibility);
        for (const key of Object.keys(ROW_STATE)) {
            expect(body.config, `row-owned \`${key}\` was moved into config`).not.toHaveProperty(key);
        }
    });

    it('a FLAT saved row keeps the flat spread — a `config` would move it to the member that strips it', () => {
        const { config: _config, ...flatTab } = ACTIVE_TAB;
        const body = buildPersistedViewBody(flatTab, { rowHeight: 'medium' }, { isSavedView: true });

        expect(body).toEqual({ ...flatTab, rowHeight: 'medium' });
        expect(body).not.toHaveProperty('config');
    });

    it('the overlay branch is unchanged: the flat patch plus `viewKind`', () => {
        const body = buildPersistedViewBody(ACTIVE_TAB, { rowHeight: 'medium' }, { isSavedView: false });
        expect(body).toEqual({ rowHeight: 'medium', viewKind: 'list' });
    });
});

describe('objectui#11625 — round trip through the judged store: the patch survives reload', () => {
    it('control: the pre-fix spread is accepted and the density is dropped (the defect, reproduced)', async () => {
        // EXACTLY the body the saved branch sent before this change.
        const { stored, tab } = await writeThenReload({ ...ACTIVE_TAB, rowHeight: 'medium' });

        expect(stored).not.toHaveProperty('rowHeight');
        expect(stored.config.rowHeight).toBe('compact');
        expect(tab.rowHeight).toBe('compact');
    });

    it.each([
        ['rowHeight', 'medium'],
        ['sort', [{ field: 'name', order: 'asc' }]],
        ['hiddenFields', ['status']],
    ] as const)('`%s` is stored in `config` and read back onto the tab', async (key, value) => {
        const { stored, tab } = await writeThenReload(
            buildPersistedViewBody(ACTIVE_TAB, { [key]: value }, { isSavedView: true }),
        );

        expect(stored.config[key]).toEqual(value);
        expect(tab[key]).toEqual(value);
        // The row state the envelope carried is still the row's.
        expect(stored.isDefault).toBe(ROW_STATE.isDefault);
        expect(stored.isPinned).toBe(ROW_STATE.isPinned);
        expect(stored.sortOrder).toBe(ROW_STATE.sortOrder);
        expect(stored.visibility).toBe(ROW_STATE.visibility);
        expect(stored.columnState).toEqual(ROW_STATE.columnState);
    });

    it('a `columnState` patch is stored on the envelope and read back', async () => {
        const columnState = { order: ['status', 'name'], widths: { name: 180 } };
        const { stored, tab } = await writeThenReload(
            buildPersistedViewBody(ACTIVE_TAB, { columnState }, { isSavedView: true }),
        );

        expect(stored.columnState).toEqual(columnState);
        expect(stored.config).not.toHaveProperty('columnState');
        expect(tab.columnState).toEqual(columnState);
    });
});
