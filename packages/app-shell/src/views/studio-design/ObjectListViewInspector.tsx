// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#11823 (step 1) — the Properties panel of an `object` leaf edits the
 * list view its canvas shows: the columns, the filter and the sort, saved to
 * the package draft. ADR-0084's Interface editor, "source + preview": the
 * canvas beside the panel is that running list (`StudioObjectRecordsCanvas`),
 * and it shows the panel's buffer (`StudioCanvasListViewContext`), so an edit
 * shows there before it is published.
 *
 * ## Which view
 *
 * The one the canvas opens, read off the nav entry the way the runtime reads
 * it (`navEntryListTarget`):
 *
 *  - an entry that lands on a named view (`viewName`) → that view, matched
 *    against the object's merged `listViews` as `ObjectView` matches it
 *    (`resolveViewId`). A name that matches none is the view the entry opens
 *    once it exists, `<object>.<viewName>`;
 *  - any other entry → the object's default list view: the merged view
 *    flagged `isDefault`, else `<object>.default`, the identity the
 *    platform's own composer gives a container's default `list`
 *    (`expandViewContainer`).
 *
 * ## What is written, and where
 *
 * The `view` metadata item in its record shape — `{ name, object, viewKind:
 * 'list', config }` — the shape the runtime serves an object's list views in
 * (a package's `defineView` container arrives expanded into these), and the
 * shape the console's own create-view door writes (`viewEnvelope`). It goes
 * through the metadata draft door (`client.save(…, { mode: 'draft',
 * packageId })`) under its own version guard (objectui#11773), debounced by the
 * pillar's autosave like every other Studio editor. A view that does not exist
 * yet is created by the first edit, seeded with the columns the running app
 * shows an object that has no view (`defaultListColumnsFromObject`).
 *
 * ⛔ No new endpoint and no new client: the pillar's `MetadataClient` is the
 * only door. ⛔ Nothing here edits the object definition — fields belong to the
 * Data pillar. A read-only package shows the view and writes nothing: every
 * control is disabled and the pillar's autosave is blocked on the same flag.
 */

import * as React from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import {
  Badge,
  Button,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SortBuilder,
  type SortItem,
} from '@object-ui/components';
import { useMetadata } from '@object-ui/react';
import { useAuth } from '@object-ui/auth';
import { resolveViewId } from '@object-ui/core';
import { extractDraftBody, type MetadataClient } from '@object-ui/data-objectstack';
import { stripReadDecorations } from '@objectstack/spec/kernel';
import { resolveI18nLabel, type I18nLabel } from '@objectstack/spec/ui';
import { InspectorReorderButtons, InspectorShell } from '../metadata-admin/inspectors/_shared.js';
import { FieldsListEditor } from '../metadata-admin/previews/FieldsListEditor.js';
import { useObjectFields } from '../metadata-admin/previews/useObjectFields.js';
import { foldStoredListOptions } from '../metadata-admin/previews/ViewPreview.js';
import { WIDGETS, type ObjectFieldOption } from '../metadata-admin/widgets.js';
import { failed, loaded, type LoadState } from '../metadata-admin/loadState.js';
import { useDraftSaveGuard } from '../metadata-admin/DraftConflictDialog.js';
import { t, tFormat } from '../metadata-admin/i18n.js';
import { defaultListColumnsFromObject } from '../ObjectView.js';
import { findByName } from '../../hooks/useNavTargetLabel.js';
import {
  listViewsOf,
  navEntryListTarget,
  type StudioCanvasListView,
  type StudioCanvasNavEntry,
} from './studio-canvas-preview.js';
import type { Surface } from './navSurface.js';
import { issueRefusal, plainRefusal } from './metadataError.js';

type Row = Record<string, unknown>;

function isPlainObject(v: unknown): v is Row {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** The list view an `object` leaf's panel edits. */
export interface ListViewTarget {
  objectName: string;
  /** The view item's name, `<object>.<key>`: the name its draft is saved under. */
  viewId: string;
  /** A view created at this name is the object's default list view. */
  isDefault: boolean;
}

/** `<object>.<key>` for a key the view item name has to carry qualified (the spec requires the dot). */
function qualifiedViewId(objectName: string, key: string): string {
  return key.includes('.') ? key : `${objectName}.${key}`;
}

/**
 * Which view an `object` leaf's panel edits — see the module docblock.
 *
 * `landingViewName` is the view the entry lands on as the runtime reads the
 * entry (`navEntryListTarget(...).viewName`), not the raw `viewName`: an entry
 * that also slices (`filters`) lands on the data surface, and its view is then
 * the default one. `views` is the object's merged `listViews` map.
 */
export function listViewTargetOf(
  objectName: string,
  landingViewName: string | undefined,
  views: Record<string, unknown>,
): ListViewTarget {
  const ids = Object.keys(views);
  if (landingViewName) {
    const id = resolveViewId(landingViewName, ids, objectName) ?? landingViewName;
    return { objectName, viewId: qualifiedViewId(objectName, id), isDefault: false };
  }
  const flagged = ids.find((id) => isPlainObject(views[id]) && (views[id] as Row).isDefault === true);
  return { objectName, viewId: qualifiedViewId(objectName, flagged ?? 'default'), isDefault: true };
}

/**
 * A view item that does not exist yet: the record shape, bound to its object,
 * listing `columns`. Flagged default only where it is the object's default
 * list view. No `label`: the spec makes it optional, and a label invented here
 * would be one more string written in one locale.
 */
export function newListViewItem(target: ListViewTarget, columns: string[]): Row {
  return {
    name: target.viewId,
    object: target.objectName,
    viewKind: 'list',
    ...(target.isDefault ? { isDefault: true } : {}),
    config: {
      type: 'grid',
      data: { provider: 'object', object: target.objectName },
      columns,
    },
  };
}

/**
 * Where a view item keeps its list body, by the spec's own discriminant: a
 * record holds it under `config`; a flattened overlay row is the body itself.
 */
function listBodyOf(row: Row): Row {
  return isPlainObject(row.config) ? row.config : row;
}

/**
 * Whether a stored view item is a LIST view this panel can edit: the spec's
 * family discriminant says so (`viewKind: 'list'`), or, on a row that carries
 * none, its body lists `columns` (a list view's one required member). A form
 * view (`viewKind: 'form'`) or a body that is neither is not edited here, so
 * a save can never overwrite it.
 */
export function isListViewRow(row: Row): boolean {
  if (row.viewKind === 'list') return true;
  if (row.viewKind !== undefined) return false;
  return Array.isArray(listBodyOf(row).columns);
}

function withListBody(row: Row, body: Row): Row {
  return isPlainObject(row.config) ? { ...row, config: body } : { ...row, ...body };
}

/**
 * The view as one entry of `object-view`'s `listViews`: its list body, with a
 * stored `options.KIND` bag folded as the Studio's view preview folds it
 * (`foldStoredListOptions`), and the item's label.
 */
export function namedListViewOf(row: Row): Row {
  const body = listBodyOf(row);
  const label = row.label ?? body.label;
  return { ...foldStoredListOptions(body), ...(label !== undefined ? { label } : {}) };
}

/**
 * The panel buffer's identity, as the pillar's autosave (`target`,
 * `loadedFor`) and this hook's own load and save compare it: one spelling for
 * all of them. ⛔ Never `view:` + the name: that is the adapter's view CACHE
 * key, which only `invalidateViewKeys` spells (objectui#4373), and this is
 * not a cache key.
 */
function listViewBufferKey(viewId: string): string {
  return `listView:${viewId}`;
}

/** What `useDraftAutoSave` hands a save: whether the buffer is still what it sent. */
interface DraftSendClaim {
  unmoved: () => boolean;
}

export interface ObjectListViewDraft {
  /** The view the open leaf's panel edits; `null` on a leaf that is not an `object`. */
  target: ListViewTarget | null;
  /** The autosave's `target`: the buffer key of the view ({@link listViewBufferKey}), `''` with no target. */
  targetKey: string;
  /** The autosave's `loadedFor`: the target the buffer was loaded for. */
  loadedFor: string;
  /** The view item as the server holds it (draft, else published), with edits; `null` when it does not exist yet. */
  row: Row | null;
  /** The item at the view's name is not a list view (`isListViewRow`): shown as such, never edited. */
  notList: boolean;
  /** The columns a view created here starts with. */
  seedColumns: string[];
  dirty: boolean;
  /** A draft of the view is pending in the package. */
  hasDraft: boolean;
  saving: boolean;
  /**
   * The last load's or save's failure, as thrown. Read at render, in the
   * designer locale, the way the pillar reads its own (objectui#11785): a
   * refused save as an author sentence over its raw text, a load as the text.
   */
  failure: { during: 'load' | 'save'; error: unknown } | null;
  /** Replace the view item with an edited one. */
  edit: (row: Row) => void;
  /** Send the buffer to the package draft — the autosave's `save`. */
  save: (sent: DraftSendClaim) => Promise<void>;
  /** The version-conflict dialog of this buffer's guard; render it once. */
  conflictDialog: React.ReactElement;
  /** What the canvas shows (`StudioCanvasListViewContext`); `null` with nothing to show. */
  canvas: StudioCanvasListView | null;
}

/**
 * The open leaf's list-view buffer, held by the Interfaces pillar so the
 * canvas and the panel read one copy (the folded layout unmounts the panel
 * between tabs; the buffer outlives it). The pillar runs the autosave over it
 * (`useDraftAutoSave`), as it does for its other two buffers.
 */
export function useObjectListViewDraft({
  client,
  packageId,
  leaf,
  publishNonce,
  onDraftSaved,
}: {
  client: MetadataClient;
  packageId: string;
  leaf: Surface | null;
  /** Bumped by a publish: the draft is gone, and the view is re-read. */
  publishNonce: number;
  onDraftSaved?: () => void;
}): ObjectListViewDraft {
  const metadata = useMetadata();
  const { user, activeOrganization } = useAuth();
  const currentUserId = user?.id ?? null;
  const currentOrgId = activeOrganization?.id ?? null;
  const objectName = leaf?.type === 'object' && leaf.name ? leaf.name : null;
  // Keyed on the values, never on a memoised object's identity (AGENTS.md #10).
  const navId = leaf?.navId;
  const filtersKey = JSON.stringify(leaf?.filters ?? null);
  const entryViewName = leaf?.viewName;
  const landingViewName = React.useMemo(() => {
    if (!objectName) return undefined;
    const filters = (JSON.parse(filtersKey) as StudioCanvasNavEntry['filters'] | null) ?? undefined;
    return navEntryListTarget(objectName, { navId, filters, viewName: entryViewName }, { currentUserId, currentOrgId })
      .viewName;
  }, [objectName, navId, filtersKey, entryViewName, currentUserId, currentOrgId]);
  const objectDef = objectName ? findByName(metadata.objects, objectName) : undefined;
  const target = objectName ? listViewTargetOf(objectName, landingViewName, listViewsOf(objectDef)) : null;
  const viewId = target?.viewId ?? '';
  const targetKey = viewId ? listViewBufferKey(viewId) : '';
  const seedColumns = React.useMemo(() => defaultListColumnsFromObject(objectDef, 5), [objectDef]);

  const [buffer, setBuffer] = React.useState<{ for: string; row: Row | null; dirty: boolean; hasDraft: boolean }>({
    for: '',
    row: null,
    dirty: false,
    hasDraft: false,
  });
  const [failure, setFailure] = React.useState<ObjectListViewDraft['failure']>(null);
  const [saving, setSaving] = React.useState(false);
  const [reloadNonce, setReloadNonce] = React.useState(0);
  const reload = React.useCallback(() => setReloadNonce((n) => n + 1), []);
  // objectui#11773 — one guard per editing buffer; a conflict's "reload" re-runs this load.
  const { save: guardedSave, forget, dialog: conflictDialog } = useDraftSaveGuard(client, reload);

  React.useEffect(() => {
    setFailure(null);
    if (!viewId) {
      setBuffer({ for: '', row: null, dirty: false, hasDraft: false });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const draftResp = await client.getDraft<Row>('view', viewId).catch(() => null);
        if (cancelled) return;
        // A served draft is the whole document, taken as-is (objectui#10765);
        // the published layer only without one. Both lose the read
        // decorations a save must not send back.
        const draft = extractDraftBody(draftResp) as Row | null;
        // objectui#11799 — so the published layer is read only for a view with
        // no pending draft. A view the panel created and nobody published has
        // a draft and no layer, and `GET …/layers` answers 404 for it.
        const lay = draft ? null : await client.layered<Row>('view', viewId);
        if (cancelled) return;
        const published = (lay as { effective?: unknown; code?: unknown } | null)?.effective ?? (lay as { code?: unknown } | null)?.code;
        const row = draft ?? (isPlainObject(published) ? (stripReadDecorations(published) as Row) : null);
        // objectui#11773 — a read serves no version: the next save is unpinned.
        forget();
        setBuffer({ for: listViewBufferKey(viewId), row, dirty: false, hasDraft: !!draft });
      } catch (e) {
        if (!cancelled) setFailure({ during: 'load', error: e });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, viewId, publishNonce, reloadNonce, forget]);

  const edit = React.useCallback((row: Row) => {
    setBuffer((b) => ({ ...b, row, dirty: true }));
  }, []);

  const row = buffer.row;
  const notList = !!row && !isListViewRow(row);
  const save = React.useCallback(
    async (sent: DraftSendClaim) => {
      if (!viewId || !row || notList) return;
      setSaving(true);
      try {
        const outcome = await guardedSave('view', viewId, row, { mode: 'draft', packageId });
        // objectui#11773 — the author chose the saved version; the load replaces the buffer.
        if (outcome === 'reloaded') return;
        // objectui#11204 — clean only if nothing was edited while it was in flight.
        const clean = sent.unmoved();
        setBuffer((b) => (b.for === listViewBufferKey(viewId) ? { ...b, hasDraft: true, dirty: clean ? false : b.dirty } : b));
        setFailure(null);
        onDraftSaved?.();
      } catch (e) {
        setFailure({ during: 'save', error: e });
      } finally {
        setSaving(false);
      }
    },
    [guardedSave, viewId, row, notList, packageId, onDraftSaved],
  );

  const current = buffer.for === targetKey && targetKey !== '';
  const objectOf = target?.objectName;
  const isDefaultTarget = !!target?.isDefault;
  // What the canvas shows: the view, edits included. A default list view that
  // does not exist yet shows the columns the running app shows such an object
  // (its "all records" list, `defaultListColumnsFromObject`), which is also
  // what the first edit starts from. A named view that does not exist shows
  // nothing new: the canvas keeps its own fallback.
  const canvas = React.useMemo<StudioCanvasListView | null>(() => {
    if (!current || !objectOf || notList) return null;
    const shown =
      row ??
      (isDefaultTarget && seedColumns.length > 0
        ? newListViewItem({ objectName: objectOf, viewId, isDefault: true }, seedColumns)
        : null);
    return shown ? { objectName: objectOf, viewId, view: namedListViewOf(shown) } : null;
  }, [current, row, notList, objectOf, viewId, isDefaultTarget, seedColumns]);

  return {
    target,
    targetKey,
    loadedFor: buffer.for,
    row: current ? row : null,
    notList: current && notList,
    seedColumns,
    dirty: buffer.dirty,
    hasDraft: current && buffer.hasDraft,
    saving,
    failure,
    edit,
    save,
    conflictDialog,
    canvas,
  };
}

/** A `{ field, order }` sort entry, the only spelling the spec's list view declares. */
interface SortEntry {
  field: string;
  order: 'asc' | 'desc';
}

function sortEntriesOf(value: unknown): SortEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (s): s is SortEntry =>
      isPlainObject(s) && typeof s.field === 'string' && (s.order === 'asc' || s.order === 'desc'),
  );
}

/** Column index out of `FieldsListEditor`'s selection id, `config.columns[N]`. */
function selectedColumnIndex(id: string | undefined): number | null {
  const m = /\.columns\[(\d+)\]$/.exec(id ?? '');
  return m ? Number(m[1]) : null;
}

const noop = (): void => {};

const SORT_ID = 'studio-list-view-sort';
const FILTER_ID = 'studio-list-view-filter';

/**
 * The panel itself: Columns (add, remove, reorder — the Studio's own column
 * manager, `FieldsListEditor`), Filter (the runtime `FilterBuilder`, through
 * the designer's `filter-builder` widget, which writes the spec's
 * `ViewFilterRule[]`) and Sort (the runtime `SortBuilder`, in a popover the
 * width the builder needs, written as the spec's `{ field, order }[]`).
 */
export function ObjectListViewInspector({
  listView,
  readOnly,
  locale,
}: {
  listView: ObjectListViewDraft;
  readOnly: boolean;
  locale: string;
}): React.ReactElement | null {
  const { target, row, notList, seedColumns, failure, saving, hasDraft, edit, loadedFor, targetKey } = listView;
  const objectName = target?.objectName;
  const fieldState = useObjectFields(objectName);
  const [selected, setSelected] = React.useState<{ key: string; index: number | null }>({ key: '', index: null });
  if (!target) return null;
  const isLoaded = loadedFor === targetKey;
  const refusal = !failure
    ? null
    : failure.during === 'save'
      ? issueRefusal(failure.error, locale)
      : plainRefusal(failure.error);
  const working = row ?? newListViewItem(target, seedColumns);
  const body = listBodyOf(working);
  const columns = Array.isArray(body.columns) ? (body.columns as unknown[]) : [];
  const allStrings = columns.length > 0 && columns.every((c) => typeof c === 'string');
  const selectedIndex = selected.key === target.viewId ? selected.index : null;
  const writeBody = (next: Row) => edit(withListBody(working, next));
  const fields = fieldState.fields;
  const fieldCatalog: LoadState<ObjectFieldOption[]> = fieldState.error
    ? failed(fieldState.error)
    : fieldState.loading
      ? { status: 'loading' }
      : loaded(fields.map((f) => ({ name: f.name, label: f.label, type: f.type })));
  const labelOf = (name: string) => fields.find((f) => f.name === name)?.label ?? name;
  const sort = sortEntriesOf(body.sort);
  const sortSummary = sort
    .map((s) =>
      tFormat(
        s.order === 'desc' ? 'engine.studio.inspector.listView.sortDesc' : 'engine.studio.inspector.listView.sortAsc',
        locale,
        { field: labelOf(s.field) },
      ),
    )
    .join(', ');
  const FilterWidget = WIDGETS['filter-builder'];

  return (
    <InspectorShell
      kindLabel={t('engine.studio.inspector.listView.kind', locale)}
      title={resolveI18nLabel(working.label as I18nLabel | undefined, locale) || target.viewId}
      // The panel is the leaf's own, not a selection's: nothing to close.
      hideClose
      onClose={noop}
      headerActions={
        saving ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground" data-testid="list-view-saving">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t('engine.studio.autoSaving', locale)}
          </span>
        ) : hasDraft ? (
          <Badge variant="outline" className="text-[10px]">
            {t('engine.studio.unpublishedDraft', locale)}
          </Badge>
        ) : null
      }
    >
      <div data-testid="studio-list-view-inspector" className="space-y-3">
        {readOnly ? (
          <p className="rounded-md border bg-muted/40 px-2 py-1.5 text-[11px] leading-snug text-muted-foreground" data-testid="list-view-read-only">
            {t('engine.studio.inspector.listView.readOnly', locale)}
          </p>
        ) : (
          <p className="text-[11px] leading-snug text-muted-foreground">
            {t('engine.studio.inspector.listView.intro', locale)}
          </p>
        )}
        {refusal && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive" role="alert" data-testid="list-view-refusal">
            <p className="whitespace-pre-line">{refusal.message}</p>
            {refusal.detail && (
              <details className="mt-1">
                <summary className="cursor-pointer select-none opacity-80">{t('engine.studio.refusal.details', locale)}</summary>
                <pre className="mt-1 whitespace-pre-wrap break-words font-mono opacity-90">{refusal.detail}</pre>
              </details>
            )}
          </div>
        )}
        {!isLoaded ? (
          failure ? null : (
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> {t('engine.studio.loading', locale)}
            </p>
          )
        ) : notList ? (
          <p className="rounded-md border border-dashed px-2 py-1.5 text-[11px] leading-snug text-muted-foreground" data-testid="list-view-not-list">
            {tFormat('engine.studio.inspector.listView.notList', locale, { view: target.viewId })}
          </p>
        ) : (
          <>
            {!row && (
              <p className="rounded-md border border-dashed px-2 py-1.5 text-[11px] leading-snug text-muted-foreground" data-testid="list-view-not-created">
                {tFormat('engine.studio.inspector.listView.notCreated', locale, { view: target.viewId })}
              </p>
            )}
            <div className="space-y-1.5" data-testid="list-view-columns">
              <FieldsListEditor
                variantKey="config"
                schema={body}
                columns={columns}
                allStrings={allStrings}
                objectName={objectName}
                objectFieldsOverride={fields}
                selectedIndex={selectedIndex}
                readOnly={readOnly}
                onPatch={(patch) => {
                  if (isPlainObject(patch.config)) writeBody(patch.config);
                }}
                onSelectionChange={(sel) =>
                  setSelected({ key: target.viewId, index: selectedColumnIndex(sel?.id) })
                }
              />
              {selectedIndex != null && selectedIndex < columns.length && (
                <div className="flex items-center justify-end">
                  <InspectorReorderButtons
                    index={selectedIndex}
                    total={columns.length}
                    disabled={readOnly}
                    onMove={(to) => {
                      const next = [...columns];
                      const [moved] = next.splice(selectedIndex, 1);
                      next.splice(to, 0, moved);
                      writeBody({ ...body, columns: next });
                      setSelected({ key: target.viewId, index: to });
                    }}
                  />
                </div>
              )}
            </div>
            <div className="space-y-1.5 border-t pt-3" data-testid="list-view-filter">
              <Label htmlFor={FILTER_ID} className="text-xs text-muted-foreground">
                {t('engine.studio.inspector.listView.filter', locale)}
              </Label>
              <FilterWidget
                id={FILTER_ID}
                schema={{}}
                value={body.filter}
                readOnly={readOnly}
                context={{ conditionScope: 'none', objectFields: fieldCatalog }}
                onChange={(rules) => {
                  const { filter: _dropped, ...rest } = body;
                  writeBody(Array.isArray(rules) && rules.length > 0 ? { ...rest, filter: rules } : rest);
                }}
              />
            </div>
            <div className="space-y-1.5 border-t pt-3" data-testid="list-view-sort">
              <Label htmlFor={SORT_ID} className="text-xs text-muted-foreground">
                {t('engine.studio.inspector.listView.sort', locale)}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id={SORT_ID}
                    variant="outline"
                    size="sm"
                    disabled={readOnly}
                    className="h-8 w-full justify-between text-xs font-normal"
                    data-testid="list-view-sort-trigger"
                  >
                    <span className="truncate text-left">
                      {sortSummary || (
                        <span className="text-muted-foreground">{t('engine.studio.inspector.listView.addSort', locale)}</span>
                      )}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[440px] max-w-[90vw] p-3">
                  <SortBuilder
                    fields={fields.map((f) => ({ value: f.name, label: f.label }))}
                    value={sort.map((s, i) => ({ id: `${i}`, ...s }))}
                    onChange={(items: SortItem[]) => {
                      // The builder's row `id` is a React key: the spec refuses it on
                      // a sort entry, so only `{ field, order }` is written.
                      const next = items
                        .filter((it) => !!it.field)
                        .map((it) => ({ field: it.field, order: it.order === 'desc' ? 'desc' : 'asc' }) as SortEntry);
                      const { sort: _dropped, ...rest } = body;
                      writeBody(next.length > 0 ? { ...rest, sort: next } : rest);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}
      </div>
    </InspectorShell>
  );
}
