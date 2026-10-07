// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * StudioCanvasPreviewRegistry — per-type canvas renderers for the Studio
 * design surface.
 *
 * Why a *second* registry alongside `MetadataPreviewRegistry`
 * (`../metadata-admin/preview-registry`): the SAME metadata type is rendered
 * differently depending on the SURFACE it appears in. An `object` in the Data
 * pillar (metadata-admin) is the field-form DESIGNER (`ObjectPreview` →
 * `ObjectFormCanvas`); an `object` in the Studio design canvas is the runtime
 * records GRID — schema editing belongs to the Data pillar, so the app-builder
 * canvas shows objects as the running app does, not a field editor.
 *
 * A single type-keyed registry can't express that `(type, surface)` split,
 * which is why the object branch used to be a hardcoded special-case inside
 * `StudioDesignSurface`. This registry is the missing surface dimension, scoped
 * to the Studio canvas: a sensible default is registered for `object` (below),
 * and downstream apps/plugins override it via `registerStudioCanvasPreview()`
 * without forking `StudioDesignSurface`.
 *
 * Resolution contract: if a type has no studio-canvas entry,
 * `getStudioCanvasPreview()` returns `undefined` and the surface falls back to
 * the generic `MetadataPreview` pipeline (`getMetadataPreview`) like every
 * other type. So this registry is purely additive — it only intercepts types
 * that opt in.
 *
 * NOTE (long-term): today only `object` needs a surface-specific override. If a
 * second surface ever needs per-type overrides, prefer folding this into a
 * `(type, surface)`-keyed lookup on the existing MetadataPreviewRegistry rather
 * than growing a third parallel registry.
 */

import * as React from 'react';
import { SchemaRenderer, useMetadata } from '@object-ui/react';
import { resolveViewId } from '@object-ui/core';
import { useAuth } from '@object-ui/auth';
import { resolveHref, type NavTemplateContext } from '@object-ui/layout';
import type { NavigationEntryItem } from '@object-ui/types';
import type { ObjectNavItem } from '@objectstack/spec/ui';
import { parseUrlFilterTriples, type FilterTriple } from '../drillUrlFilters.js';
import { findByName } from '../../hooks/useNavTargetLabel.js';

/**
 * Props handed to a Studio-canvas renderer. Intentionally a small, read-only
 * subset of {@link MetadataPreviewProps}: the Studio canvas renders objects as
 * a runtime surface, not an editable draft (schema editing is the Data
 * pillar's job), so there is no `onPatch`/`selection` here.
 */
export interface StudioCanvasPreviewProps {
  /** The metadata type, e.g. 'object'. */
  type: string;
  /** The item's primary-key name (e.g. the object's API name). */
  name: string;
  /**
   * The live draft from the design surface. Treat as immutable and untrusted
   * (validation may be in progress). Provided for renderers that need config
   * beyond the name; the default object renderer only needs `name`.
   */
  draft: Record<string, unknown>;
  /** Optional BCP-47 locale code (e.g. 'en', 'zh-CN') for localized labels. */
  locale?: string;
}

export type StudioCanvasPreview = React.ComponentType<StudioCanvasPreviewProps>;

const REGISTRY = new Map<string, StudioCanvasPreview>();

/**
 * Register (or replace) the Studio-canvas renderer for a metadata type.
 * Idempotent and last-write-wins, so an app can swap the default from its
 * plugin bootstrap.
 */
export function registerStudioCanvasPreview(type: string, component: StudioCanvasPreview): void {
  REGISTRY.set(type, component);
}

/** Look up the registered Studio-canvas renderer for a type, if any. */
export function getStudioCanvasPreview(type: string): StudioCanvasPreview | undefined {
  return REGISTRY.get(type);
}

/** Snapshot of registered Studio-canvas types (diagnostics/tests). */
export function listStudioCanvasPreviewTypes(): string[] {
  return Array.from(REGISTRY.keys()).sort();
}

/**
 * The Interfaces nav entry the canvas is open on, as far as its list goes
 * (objectui#11774): an `object` entry's `filters` (a data slice) or `viewName`
 * (a named view), as authored, with the entry's `id`.
 *
 * ⛔ Studio-internal. A context and not a member of
 * {@link StudioCanvasPreviewProps}: those props are on the package entry, and
 * carrying an entry's modifiers to every registered canvas would widen that
 * published face. The Interfaces pillar provides it around the canvas it
 * renders; the built-in default below reads it. A canvas registered over the
 * default, or one rendered outside the pillar, sees `null` and renders as it
 * always did.
 */
export interface StudioCanvasNavEntry {
  navId?: string;
  filters?: ObjectNavItem['filters'];
  viewName?: ObjectNavItem['viewName'];
}

export const StudioCanvasNavEntryContext = React.createContext<StudioCanvasNavEntry | null>(null);

/** What an entry changes about the object's list: the slice's conditions, or the named view to open. */
export interface NavEntryListTarget {
  /** The entry's `filters` as the `/data` surface reads them; empty when it lands elsewhere. */
  filter: FilterTriple[];
  /** The view the entry lands on (`/view/:viewId`), as the entry names it; absent otherwise. */
  viewName?: string;
}

