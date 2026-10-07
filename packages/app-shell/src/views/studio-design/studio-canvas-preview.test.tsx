// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Contract tests for the Studio-canvas preview registry.
 *
 * The registry exists to give the Studio design surface a per-type, overridable
 * canvas renderer, replacing the hardcoded `object → object-view grid` branch in
 * `StudioDesignSurface` (issue #2337). These pin the three properties the
 * surface relies on:
 *   1. `object` ships a built-in default (so the grid still shows out of the box).
 *   2. Unknown types resolve to `undefined` (so the surface falls back to the
 *      generic MetadataPreview pipeline like every other type).
 *   3. Registration is last-write-wins (so downstream can override without
 *      forking the surface).
 */
import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ComponentRegistry } from '@object-ui/core';
import { MetadataCtx, type MetadataContextValue } from '@object-ui/react';
import type { StudioCanvasNavEntry, StudioCanvasPreviewProps } from './studio-canvas-preview';
import {
  getStudioCanvasPreview,
  registerStudioCanvasPreview,
  listStudioCanvasPreviewTypes,
  navEntryListTarget,
  StudioCanvasNavEntryContext,
  StudioObjectRecordsCanvas,
} from './studio-canvas-preview';

describe('studio-canvas-preview registry', () => {
  it('ships a built-in default for `object` (the records grid)', () => {
    expect(getStudioCanvasPreview('object')).toBe(StudioObjectRecordsCanvas);
    expect(listStudioCanvasPreviewTypes()).toContain('object');
  });

  it('returns undefined for types with no override (falls back to MetadataPreview)', () => {
    // `page`/`dashboard`/etc. have a MetadataPreview but no studio-canvas
    // override — they must NOT be intercepted here.
    expect(getStudioCanvasPreview('page')).toBeUndefined();
    expect(getStudioCanvasPreview('')).toBeUndefined();
    expect(getStudioCanvasPreview('does-not-exist')).toBeUndefined();
  });

  it('is last-write-wins so downstream can override the default', () => {
    const original = getStudioCanvasPreview('object');
    const Custom = (_props: StudioCanvasPreviewProps) => null;
    try {
      registerStudioCanvasPreview('object', Custom);
      expect(getStudioCanvasPreview('object')).toBe(Custom);
    } finally {
      // Restore so registry state doesn't leak into other suites (the registry
      // is module-global).
      registerStudioCanvasPreview('object', original!);
    }
    expect(getStudioCanvasPreview('object')).toBe(StudioObjectRecordsCanvas);
  });
});

/**
 * objectui#11774 — the default `object` canvas previews the nav entry it is
 * open on: an entry's `filters` (a data slice) or `viewName` (a named view).
 *
 * It does not interpret either key itself. `navEntryListTarget` asks
 * `resolveHref` where the running app takes the entry and reads that landing
 * the way the route does (`parseUrlFilterTriples` for `/data`, the
 * `/view/:viewId` segment for a view), so these pins state what the RUNTIME
 * reading answers, and the render pins what the canvas hands the renderer.
 *
 * The entry reaches the canvas through `StudioCanvasNavEntryContext`, beside
 * `StudioCanvasPreviewProps` and not in them: those props are on the package
 * entry. With no context the canvas renders the schema it always rendered.
 */
describe('navEntryListTarget — the runtime reading of an object entry (objectui#11774)', () => {
  it('a `filters` entry lands on `/data`, read as its equality conditions', () => {
    expect(navEntryListTarget('showcase_task', { navId: 'nav_slice_urgent', filters: { priority: 'urgent' } })).toEqual({
      filter: [['priority', '=', 'urgent']],
    });
  });

  it('a `viewName` entry lands on the view it names', () => {
    expect(navEntryListTarget('showcase_task', { navId: 'nav_report_tabular', viewName: 'tabular' })).toEqual({
      filter: [],
      viewName: 'tabular',
    });
  });

  it('a template value is substituted from the session, as the sidebar substitutes it', () => {
    expect(
      navEntryListTarget('showcase_task', { filters: { assignee: '{current_user_id}' } }, { currentUserId: 'usr_1' }),
    ).toEqual({ filter: [['assignee', '=', 'usr_1']] });
  });

  it('a template value the session cannot resolve is dropped, as `resolveHref` drops it', () => {
    expect(navEntryListTarget('showcase_task', { filters: { assignee: '{current_user_id}' } })).toEqual({ filter: [] });
  });

  it('CONTROL: a plain entry, and no entry at all, change nothing', () => {
    expect(navEntryListTarget('showcase_task', { navId: 'nav_tasks' })).toEqual({ filter: [] });
    expect(navEntryListTarget('showcase_task', null)).toEqual({ filter: [] });
  });
});

describe('StudioObjectRecordsCanvas — renders the entry it is open on (objectui#11774)', () => {
  /** Stands in for `plugin-view`'s `object-view`, recording the schema it is handed. */
  function ObjectViewRecorder({ schema }: { schema: Record<string, unknown> }) {
    return <pre data-testid="object-view-schema">{JSON.stringify(schema)}</pre>;
  }
  const VIEW = { name: 'showcase_task.tabular', label: 'Task List', type: 'grid', columns: [{ field: 'title' }] };
  const METADATA: MetadataContextValue = {
    apps: [],
    objects: [{ name: 'showcase_task', label: 'Task', listViews: { 'showcase_task.tabular': VIEW } }],
    dashboards: [],
    reports: [],
    pages: [],
    loading: false,
    error: null,
    refresh: async () => {},
    invalidate: () => {},
    ensureType: async () => [],
    getItem: async () => null,
    getItemsByType: () => [],
  };

  beforeAll(() => {
    ComponentRegistry.register('object-view', ObjectViewRecorder as never, { namespace: 'plugin-view' });
  });
  afterEach(cleanup);

  function renderedSchema(entry: StudioCanvasNavEntry | null): Record<string, unknown> {
    render(
      <MetadataCtx.Provider value={METADATA}>
        <StudioCanvasNavEntryContext.Provider value={entry}>
          <StudioObjectRecordsCanvas type="object" name="showcase_task" draft={{}} />
        </StudioCanvasNavEntryContext.Provider>
      </MetadataCtx.Provider>,
    );
    return JSON.parse(screen.getByTestId('object-view-schema').textContent ?? 'null');
  }

  it('a data-slice entry hands the renderer its conditions as the list filter', () => {
    expect(renderedSchema({ navId: 'nav_slice_urgent', filters: { priority: 'urgent' } })).toEqual({
      type: 'object-view',
      objectName: 'showcase_task',
      table: { filter: [['priority', '=', 'urgent']] },
    });
  });

  it('a named-view entry hands the renderer that view of the object, opened', () => {
    expect(renderedSchema({ navId: 'nav_report_tabular', viewName: 'tabular' })).toEqual({
      type: 'object-view',
      objectName: 'showcase_task',
      listViews: { 'showcase_task.tabular': VIEW },
      defaultListView: 'showcase_task.tabular',
    });
  });

  it('a view the object does not have opens the plain list, as the runtime falls back to its default', () => {
    expect(renderedSchema({ navId: 'nav_gone', viewName: 'no_such_view' })).toEqual({
      type: 'object-view',
      objectName: 'showcase_task',
    });
  });

  it('CONTROL: a plain entry, and no entry, render exactly the schema rendered before', () => {
    expect(renderedSchema({ navId: 'nav_tasks' })).toEqual({ type: 'object-view', objectName: 'showcase_task' });
    cleanup();
    expect(renderedSchema(null)).toEqual({ type: 'object-view', objectName: 'showcase_task' });
  });
});
