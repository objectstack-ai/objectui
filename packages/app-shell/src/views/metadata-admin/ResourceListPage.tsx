// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * MetadataResourceListPage — generic list of items for a metadata type
 * (Phase 3c).
 *
 * Reads `/meta/:type`, applies registry-driven columns + search +
 * source/overlay filters, and renders an ObjectGrid-like table.
 * Each row links to its EditPage at `./:name?type=…`.
 *
 * No virtualisation in MVP — metadata lists are typically < 200 items
 * per type, well under the threshold where it'd matter.
 */

import * as React from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Search, RefreshCw, AlertTriangle, Lock } from 'lucide-react';
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, cn } from '@object-ui/components';
import { Input } from '@object-ui/components';
import { Badge } from '@object-ui/components';
import { Switch } from '@object-ui/components';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@object-ui/components';
import { Empty, EmptyTitle, EmptyDescription, EmptyValue } from '@object-ui/components';
import { PageShell, WritabilityBadge } from './PageShell.js';
import { PageHeader } from '../../layout/PageHeader.js';
import { useInSetupApp } from '../../console/setupApp.js';
import { getIcon } from '../../utils/getIcon.js';
import { MetadataTypeActions } from './MetadataTypeActions.js';
import { CreatePackageDialog } from './PackagesPage.js';
import {
  useMetadataClient,
  useMetadataTypes,
  matchesQuery,
  type RichMetadataTypeEntry,
} from './useMetadata.js';
import {
  getMetadataResource,
  resolveResourceConfig,
} from './registry.js';
import { t, tFormat, translateMetadataType, useMetadataLocale } from './i18n.js';
import { buildPackageScopeOptions } from './package-scope.js';
import { ENVIRONMENT_SCOPE_QUERY, isEnvironmentScope, useWalledCatalogReadOnly } from './catalog-scope.js';
import {
  audienceAnchorsOf,
  hasCatalogActivation,
  isCatalogItemActive,
  readCatalogActivation,
  writeCatalogActivation,
  type CatalogActivation,
} from './catalog-activation.js';
import { useCanAuthorMetadata } from '../../hooks/useCanAuthorMetadata.js';
import { postureHasOrgWall, useTenancyPosture } from '../../hooks/useTenancyPosture.js';

export interface MetadataResourceListPageProps {
  type?: string;
}

type ItemRow = {
  /** Raw row from server — may be wrapped in `{ item, source, … }`. */
  raw: any;
  /** Flattened item content for display. */
  item: Record<string, unknown>;
  /**
   * Provenance classification derived from `_packageId` tag:
   *   - 'artifact' = shipped by a real code package
   *   - 'runtime'  = authored at runtime (DB-only, no packageId or sentinel)
   *
   * Server may also pre-classify via a top-level `source` field
   * ('code' / 'overlay' / 'effective'); we honor that when present
   * and fall back to packageId-derived inference otherwise.
   */
  source: 'artifact' | 'runtime';
  /**
   * Load-time Zod validation result attached by the framework
   * (`_diagnostics` on getMetaItems items). Undefined for types
   * without a registered schema.
   */
  diagnostics?: {
    valid: boolean;
    errors?: Array<{ path: string; message: string; code?: string }>;
    warnings?: Array<{ path: string; message: string }>;
  };
};

/**
 * Derive provenance from item._packageId. The `loadMetaFromDb` path
 * tags objects with the synthetic packageId 'sys_metadata' (see
 * framework protocol.ts:3092); treat that sentinel as runtime-authored.
 */
function classifyProvenance(item: Record<string, unknown>, rawSource?: string): 'artifact' | 'runtime' {
  if (rawSource === 'overlay' || rawSource === 'runtime') return 'runtime';
  if (rawSource === 'code' || rawSource === 'artifact') return 'artifact';
  const pkg = item._packageId as string | undefined;
  if (!pkg || pkg === 'sys_metadata') return 'runtime';
  return 'artifact';
}