/**
 * Where the running app takes an `object` nav entry, read the way the route it
 * lands on reads it (objectui#11774). The preview asks the runtime rather than
 * interpreting `filters` / `viewName` a second time:
 *
 *  - `resolveHref` (`@object-ui/layout`) is the shell's single source of truth
 *    for nav → URL. It decides the landing — `recordId` → `filters` →
 *    `viewName` — and substitutes `{current_user_id}`-style values, dropping
 *    an entry it cannot resolve, as the sidebar does;
 *  - a `/data` landing is the bare data surface, whose `filter[...]` params
 *    `ObjectDataPage` reads through `parseUrlFilterTriples` — read here by the
 *    same function;
 *  - a `/view/:viewId` landing names the view `ObjectView` opens; the caller
 *    matches it as `ObjectView` does (`resolveViewId`).
 *
 * Any other landing (the plain list, a `recordId` detail page) changes nothing
 * here, so such an entry previews the object's list as before.
 */
export function navEntryListTarget(
  objectName: string,
  entry: StudioCanvasNavEntry | null,
  templateContext?: NavTemplateContext,
): NavEntryListTarget {
  if (!entry || (!entry.filters && !entry.viewName)) return { filter: [] };
  // The question is where an entry with these modifiers lands; `resolveHref`
  // reads no `id` off an object entry, so the id is carried only for the type.
  const item: NavigationEntryItem = {
    id: entry.navId ?? '',
    type: 'object',
    objectName,
    ...(entry.filters ? { filters: entry.filters } : {}),
    ...(entry.viewName ? { viewName: entry.viewName } : {}),
  };
  const { href } = resolveHref(item, '', templateContext);
  const q = href.indexOf('?');
  const route = (q < 0 ? href : href.slice(0, q)).slice(`/${objectName}`.length);
  if (route === '/data') {
    return { filter: parseUrlFilterTriples(new URLSearchParams(q < 0 ? '' : href.slice(q + 1))) };
  }
  const VIEW = '/view/';
  if (route.startsWith(VIEW) && route.length > VIEW.length) {
    return { filter: [], viewName: route.slice(VIEW.length) };
  }
  return { filter: [] };
}

/**
 * Default Studio-canvas renderer for `object` leaves: the runtime records grid,
 * exactly as the running app shows it (preview = runtime). Schema editing lives
 * in the Data pillar, so this is the object-view grid — NOT the field-form
 * designer that is the `object` entry in the MetadataPreviewRegistry.
 *
 * objectui#11774 — opened on a nav entry that slices the object (`filters`) or
 * names one of its views (`viewName`), it shows that slice or that view, as the
 * running app does (see {@link navEntryListTarget}). The named view is the
 * object's own, from the merged `listViews` the shell's metadata holds — the
 * map `ObjectView` and the rail's label resolver (`useNavTargetLabel`) read —
 * handed to the renderer as the Studio's view preview hands one. With no entry
 * (or a plain one) the schema is exactly the one this rendered before.
 *
 * Exported so downstream renderers can compose/wrap it; override the default
 * wholesale via `registerStudioCanvasPreview('object', …)`.
 */
export function StudioObjectRecordsCanvas({ name }: StudioCanvasPreviewProps) {
  const entry = React.useContext(StudioCanvasNavEntryContext);
  const { user, activeOrganization } = useAuth();
  const currentUserId = user?.id ?? null;
  const currentOrgId = activeOrganization?.id ?? null;
  // Keyed on the values, never on the context object's identity (AGENTS.md #10).
  const navId = entry?.navId;
  const filtersKey = JSON.stringify(entry?.filters ?? null);
  const entryViewName = entry?.viewName;
  const target = React.useMemo(() => {
    const filters = (JSON.parse(filtersKey) as StudioCanvasNavEntry['filters'] | null) ?? undefined;
    return navEntryListTarget(name, { navId, filters, viewName: entryViewName }, { currentUserId, currentOrgId });
  }, [name, navId, filtersKey, entryViewName, currentUserId, currentOrgId]);
  // Read only for an entry that names a view: a plain entry asks the metadata
  // cache for nothing, as before.
  const metadata = useMetadata();
  const objectViews = target.viewName ? listViewsOf(findByName(metadata.objects, name)) : undefined;
  const viewId = objectViews && target.viewName ? resolveViewId(target.viewName, Object.keys(objectViews), name) : undefined;
  const view = viewId ? objectViews?.[viewId] : undefined;
  const schema = {
    type: 'object-view',
    objectName: name,
    ...(target.filter.length > 0 ? { table: { filter: target.filter } } : {}),
    ...(viewId && view ? { listViews: { [viewId]: view }, defaultListView: viewId } : {}),
  };
  // The renderer settles its named view once, at mount, so a different view is
  // a different mount; a different slice of the same list is a refetch.
  return <SchemaRenderer key={view ? viewId : ''} schema={schema as never} />;
}

/** An object definition's merged `listViews` map, or `{}` when it has none. */
function listViewsOf(def: { listViews?: unknown } | undefined): Record<string, unknown> {
  const views = def?.listViews;
  return views && typeof views === 'object' ? (views as Record<string, unknown>) : {};
}

// Side-effect: register the built-in defaults. Kept inline (rather than a
// separate `previews/` folder like metadata-admin) because there is exactly one
// default; downstream overrides run after this module loads and win.
registerStudioCanvasPreview('object', StudioObjectRecordsCanvas);