export function MetadataResourceListPage({ type: typeProp }: MetadataResourceListPageProps) {
  const params = useParams<{ appName?: string; type?: string }>();
  const type = typeProp ?? params.type ?? '';

  if (type === 'package') {
    const appName = params.appName ?? 'studio';
    return <Navigate to={`/apps/${appName}/component/developer/packages`} replace />;
  }

  // If a fully custom ListPage is registered, render it and bail.
  // Done before any other hooks so hook count stays stable across type
  // switches between custom and default list pages.
  const customConfig = getMetadataResource(type);
  if (customConfig?.ListPage) {
    const Custom = customConfig.ListPage;
    return <Custom type={type} />;
  }

  return <DefaultMetadataList type={type} appName={params.appName} />;
}

function DefaultMetadataList({ type, appName }: { type: string; appName?: string }) {
  const navigate = useNavigate();
  const client = useMetadataClient();
  const { entries: typesEntries } = useMetadataTypes(client);
  const entry: RichMetadataTypeEntry | undefined = typesEntries.find((t) => t.type === type);
  const config = resolveResourceConfig(type, entry);

  const [items, setItems] = React.useState<ItemRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [sourceFilter, setSourceFilter] = React.useState<string>('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = React.useState(0);
  // objectui#7611 — the ENVIRONMENT scope (`?scope=environment`): the Setup
  // catalog. The list is the registry's whole list for the type, not one
  // project package's slice, and it is re-gated for Setup — see
  // `catalog-scope.ts`.
  const envScope = isEnvironmentScope(searchParams);
  const canAuthor = useCanAuthorMetadata();
  const posture = useTenancyPosture();
  // objectui#12606 — under the Setup app the page draws Setup's one page
  // header: no "All Metadata Types" breadcrumb, no stat tiles, the count in
  // the description. Read off the route's `:appName`; the same page anywhere
  // else (the directory, Studio's "Open in Setup" target) keeps its shell.
  const inSetup = useInSetupApp();
  // objectui#12183 — under a wall the security catalog is the platform
  // operator's: the server refuses this caller every write of the type,
  // whatever it holds (`catalog-scope.ts`). Not keyed on the scope: the server's
  // verdict has none, and the package door is refused the same way.
  const walled = useWalledCatalogReadOnly(type);
  const activation = envScope && hasCatalogActivation(type);
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');
  // The activation ledger's answer for the switch column, with the names the
  // door refuses to switch (`catalog-activation.ts`). `null` while unread,
  // `'error'` when the read was refused or failed.
  const [ledger, setLedger] = React.useState<CatalogLedger | 'error' | null>(null);
  const [switching, setSwitching] = React.useState<string | null>(null);
  const [switchError, setSwitchError] = React.useState<string | null>(null);

  // Studio is scoped to a single *project* package at a time. Load the
  // installed packages and keep only project-scoped ones — anything not
  // tagged `system`/`cloud` (a missing scope counts as project). System
  // metadata therefore never leaks: the scope selector never offers a
  // system package and an unscoped view is not allowed.
  const [projectPackages, setProjectPackages] = React.useState<
    { id: string; name: string }[] | null
  >(null);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await client.list<any>('package');
        if (cancelled) return;
        setProjectPackages(buildPackageScopeOptions(list));
      } catch {
        if (!cancelled) setProjectPackages([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client]);

  // Resolve the CURRENT APP's package so the list defaults to the scope the
  // admin is actually working in (e.g. opening Pages from the Showcase app
  // shows that app's pages, not an alphabetically-first empty template). The
  // route segment may be the app `name` or its package id, so match both.
  const [appPackage, setAppPackage] = React.useState<string | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    if (!appName) { setAppPackage(null); return; }
    (async () => {
      try {
        const apps = await client.list<any>('app');
        if (cancelled) return;
        const match = (apps ?? [])
          .map((raw) => (raw && typeof raw === 'object' && 'item' in raw ? (raw as any).item : raw))
          .find((a: any) => a?.name === appName || a?._packageId === appName);
        setAppPackage((match as any)?._packageId ?? null);
      } catch {
        if (!cancelled) setAppPackage(null);
      }
    })();
    return () => { cancelled = true; };
  }, [client, appName]);

  // Resolve the active package from the URL, validated against the project
  // package set. `null` while packages are still loading (fail closed).
  const urlPackage = searchParams.get('package');
  const activePackage = React.useMemo(() => {
    if (!projectPackages) return null;
    if (urlPackage && projectPackages.some((p) => p.id === urlPackage)) return urlPackage;
    if (projectPackages.length === 0) return null;
    // No valid URL package: prefer the CURRENT APP's package (the scope the
    // admin is working in) when it's a valid project package — this is what
    // makes "Pages" in the Showcase app default to Showcase's pages.
    if (appPackage && projectPackages.some((p) => p.id === appPackage)) return appPackage;
    // Otherwise prefer the project package that actually OWNS rows of this
    // metadata type, so the list never opens empty on an alphabetically-first
    // package that happens to own none. Falls back to the first package.
    const counts = new Map<string, number>();
    for (const row of items) {
      const pkg = (row.item as any)?._packageId;
      if (pkg && pkg !== 'sys_metadata') counts.set(pkg, (counts.get(pkg) ?? 0) + 1);
    }
    let best: string | null = null;
    let bestN = 0;
    for (const p of projectPackages) {
      const n = counts.get(p.id) ?? 0;
      if (n > bestN) { best = p.id; bestN = n; }
    }
    return best ?? projectPackages[0]?.id ?? null;
  }, [projectPackages, urlPackage, items, appPackage]);

  // Repair `?package=` so the sidebar selector, deep-links and create/edit
  // navigation all agree on the active scope. Runs once packages resolve
  // and the URL holds no valid project package.
  React.useEffect(() => {
    // The environment scope lists every package's items: no package to repair.
    if (envScope) return;
    if (!projectPackages || projectPackages.length === 0) return;
    if (urlPackage && projectPackages.some((p) => p.id === urlPackage)) return;
    // If the current app's package is known we can repair immediately; otherwise
    // wait for rows so `activePackage` can resolve to the package that owns this
    // type (repairing to the alphabetical-first package before then would lock
    // the list onto an empty scope).
    const appPkgValid = !!(appPackage && projectPackages.some((p) => p.id === appPackage));
    if (!appPkgValid && items.length === 0) return;
    if (!activePackage) return;
    const next = new URLSearchParams(searchParams);
    next.set('package', activePackage);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectPackages, urlPackage, items, activePackage, appPackage]);

  // Carry the active package into create/edit navigation as `?package=` so
  // the editor binds newly-saved rows to that software package.
  const pkgSuffix = envScope
    ? `?${ENVIRONMENT_SCOPE_QUERY}`
    : activePackage
      ? `?package=${encodeURIComponent(activePackage)}`
      : '';

  // ADR-0070 D3 — never start a create that would orphan the item. When a real
  // writable base exists, create into it (defaulting away from the Local/null
  // scope); when none exists yet, prompt to create a base first.
  const [showCreateBase, setShowCreateBase] = React.useState(false);
  const handleCreate = React.useCallback(() => {
    // An environment-authored item belongs to no package (ADR-0131 D3).
    if (envScope) {
      navigate(`./new?${ENVIRONMENT_SCOPE_QUERY}`);
      return;
    }
    const bases = projectPackages ?? [];
    if (projectPackages !== null && bases.length === 0) {
      setShowCreateBase(true);
      return;
    }
    if (bases.length > 0 && !activePackage) {
      navigate(`./new?package=${encodeURIComponent(bases[0].id)}`);
      return;
    }
    navigate(`./new${pkgSuffix}`);
  }, [projectPackages, activePackage, pkgSuffix, navigate, envScope]);

  // objectui#7611 — the activation state the switch column shows. Re-read on
  // the list's own refresh, never on an unrelated render. The anchors arrive
  // with the states, so no anchor is ever drawn as a live switch.
  React.useEffect(() => {
    if (!activation) {
      setLedger(null);
      return;
    }
    const controller = new AbortController();
    Promise.all([readCatalogActivation(type, controller.signal), audienceAnchorsOf(type)])
      .then(([states, anchors]) => {
        if (!controller.signal.aborted) setLedger({ states, anchors });
      })
      .catch(() => {
        if (!controller.signal.aborted) setLedger('error');
      });
    return () => controller.abort();
  }, [activation, type, refreshKey]);

  const toggleActive = React.useCallback(
    async (itemName: string, enabled: boolean) => {
      setSwitching(itemName);
      setSwitchError(null);
      try {
        const now = await writeCatalogActivation(type, itemName, !enabled);
        setLedger((prev) => {
          if (!prev || prev === 'error') return prev;
          const states = new Map(prev.states);
          states.set(itemName, now);
          return { ...prev, states };
        });
      } catch (err: any) {
        setSwitchError(err?.message ?? String(err));
      } finally {
        setSwitching(null);
      }
    },
    [type],
  );

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const list = await client.list<any>(type);
        if (cancelled) return;
        const rows: ItemRow[] = (list ?? []).map((raw) => {
          const item = (raw && typeof raw === 'object' && 'item' in raw ? raw.item : raw) ?? {};
          // _diagnostics may live on the unwrapped item (default) or on the
          // outer envelope when callers reshape rows; check both.
          const diagnostics =
            (item as any)?._diagnostics ?? (raw as any)?._diagnostics ?? undefined;
          return {
            raw,
            item,
            source: classifyProvenance(item, raw?.source),
            diagnostics,
          };
        });
        setItems(rows);
        setLoading(false);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? String(err));
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, type, refreshKey]);

  const searchableFields = config.searchableFields ?? ['name', 'label', 'description'];
  // Structural scope — every row this package could ever show for this
  // type, before the user's search box / source dropdown narrow it. Header
  // counts, the source filter, and the empty-state copy all key off this so
  // a package with zero items of a type reads as "暂无…条目", not "no match
  // for an (empty) query" just because *other* packages own rows of the
  // same type (server list() is not package-scoped; we scope client-side).
  const scopedItems = React.useMemo(
    () =>
      items.filter((row) => {
        // Per-type hide hook (e.g. `view` drops the bare aggregated
        // container the framework keeps for runtime dual-read).
        if (config.listFilter && !config.listFilter(row.item)) return false;
        // objectui#7611 — the environment scope is the whole registry list.
        if (envScope) return true;
        // Mandatory project-package scope: show nothing until a concrete
        // project package is active, then only rows tagged with it. The
        // 'sys_metadata' sentinel and untagged rows never match.
        if (!activePackage) return false;
        const pkg = (row.item as any)?._packageId;
        // Only rows tagged with the active writable base match. Untagged /
        // `sys_metadata`-provenance legacy rows have no scope of their own
        // (ADR-0070 D5 — the package-less "Local / Custom" scope is removed).
        return pkg === activePackage;
      }),
    [items, activePackage, config, envScope],
  );

  // User-driven filters (search query + source provenance) on top of scope.
  const filtered = scopedItems.filter((row) => {
    if (!matchesQuery(row.item, query, searchableFields)) return false;
    if (sourceFilter !== 'all' && row.source !== sourceFilter) return false;
    if (activation && statusFilter !== 'all') {
      // Only a KNOWN state filters: while the ledger is unread or unreadable,
      // no item is either active or inactive to this filter.
      if (!ledger || ledger === 'error') return false;
      if ((statusFilter === 'active') !== isCatalogItemActive(ledger.states, String(row.item.name ?? ''))) return false;
    }
    return true;
  });

  // Compute source + invalid counts for filter / header stats.
  const sourceCounts = React.useMemo(() => {
    const c = { all: scopedItems.length, artifact: 0, runtime: 0 };
    for (const r of scopedItems) {
      c[r.source]++;
    }
    return c;
  }, [scopedItems]);

  const invalidCount = React.useMemo(
    () => scopedItems.filter((r) => r.diagnostics && r.diagnostics.valid === false).length,
    [scopedItems],
  );

  // Items with warnings but no errors — softer, advisory tier. We
  // count rows (not warning instances) for consistency with `invalid`.
  const warnOnlyCount = React.useMemo(
    () =>
      scopedItems.filter(
        (r) =>
          r.diagnostics &&
          r.diagnostics.valid !== false &&
          (r.diagnostics.warnings?.length ?? 0) > 0,
      ).length,
    [scopedItems],
  );

  const columns = config.listColumns ?? defaultColumns(config.primaryKey ?? 'name');
  const locale = useMetadataLocale();
  const typeLabel = translateMetadataType(type, locale, entry?.label ?? type);
  // The type offers SOME runtime write channel (the editors' type tier), and —
  // in the environment scope — the caller holds the capability the metadata
  // door requires. The server refuses either way; this is the half that says
  // so before the click (objectui#7611, the #22621 → A parity gate).
  const typeWritable = !!(entry?.allowEnvironmentOverlay || entry?.allowRuntimeCreate);
  const canCreate = typeWritable && !walled && (!envScope || canAuthor);
  // The wall is the gate to NAME only where the type would otherwise admit a
  // write: a type with no runtime write channel is read-only for the operator
  // too, and its page says nothing about the wall.
  const walledDeciding = walled && typeWritable;
  // Packages load only for the package scope; the environment scope never
  // waits on them.
  const packagesPending = !envScope && projectPackages === null;

  // Localise default column labels — registered columns keep their
  // hand-authored labels (consumers may want bespoke wording).
  const localizeColumnLabel = (col: { key: string; label: string }) => {
    const tryKey = `engine.list.col.${col.key}`;
    const translated = t(tryKey, locale);
    return translated === tryKey ? col.label : translated;
  };

  const refresh = () => setRefreshKey((k) => k + 1);
  const createButton = canCreate && (
    <Button
      size="sm"
      variant={config.createFields ? 'default' : 'outline'}
      onClick={handleCreate}
      title={
        config.createFields
          ? tFormat('engine.list.createHint', locale, { type: typeLabel })
          : undefined
      }
    >
      <Plus className="h-4 w-4 mr-1" />
      {t('engine.list.create', locale)}
    </Button>
  );
  // Declarative type-level actions (GAP-1) scoped to the list toolbar.
  // Per-row (`list_item`) actions are not surfaced here yet — they need the
  // row's recordId from the grid.
  const typeActions = (
    <MetadataTypeActions entry={entry} location="list_toolbar" onAfter={refresh} />
  );

  const body = (
      <div className="p-6 space-y-4">
        <CreatePackageDialog
          open={showCreateBase}
          onOpenChange={setShowCreateBase}
          onCreated={(id) => navigate(`./new?package=${encodeURIComponent(id)}`)}
        />
        {/* Filter row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className={cn('pl-8', inSetup && 'h-8')}
              placeholder={t('engine.list.search', locale)}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            {/* Under Setup the source select is a filter chip (objectui#12606). */}
            <SelectTrigger
              className={inSetup ? 'h-8 w-auto gap-1.5 rounded-full px-3 text-xs' : 'w-[180px]'}
              data-testid="metadata-source-filter"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('engine.list.allSources', locale)} ({sourceCounts.all})</SelectItem>
              <SelectItem value="artifact">{t('engine.list.source.artifact', locale)} ({sourceCounts.artifact})</SelectItem>
              <SelectItem value="runtime">{t('engine.list.source.runtime', locale)} ({sourceCounts.runtime})</SelectItem>
            </SelectContent>
          </Select>
          {activation && (
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger
                className={inSetup ? 'h-8 w-auto gap-1.5 rounded-full px-3 text-xs' : 'w-[150px]'}
                data-testid="catalog-status-filter"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('engine.catalog.status.all', locale)}</SelectItem>
                <SelectItem value="active">{t('engine.catalog.status.active', locale)}</SelectItem>
                <SelectItem value="inactive">{t('engine.catalog.status.inactive', locale)}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* objectui#7611 — the environment scope says WHY a caller cannot
            define here, in the posture's own terms (#22621 → A): under
            `single` the platform administrator defines and an organization
            administrator reads; under a wall the operator defines in Studio
            and tenants assign. objectui#12183 — and under a wall a tenant
            holding the capability is told the same thing, since the capability
            does not admit it there. */}
        {((envScope && !canAuthor) || walledDeciding) && (
          <div
            data-testid="catalog-readonly-reason"
            className="text-xs text-amber-800 border border-amber-300/70 bg-amber-50/70 rounded-md px-3 py-2.5 dark:text-amber-200 dark:border-amber-700/40 dark:bg-amber-950/20 flex items-start gap-2"
          >
            <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              {tFormat(
                postureHasOrgWall(posture) ? 'engine.catalog.readOnly.walled' : 'engine.catalog.readOnly.single',
                locale,
                { type: typeLabel },
              )}
            </span>
          </div>
        )}
        {switchError && (
          <div className="text-xs text-destructive border border-destructive/30 rounded p-2 bg-destructive/5">
            {tFormat('engine.catalog.active.failed', locale, { message: switchError })}
          </div>
        )}

        {/* Body */}
        {(loading || packagesPending) && (
          <div className="text-sm text-muted-foreground">{t('engine.edit.loading', locale)} {type}…</div>
        )}
        {error && (
          <div className="text-sm text-destructive border border-destructive/30 rounded p-3 bg-destructive/5">
            {error}
          </div>
        )}
        {!loading && !error && !envScope && projectPackages !== null && projectPackages.length === 0 && (
          <Empty>
            <EmptyTitle>No project packages installed</EmptyTitle>
            <EmptyDescription>
              Studio only shows metadata that belongs to a project software package.
              Install or create a project package to manage its metadata here.
            </EmptyDescription>
          </Empty>
        )}
        {!loading && !error && !packagesPending && (envScope || (projectPackages?.length ?? 0) > 0) && filtered.length === 0 && (
          <Empty>
            <EmptyTitle>
              {scopedItems.length === 0
                ? tFormat('engine.list.emptyType', locale, { type: typeLabel })
                : tFormat('engine.list.emptyQuery', locale, { query })}
            </EmptyTitle>
            <EmptyDescription>
              {config.emptyStateHint ??
                (canCreate
                  ? tFormat('engine.list.createHint', locale, { type: typeLabel })
                  : t('engine.list.readOnlyHint', locale))}
            </EmptyDescription>
            {scopedItems.length === 0 && canCreate && (
              <div className="mt-4">
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t('engine.list.create', locale)}
                </Button>
              </div>
            )}
          </Empty>
        )}
        {!loading && filtered.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              {/* Under Setup the table reads as the console's record list
                  (objectui#12606): sentence-case headers, the grid's 36px
                  rows, middle-aligned cells. */}
              <thead
                className={
                  inSetup
                    ? 'bg-muted/30 text-xs text-muted-foreground'
                    : 'bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground'
                }
              >
                <tr>
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className={cn('px-3 text-left font-medium', inSetup ? 'h-9 py-0' : 'py-2')}
                      style={c.width ? { width: c.width } : undefined}
                    >
                      {localizeColumnLabel(c)}
                    </th>
                  ))}
                  {activation && (
                    <th className={cn('px-3 text-left font-medium w-[90px]', inSetup ? 'h-9 py-0' : 'py-2')}>{t('engine.catalog.col.active', locale)}</th>
                  )}
                  <th className={cn('px-3 text-right font-medium w-[80px]', inSetup ? 'h-9 py-0' : 'py-2')}>{t('engine.list.col.source', locale)}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((row, i) => {
                  const pk = config.primaryKey ?? 'name';
                  const name = String(row.item[pk] ?? `(unnamed-${i})`);
                  // ADR-0048 — link to this row's OWNING package so the editor
                  // resolves the right item even in the unscoped "all" list
                  // where two packages may ship the same name. Falls back to the
                  // workspace suffix for runtime/overlay-only rows (no real
                  // package, or the `sys_metadata` rehydration sentinel).
                  const rowPkg = (row.item as any)._packageId as string | undefined;
                  // The environment scope keeps its own scope instead: a
                  // catalog name has ONE holder per deployment (ADR-0131), so
                  // the editor resolves it by name alone.
                  const rowEditSuffix = envScope
                    ? pkgSuffix
                    : rowPkg && rowPkg !== 'sys_metadata'
                      ? `?package=${encodeURIComponent(rowPkg)}`
                      : pkgSuffix;
                  const invalid = row.diagnostics?.valid === false;
                  const errorList = row.diagnostics?.errors ?? [];
                  const warnList = (row.diagnostics as any)?.warnings ?? [];
                  const warnOnly = !invalid && warnList.length > 0;
                  const errorTitle = invalid
                    ? errorList
                        .slice(0, 3)
                        .map((e) => `${e.path || '(root)'}: ${e.message}`)
                        .join('\n') +
                      (errorList.length > 3 ? `\n+${errorList.length - 3} more` : '')
                    : warnOnly
                      ? warnList
                          .slice(0, 3)
                          .map((w: any) => `${w.path || '(root)'}: ${w.message}`)
                          .join('\n') +
                        (warnList.length > 3 ? `\n+${warnList.length - 3} more` : '')
                      : '';
                  const cellClass = inSetup ? 'h-9 px-3 py-1.5 align-middle' : 'px-3 py-2 align-top';
                  const sourceDesc =
                    row.source === 'artifact'
                      ? `${t('engine.list.source.artifactDesc', locale)}${row.item._packageId ? ` (${row.item._packageId})` : ''}`
                      : t('engine.list.source.runtimeDesc', locale);
                  return (
                    <tr
                      key={name + i}
                      className={
                        'hover:bg-accent/50 ' +
                        (invalid
                          ? 'bg-destructive/[0.04]'
                          : warnOnly
                            ? 'bg-amber-500/[0.05]'
                            : '')
                      }
                    >
                      {columns.map((c, ci) => {
                        const value = row.item[c.key];
                        const cell = c.render ? c.render(value, row.item) : defaultCell(value);
                        return (
                          <td key={c.key} className={cellClass}>
                            {ci === 0 ? (
                              <span className="inline-flex items-center gap-1.5">
                                {invalid && (
                                  <span
                                    className="inline-flex"
                                    aria-label={t('engine.list.invalidTitle', locale)}
                                    title={`${tFormat('engine.list.invalidCount', locale, { count: errorList.length })}\n${errorTitle}`}
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                                  </span>
                                )}
                                {warnOnly && (
                                  <span
                                    className="inline-flex"
                                    aria-label={t('engine.list.warnTitle', locale)}
                                    title={`${tFormat('engine.list.warnCount', locale, { count: warnList.length })}\n${errorTitle}`}
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                  </span>
                                )}
                                <Link
                                  to={`./${encodeURIComponent(name)}${rowEditSuffix}`}
                                  className="text-primary hover:underline font-mono"
                                >
                                  {cell}
                                </Link>
                              </span>
                            ) : (
                              cell
                            )}
                          </td>
                        );
                      })}
                      {activation && (
                        <td className={cellClass}>
                          <CatalogActiveCell
                            itemName={name}
                            ledger={ledger}
                            canSwitch={canAuthor && !walled}
                            busy={switching === name}
                            locale={locale}
                            onToggle={toggleActive}
                          />
                        </td>
                      )}
                      <td className={cn(cellClass, 'text-right')}>
                        {(row.item._lock as string | undefined) && row.item._lock !== 'none' && (
                          <span
                            className="inline-flex items-center mr-1 text-amber-600 dark:text-amber-400"
                            title={
                              (row.item._lockReason as string | undefined)
                              ?? `_lock=${String(row.item._lock)}`
                            }
                          >
                            <Lock className="h-3 w-3" />
                          </span>
                        )}
                        {inSetup ? (
                          // Under Setup the source is plain text with its
                          // explanation in a tooltip, not a chip on every row
                          // (objectui#12606).
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  className="cursor-help text-xs text-muted-foreground"
                                  data-testid="metadata-row-source"
                                >
                                  {t(`engine.list.source.${row.source}`, locale)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs text-xs">
                                {sourceDesc}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <Badge
                            variant="outline"
                            className={
                              'text-[10px] ' +
                              (row.source === 'artifact'
                                ? 'border-sky-500/50 text-sky-700 dark:text-sky-300'
                                : 'border-emerald-500/50 text-emerald-700 dark:text-emerald-300')
                            }
                            title={sourceDesc}
                          >
                            {t(`engine.list.source.${row.source}`, locale)}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
  );

  // The validation tiers stay counted where the stat tiles went: beside the
  // kind chip under Setup, as tiles elsewhere.
  const diagnosticStats = [
        ...(invalidCount > 0
          ? [
              {
                label: t('engine.list.invalid', locale),
                value: (
                  <span className="inline-flex items-center gap-1 text-destructive">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {invalidCount}
                  </span>
                ),
              },
            ]
          : []),
        ...(warnOnlyCount > 0
          ? [
              {
                label: t('engine.list.warnings', locale),
                value: (
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {warnOnlyCount}
                  </span>
                ),
              },
            ]
          : []),
  ];

  if (inSetup) {
    const count = scopedItems.length;
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <PageHeader
          title={typeLabel}
          // `createElement`, not a JSX tag: the looked-up icon is a value
          // (the convention ObjectView set).
          icon={React.createElement(getIcon(config.iconName ?? 'layers'), { className: 'h-4 w-4' })}
          badge={
            <span className="inline-flex shrink-0 items-center gap-1.5">
              <WritabilityBadge entry={entry} readOnly={false} locale={locale} />
              {diagnosticStats.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs" title={s.label}>
                  {s.value}
                </span>
              ))}
            </span>
          }
          subtitle={tFormat(count === 1 ? 'engine.list.itemCountOne' : 'engine.list.itemCount', locale, { count })}
          refresh={{ onRefresh: refresh, label: t('engine.list.refresh', locale), busy: loading }}
          actions={
            <>
              {typeActions}
              {createButton}
            </>
          }
          data-testid="metadata-list-setup-header"
        />
        <div className="flex-1 overflow-auto">{body}</div>
      </div>
    );
  }

  return (
    <PageShell
      entry={entry ?? { type, label: type }}
      stats={[
        { label: t('engine.list.items', locale), value: scopedItems.length },
        { label: t('engine.list.filtered', locale), value: filtered.length },
        ...diagnosticStats,
      ]}
      actions={
        <>
          {typeActions}
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            title={t('engine.list.refresh', locale)}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {createButton}
        </>
      }
    >
      {body}
    </PageShell>
  );
}

/** The activation ledger's states for a type, and the names its door refuses. */
interface CatalogLedger {
  states: CatalogActivation;
  anchors: ReadonlySet<string>;
}

/**
 * objectui#7611 — one item's active switch in the environment scope, showing
 * the activation ledger's state (see `catalog-activation.ts`). Its non-switch
 * states are each said, never rendered as a guessed "on": the state is still
 * loading, or the read failed. An audience anchor shows its state on a
 * disabled switch with the reason, because the door refuses to switch it.
 */
function CatalogActiveCell({
  itemName,
  ledger,
  canSwitch,
  busy,
  locale,
  onToggle,
}: {
  itemName: string;
  ledger: CatalogLedger | 'error' | null;
  canSwitch: boolean;
  busy: boolean;
  locale: string;
  onToggle: (itemName: string, enabled: boolean) => void;
}) {
  if (ledger === null) return <span className="text-xs text-muted-foreground">…</span>;
  if (ledger === 'error') {
    return (
      <span className="text-xs text-muted-foreground" title={t('engine.catalog.active.unknown', locale)}>
        ?
      </span>
    );
  }
  const enabled = isCatalogItemActive(ledger.states, itemName);
  const anchor = ledger.anchors.has(itemName);
  // A switch the caller cannot use states the state, and offers no click; the
  // page's read-only reason says why.
  const label = anchor
    ? t('engine.catalog.active.anchor', locale)
    : canSwitch
      ? t(enabled ? 'engine.catalog.active.on' : 'engine.catalog.active.off', locale)
      : t(enabled ? 'engine.catalog.status.active' : 'engine.catalog.status.inactive', locale);
  return (
    <span className="inline-flex" title={label}>
      <Switch
        checked={enabled}
        disabled={anchor || !canSwitch || busy}
        onCheckedChange={() => onToggle(itemName, enabled)}
        aria-label={label}
        data-testid={`catalog-active-${itemName}`}
      />
    </span>
  );
}

function defaultColumns(primaryKey: string): NonNullable<import('./registry.js').MetadataResourceConfig['listColumns']> {
  return [
    { key: primaryKey, label: primaryKey, width: '30%' },
    { key: 'label', label: 'Label', width: '30%' },
    { key: 'description', label: 'Description' },
  ];
}

function defaultCell(value: unknown): React.ReactNode {
  if (value == null || value === '') {
    return <EmptyValue />;
  }
  if (typeof value === 'boolean') return value ? '✓' : '✗';
  if (typeof value === 'object') {
    try {
      return (
        <code className="font-mono text-xs">
          {JSON.stringify(value).slice(0, 60)}
        </code>
      );
    } catch {
      return String(value);
    }
  }
  return String(value);
}
