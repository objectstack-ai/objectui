// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * PackagesPage — the package management entry point for Studio.
 *
 * Studio previously exposed packages only through the sidebar `active_package`
 * *filter* dropdown; there was no surface to see all packages, create one, or
 * act on one (publish / revert / enable / disable). This page fills that gap.
 *
 * It is the authoring home for the Studio → package → publish workflow:
 *   1. Create a package (POST /api/v1/packages with a minimal manifest).
 *   2. Author metadata bound to it (via the sidebar scope + ResourceEditPage).
 *   3. Publish it (POST /api/v1/packages/:id/publish).
 *
 * Backed entirely by the existing `/api/v1/packages` REST surface
 * (see framework `http-dispatcher.handlePackages`).
 */

import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Package as PackageIcon,
  Plus,
  RefreshCw,
  Search,
  Upload,
  Download,
  FileUp,
  Undo2,
  Power,
  PowerOff,
  ExternalLink,
  AlertTriangle,
  Trash2,
  Copy,
  Inbox,
  Pencil,
  Eye,
} from 'lucide-react';
import {
  Button,
  Input,
  Badge,
  Switch,
  Label,
  Separator,
  Skeleton,
  Empty,
  EmptyTitle,
  EmptyDescription,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  RadioGroup,
  RadioGroupItem,
} from '@object-ui/components';
import { useMetadataLocale, t, tFormat } from './i18n.js';
import { useMetadataClient } from './useMetadata.js';
import { PackageFormDialog } from './PackageFormDialog.js';
import { errorCodeIs } from '@object-ui/types';
import { readEnvelopeFailureText } from '../../utils/apiErrorEnvelope.js';
import { duplicatePackage, PACKAGE_ID_RE } from '../studio-design/packages-io.js';
import { PackageIdInput } from '../studio-design/PackageIdInput.js';

/* -------------------------------------------------------------------------- */
/* Types + API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The subset of a package manifest this admin LIST renders, kept open.
 *
 * Named `PackageManifestRow`, not `PackageManifest`, and deliberately NOT
 * derived (objectstack#4115). `@objectstack/spec/cloud` owns `PackageManifest`
 * — the full authored manifest, with `defaultDatasource`, `type`, `scope`,
 * `dependencies`, `contributes`, `capabilities`, `sandboxing` and ~30 more keys
 * required or modelled. This page reads whatever `/api/v1/packages` happens to
 * return, from runtimes of different vintages, and renders six columns from it;
 * every key is optional here because an older control plane really does omit
 * them, and the index signature is load-bearing — it lets a row flow into the
 * spec-driven `PackageFormDialog` (which types the manifest as a loose record)
 * without a cast, and preserves keys this page does not render.
 *
 * So this is a lenient READ PROJECTION over the spec's manifest, not a second
 * definition of it: it must stay assignable-from anything the wire sends, which
 * is the opposite of what the spec type is for. `__tests__/spec-symbol-parity.test.ts`
 * pins that the spec does not own the `…Row` name and that the projection's keys
 * are a subset of the spec manifest's, so a key invented here fails loudly.
 */
export interface PackageManifestRow {
  id: string;
  name?: string;
  version?: string;
  type?: string;
  scope?: 'cloud' | 'system' | 'project';
  description?: string;
  [key: string]: unknown;
}

/**
 * One installed-package row, as `/api/v1/packages` returns it.
 *
 * Named `InstalledPackageRow` for the same reason: the spec's
 * `InstalledPackage` (`@objectstack/spec/kernel`) requires `manifest`,
 * `status` and `enabled`, types `manifest` as the full spec `PackageManifest`,
 * and adds `installedAt`, `updatedAt`, `installedVersion`, `previousVersion`,
 * `settings`, `upgradeHistory` and `registeredNamespaces`. This row is the
 * lenient projection of it that the list actually consumes.
 */
export interface InstalledPackageRow {
  manifest: PackageManifestRow;
  status?: string;
  enabled?: boolean;
  statusChangedAt?: string;
  errorMessage?: string;
}

const API = '/api/v1/packages';

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { Accept: 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  const text = await res.text();
  const payload = text ? JSON.parse(text) : null;
  if (!res.ok || payload?.success === false) {
    // The ADR-0112 envelope first, by the ONE shared rule — a producer-marked
    // `error.userMessage` outranks the diagnostic `error.message`, and
    // `error.code` rides along behind whichever won. This helper used to read
    // `error.message` and stop, so a marked sentence arrived on the wire (both
    // doors serving these package routes emit the channel) and had nowhere to
    // appear. See {@link readEnvelopeFailureText}.
    //
    // The two rungs BELOW it stay, and stay here rather than moving into the
    // shared reader: they are not the ADR-0112 envelope. A bare-string `error`
    // and a top-level `message` are older runtimes' shapes, live for this page
    // and not for the Studio readers, and folding them in would have handed
    // every other consumer of the rule a tolerant dialect it never asked for.
    const msg =
      readEnvelopeFailureText(payload) ||
      payload?.error ||
      payload?.message ||
      `Request failed (${res.status})`;
    throw new Error(typeof msg === 'string' ? msg : `Request failed (${res.status})`);
  }
  // Runtime wraps successful payloads in { data, ... } or returns the object directly.
  return (payload?.data ?? payload) as T;
}

/* -------------------------------------------------------------------------- */
/* Scope badge                                                                 */
/* -------------------------------------------------------------------------- */

function ScopeBadge({ scope }: { scope?: string }) {
  const locale = useMetadataLocale();
  // Writability semantics, aligned with the builder (studio-design/packages-io):
  // a SCOPE-LESS entry is a database base package (writable — authoring lives
  // there), while `project` marks a read-only code package. Defaulting the
  // missing scope to 'project' used to render both with the same badge, which
  // contradicted the builder's 可写/只读 labeling for the very same package.
  if (!scope) {
    return (
      <Badge className="bg-emerald-400/15 text-emerald-600 hover:bg-emerald-400/15 dark:text-emerald-300">
        {t('engine.packages.scope.writable', locale)}
      </Badge>
    );
  }
  const variant =
    scope === 'project' ? 'default' : scope === 'system' ? 'secondary' : 'outline';
  const labelKey =
    scope === 'project'
      ? 'engine.packages.scope.project'
      : scope === 'system'
        ? 'engine.packages.scope.system'
        : scope === 'cloud'
          ? 'engine.packages.scope.cloud'
          : '';
  return <Badge variant={variant as any}>{labelKey ? t(labelKey, locale) : scope}</Badge>;
}

function StatusBadge({ pkg }: { pkg: InstalledPackageRow }) {
  const locale = useMetadataLocale();
  const enabled = pkg.enabled !== false && pkg.status !== 'disabled';
  return (
    <Badge variant={enabled ? ('default' as any) : ('outline' as any)}>
      {enabled ? t('engine.packages.status.enabled', locale) : t('engine.packages.status.disabled', locale)}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/* Create-package dialog                                                       */
/* -------------------------------------------------------------------------- */

/**
 * CreatePackageDialog — thin wrapper over the spec-driven {@link PackageFormDialog}.
 * Kept as a named export so existing call sites (ResourceListPage, the Studio
 * package switcher) don't change. The form fields + validation now come from
 * the manifest spec (`package-schema`), not a hand-written field list.
 */
export function CreatePackageDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (id: string) => void;
}) {
  return (
    <PackageFormDialog
      mode="create"
      open={open}
      onOpenChange={onOpenChange}
      onSaved={(r) => onCreated(r.id)}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Detail sheet — manifest + lifecycle actions                                 */
/* -------------------------------------------------------------------------- */

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right break-all">{children}</span>
    </div>
  );
}

/**
 * EditPackageDialog — thin wrapper over the spec-driven {@link PackageFormDialog}
 * in `edit` mode. The manifest form locks `id` / `type` / `namespace` / scope
 * as immutable and submits only name / description / version — all the REST
 * `PATCH /api/v1/packages/:id` persists. Kept as a named export so existing
 * call sites don't change.
 */
export function EditPackageDialog({
  pkg,
  open,
  onOpenChange,
  onSaved,
}: {
  pkg: InstalledPackageRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: (updated: InstalledPackageRow) => void;
}) {
  return (
    <PackageFormDialog
      mode="edit"
      open={open}
      onOpenChange={onOpenChange}
      manifest={pkg?.manifest ?? null}
      onSaved={(r) => onSaved((r.package as unknown as InstalledPackageRow) ?? (pkg as InstalledPackageRow))}
    />
  );
}

/**
 * What *Delete app* removes (ADR-0070 D4, Q3). `structure` removes the
 * package's metadata and keeps the object tables with their records
 * (`?keepData=true`); `all` also drops those tables. `''` = not chosen yet:
 * the dialog has no default, so the author always picks one.
 */
type DeleteMode = '' | 'structure' | 'all';

export function PackageDetailSheet({
  pkg,
  appBase,
  open,
  onOpenChange,
  onChanged,
}: {
  pkg: InstalledPackageRow | null;
  /** Base for metadata-browse / draft-review links. Omit (e.g. in Studio, which
   *  has no console app context) to hide those links; every lifecycle action
   *  still works without it. */
  appBase?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onChanged: () => void;
}) {
  const locale = useMetadataLocale();
  // `ce986aafc` — the console's metadata client, for the ONE action on this
  // sheet that must report: "publish drafts" promotes metadata, and the runtime
  // authoring gate's findings for those promotions ride the response. This hook
  // is where the advisory sink is wired (`useMetadataClient` → the toast
  // renderer), so a call made through it reports and a call made through the
  // page-private `apiJson` cannot. The other lifecycle actions on this sheet
  // write no metadata and stay on `apiJson`.
  const client = useMetadataClient();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  // ADR-0033 — pending DRAFT items bound to this package. AI-authored metadata
  // lands as drafts that the active-only browsers hide, so without this the
  // package looks empty right after a build. We list them here with a link to
  // the existing per-item review/diff (?review=1) so the user can publish them.
  const [drafts, setDrafts] = React.useState<Array<{ type: string; name: string }> | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [viewOpen, setViewOpen] = React.useState(false);
  // objectui#11784 — the three confirmations this sheet asks are in-app, never
  // `window.confirm` / `window.prompt`: those are blocked or auto-answered in
  // an embedded frame, and the old delete chained two confirms where the
  // second one's Cancel still deleted.
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteMode, setDeleteMode] = React.useState<DeleteMode>('');
  const [deleteTyped, setDeleteTyped] = React.useState('');
  const [discardOpen, setDiscardOpen] = React.useState(false);
  const [dupOpen, setDupOpen] = React.useState(false);
  const [dupName, setDupName] = React.useState('');
  const [dupId, setDupId] = React.useState('');
  const fieldId = React.useId();

  React.useEffect(() => {
    setMsg(null);
    setBusy(null);
    setDeleteOpen(false);
    setDiscardOpen(false);
    setDupOpen(false);
  }, [pkg?.manifest.id]);

  React.useEffect(() => {
    const pid = pkg?.manifest.id;
    if (!open || !pid) {
      setDrafts(null);
      return;
    }
    let cancelled = false;
    apiJson<{ drafts?: Array<{ type: string; name: string }> }>(
      `/api/v1/meta/_drafts?packageId=${encodeURIComponent(pid)}`,
    )
      .then((r) => {
        if (!cancelled) setDrafts(r?.drafts ?? []);
      })
      .catch(() => {
        if (!cancelled) setDrafts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, pkg?.manifest.id]);

  if (!pkg) return null;
  const id = pkg.manifest.id;
  const enabled = pkg.enabled !== false && pkg.status !== 'disabled';
  const isKernel = pkg.manifest.scope === 'system' || pkg.manifest.scope === 'cloud';
  // The name the delete dialog asks the author to type: the one the sheet's
  // title shows.
  const displayName = pkg.manifest.name || id;
  const deleteArmed = deleteMode !== '' && deleteTyped.trim() === displayName.trim();
  // The landing's duplicate form's own rule (`PACKAGE_ID_RE`), not a second one.
  const dupArmed = dupName.trim().length > 0 && PACKAGE_ID_RE.test(dupId.trim());

  async function run(action: string, fn: () => Promise<any>, okText: string) {
    setBusy(action);
    setMsg(null);
    try {
      await fn();
      setMsg({ kind: 'ok', text: okText });
      onChanged();
    } catch (e: any) {
      setMsg({ kind: 'err', text: e?.message ?? t('engine.packages.detail.actionFailed', locale) });
    } finally {
      setBusy(null);
    }
  }

  const publish = () =>
    run(
      'publish',
      () =>
        apiJson(`${API}/${encodeURIComponent(id)}/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }).then((r: any) => {
          if (r && r.success === false) {
            const n = r.validationErrors?.length ?? 0;
            throw new Error(
              n
                ? tFormat('engine.packages.detail.publishBlocked', locale, { count: n })
                : r.validationErrors?.[0]?.message || t('engine.packages.detail.nothingToPublish', locale),
            );
          }
          return r;
        }),
      t('engine.packages.detail.published', locale),
    );

  // ADR-0033 — publish every pending draft of this app in one shot, then
  // refresh the pending list (it should now be empty). Distinct from the
  // registry-based `publish` above; this hits `/publish-drafts`.
  //
  // `ce986aafc` — through `MetadataClient`, not `apiJson`. This promotes
  // metadata, so the runtime authoring gate grades it and answers its findings
  // on each `published[]` element (objectstack#9343); the client is the seam
  // that reports them to the author. `apiJson` could not — and the response
  // type declared here could not even hold them: it listed the two counts and
  // `failed[]`, with no `published[]` at all. The declared shape now comes from
  // the spec, through the client's return type.
  const publishDrafts = () =>
    run(
      'publish-drafts',
      async () => {
        const r = await client.publishPackageDrafts(id).catch((e: unknown) => {
          // The ADR-0112 rule `36fc74629` landed on this page: a
          // producer-marked `error.userMessage` outranks the diagnostic
          // `error.message`. `MetadataClient` raises with the diagnostic and
          // keeps the body, so the marked sentence is re-read here rather
          // than lost on the way through the seam.
          const marked = readEnvelopeFailureText((e as { body?: unknown } | null)?.body);
          throw marked ? new Error(marked) : e;
        });
        if ((r as { success?: boolean }).success === false) {
          // Preserves what `apiJson` did for this call: a batch that did not
          // publish is an error on this surface, read through the same
          // envelope ladder. The status is no longer in hand — a non-2xx
          // threw above — so the last rung is a sentence, not "(200)".
          throw new Error(
            readEnvelopeFailureText(r) ||
              (typeof r.error === 'string' ? r.error : '') ||
              (typeof r.message === 'string' ? r.message : '') ||
              t('engine.packages.detail.actionFailed', locale),
          );
        }
        try {
          const fresh = await apiJson<{ drafts?: Array<{ type: string; name: string }> }>(
            `/api/v1/meta/_drafts?packageId=${encodeURIComponent(id)}`,
          );
          setDrafts(fresh?.drafts ?? []);
        } catch {
          setDrafts([]);
        }
        if (r?.failedCount) {
          // framework 15.1+ (ADR-0067 D2): the batch is all-or-nothing — a
          // failure means NOTHING landed and `failed[]` marks the rolled-back
          // drafts `batch_aborted`, with the causal item carrying the real
          // error. Say "rolled back because X", not "{n} failed" (which reads
          // as a partial publish that no longer exists).
          const failedList = Array.isArray(r.failed) ? r.failed : [];
          const causal = failedList.find((f) => !errorCodeIs(f, 'BATCH_ABORTED') && f?.error);
          if (failedList.some((f) => errorCodeIs(f, 'BATCH_ABORTED'))) {
            throw new Error(tFormat('engine.packages.detail.publishDraftsRolledBack', locale, {
              cause: causal ? `${causal.type ?? '?'}/${causal.name ?? '?'}: ${causal.error}` : String(r.failedCount),
            }));
          }
          // pre-15.1 server — genuine partial publish.
          throw new Error(tFormat('engine.packages.detail.publishDraftsPartial', locale, {
            published: r.publishedCount ?? 0,
            failed: r.failedCount,
          }));
        }
        return r;
      },
      t('engine.packages.detail.publishDraftsOk', locale),
    );

  const revert = () =>
    run(
      'revert',
      () => apiJson(`${API}/${encodeURIComponent(id)}/revert`, { method: 'POST' }),
      t('engine.packages.detail.reverted', locale),
    );

  // ADR-0033 — discard every pending draft of this app in one shot, reverting
  // it to the last published baseline. Published metadata and data are
  // untouched, but the drafts are gone for good, so the *Discard changes*
  // button opens a confirmation that names the count (objectui#11784) and only
  // its confirm runs this. Distinct from the metadata-service `/revert` above —
  // this hits the robust `/discard-drafts` (sys_metadata) path.
  const discardDrafts = () =>
    run(
      'discard-drafts',
      () =>
        apiJson<{ discardedCount?: number; failedCount?: number }>(
          `${API}/${encodeURIComponent(id)}/discard-drafts`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) },
        ).then(async (r) => {
          try {
            const fresh = await apiJson<{ drafts?: Array<{ type: string; name: string }> }>(
              `/api/v1/meta/_drafts?packageId=${encodeURIComponent(id)}`,
            );
            setDrafts(fresh?.drafts ?? []);
          } catch {
            setDrafts([]);
          }
          if (r?.failedCount) {
            throw new Error(tFormat('engine.packages.detail.discardDraftsPartial', locale, {
              discarded: r.discardedCount ?? 0,
              failed: r.failedCount,
            }));
          }
          return r;
        }),
      t('engine.packages.detail.discardDraftsOk', locale),
    );

  // ADR-0033 — delete the WHOLE package: every metadata row (active + draft),
  // and — unless the author keeps the data — each object's physical table
  // (DESTRUCTIVE). One in-app dialog (objectui#11784): the author picks
  // *structure only* or *structure and data* explicitly (no default), types the
  // package's name, and only then is the delete armed. Its Cancel deletes
  // nothing. Closes the sheet on success; a failure is shown on the sheet.
  const openDelete = () => {
    setDeleteMode('');
    setDeleteTyped('');
    setDeleteOpen(true);
  };

  const deleteApp = async () => {
    if (!deleteArmed) return;
    // ADR-0070 D4 (Q3) — `?keepData=true` removes the metadata and keeps the
    // object tables with their records; without it the tables are dropped.
    const qs = deleteMode === 'structure' ? '?keepData=true' : '';
    setBusy('delete');
    setMsg(null);
    try {
      await apiJson(`${API}/${encodeURIComponent(id)}${qs}`, { method: 'DELETE' });
      setDeleteOpen(false);
      onChanged();
      onOpenChange(false);
    } catch (e: any) {
      setDeleteOpen(false);
      setMsg({ kind: 'err', text: e?.message ?? t('engine.packages.detail.deleteFailed', locale) });
    } finally {
      setBusy(null);
    }
  };

  // ADR-0070 D4 — duplicate this base into a NEW writable package
  // (re-namespaced). The Studio landing's inline duplicate form, on this sheet
  // (objectui#11784): the same id input (`PackageIdInput`), the same id rule
  // (`PACKAGE_ID_RE`) and the same call (`duplicatePackage`, which also refuses
  // a 200 whose verdict is `success: false`), instead of a `window.prompt`.
  const toggleDuplicate = () => {
    if (dupOpen) {
      setDupOpen(false);
      return;
    }
    setDupName(tFormat('engine.studio.landing.dupDefaultName', locale, { name: displayName }));
    setDupId(`${id}-copy`);
    setDupOpen(true);
  };

  const duplicateApp = async () => {
    const target = dupId.trim();
    const name = dupName.trim();
    if (!name || !PACKAGE_ID_RE.test(target)) return;
    setBusy('duplicate');
    setMsg(null);
    try {
      await duplicatePackage(id, target, name);
      setDupOpen(false);
      setMsg({ kind: 'ok', text: t('engine.packages.detail.duplicated', locale) });
      onChanged();
    } catch (e: unknown) {
      setMsg({
        kind: 'err',
        text: e instanceof Error && e.message ? e.message : t('engine.packages.detail.actionFailed', locale),
      });
    } finally {
      setBusy(null);
    }
  };

  // ADR-0070 D5 — adopt every package-less (loose) item in this env INTO this base.
  const adoptOrphans = async () => {
    const ok = window.confirm(
      tFormat('engine.packages.detail.adoptConfirm', locale, { name: pkg?.manifest.name || id }),
    );
    if (!ok) return;
    setBusy('adopt');
    setMsg(null);
    try {
      await apiJson(`${API}/${encodeURIComponent(id)}/adopt-orphans`, { method: 'POST' });
      setMsg({ kind: 'ok', text: t('engine.packages.detail.adopted', locale) });
      onChanged();
    } catch (e: any) {
      setMsg({ kind: 'err', text: e?.message ?? 'Adopt failed' });
    } finally {
      setBusy(null);
    }
  };

  const toggleEnable = () =>
    run(
      'toggle',
      () =>
        apiJson(`${API}/${encodeURIComponent(id)}/${enabled ? 'disable' : 'enable'}`, {
          method: 'PATCH',
        }),
      enabled ? t('engine.packages.detail.disabled', locale) : t('engine.packages.detail.enabled', locale),
    );

  const exportPkg = () =>
    run(
      'export',
      async () => {
        const manifest = await apiJson<any>(`${API}/${encodeURIComponent(id)}/export`);
        const blob = new Blob([JSON.stringify(manifest, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${id}.package.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      },
      t('engine.packages.detail.exported', locale),
    );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <PackageIcon className="h-4 w-4" />
            {pkg.manifest.name || id}
          </SheetTitle>
          <SheetDescription className="font-mono text-xs">{id}</SheetDescription>
        </SheetHeader>

        <div className="mt-4">
          <DetailRow label={t('engine.packages.col.version', locale)}>{pkg.manifest.version || '—'}</DetailRow>
          <DetailRow label={t('engine.packages.detail.type', locale)}>{pkg.manifest.type || '—'}</DetailRow>
          <DetailRow label={t('engine.packages.col.scope', locale)}>
            <ScopeBadge scope={pkg.manifest.scope} />
          </DetailRow>
          <DetailRow label={t('engine.packages.col.status', locale)}>
            <StatusBadge pkg={pkg} />
          </DetailRow>
          {pkg.manifest.description && (
            <DetailRow label={t('engine.packages.detail.description', locale)}>{pkg.manifest.description}</DetailRow>
          )}
        </div>

        {appBase && (
          <>
            <Separator className="my-4" />
            <Link
              to={`${appBase}/metadata/object?package=${encodeURIComponent(id)}`}
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              onClick={() => onOpenChange(false)}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t('engine.packages.detail.browseMetadata', locale)}
            </Link>
          </>
        )}

        {drafts && drafts.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              {/* A `div`, not a `p` (objectui#11804): the draft-count `Badge`
                  renders a `<div>`, and a `<div>` inside a `<p>` is invalid
                  HTML — React logged "In HTML, <div> cannot be a descendant of
                  <p>" every time a package with pending drafts opened this
                  sheet. Same classes; Tailwind's preflight zeroes a `p`'s
                  margins, so the swap changes no spacing. */}
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('engine.packages.detail.pendingChanges', locale)}
                <Badge variant="secondary">{drafts.length}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('engine.packages.detail.pendingHint', locale)}
              </p>
              {!isKernel && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={publishDrafts} disabled={!!busy}>
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    {busy === 'publish-drafts'
                      ? t('engine.packages.detail.publishing', locale)
                      : tFormat('engine.packages.detail.publishApp', locale, { count: drafts.length })}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDiscardOpen(true)} disabled={!!busy}>
                    <Undo2 className="mr-1.5 h-3.5 w-3.5" />
                    {busy === 'discard-drafts'
                      ? t('engine.packages.detail.discarding', locale)
                      : tFormat('engine.packages.detail.discardChanges', locale, { count: drafts.length })}
                  </Button>
                </div>
              )}
              <ul className="space-y-1">
                {drafts.map((d) =>
                  appBase ? (
                    <li key={`${d.type}/${d.name}`}>
                      <Link
                        to={`${appBase}/metadata/${encodeURIComponent(d.type)}/${encodeURIComponent(d.name)}?review=1`}
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                        onClick={() => onOpenChange(false)}
                      >
                        <FileUp className="h-3.5 w-3.5" />
                        <span className="font-mono text-xs">{d.type}</span>
                        <span className="text-muted-foreground">·</span>
                        {d.name}
                      </Link>
                    </li>
                  ) : (
                    <li key={`${d.type}/${d.name}`} className="inline-flex items-center gap-1.5 text-sm">
                      <FileUp className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-mono text-xs">{d.type}</span>
                      <span className="text-muted-foreground">·</span>
                      {d.name}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </>
        )}

        <Separator className="my-4" />

        {isKernel ? (
          <p className="text-sm text-muted-foreground">
            {t('engine.packages.detail.kernelReadOnly', locale)}
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('engine.packages.detail.actions', locale)}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setViewOpen(true)} disabled={!!busy}>
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                {t('engine.packages.detail.viewInfo', locale)}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)} disabled={!!busy}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                {t('engine.packages.detail.edit', locale)}
              </Button>
              <Button size="sm" onClick={publish} disabled={!!busy}>
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                {busy === 'publish' ? t('engine.packages.detail.publishing', locale) : t('engine.packages.detail.publish', locale)}
              </Button>
              <Button size="sm" variant="outline" onClick={revert} disabled={!!busy}>
                <Undo2 className="mr-1.5 h-3.5 w-3.5" />
                {t('engine.packages.detail.revert', locale)}
              </Button>
              <Button size="sm" variant="outline" onClick={toggleEnable} disabled={!!busy}>
                {enabled ? (
                  <PowerOff className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <Power className="mr-1.5 h-3.5 w-3.5" />
                )}
                {enabled ? t('engine.packages.detail.disable', locale) : t('engine.packages.detail.enable', locale)}
              </Button>
              <Button size="sm" variant="outline" onClick={exportPkg} disabled={!!busy}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                {busy === 'export' ? t('engine.packages.detail.exporting', locale) : t('engine.packages.detail.export', locale)}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={toggleDuplicate}
                disabled={!!busy}
                aria-expanded={dupOpen}
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                {busy === 'duplicate' ? t('engine.packages.detail.duplicating', locale) : t('engine.packages.detail.duplicate', locale)}
              </Button>
              <Button size="sm" variant="outline" onClick={adoptOrphans} disabled={!!busy}>
                <Inbox className="mr-1.5 h-3.5 w-3.5" />
                {busy === 'adopt' ? t('engine.packages.detail.adopting', locale) : t('engine.packages.detail.adoptOrphans', locale)}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={openDelete}
                disabled={!!busy}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                {busy === 'delete' ? t('engine.packages.detail.deleting', locale) : t('engine.packages.detail.deleteApp', locale)}
              </Button>
            </div>
            {dupOpen && (
              <div className="flex flex-col gap-1.5 rounded-md border p-2.5" data-testid="pkg-detail-dup-form">
                <input
                  autoFocus
                  value={dupName}
                  onChange={(e) => setDupName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && dupArmed && !busy) void duplicateApp();
                    if (e.key === 'Escape') setDupOpen(false);
                  }}
                  placeholder={t('engine.studio.landing.dupNamePlaceholder', locale)}
                  aria-label={t('engine.studio.landing.dupNamePlaceholder', locale)}
                  data-testid="pkg-detail-dup-name-input"
                  className="h-7 w-full rounded-md border bg-background px-2 text-[11px] outline-none focus:ring-1 focus:ring-primary"
                />
                <PackageIdInput
                  value={dupId}
                  onChange={setDupId}
                  onEnter={() => {
                    if (dupArmed && !busy) void duplicateApp();
                  }}
                  onEscape={() => setDupOpen(false)}
                  placeholder={t('engine.studio.landing.dupIdPlaceholder', locale)}
                  locale={locale}
                  testId="pkg-detail-dup-id-input"
                />
                <div className="flex items-center gap-1.5">
                  <Button size="sm" onClick={() => void duplicateApp()} disabled={!!busy || !dupArmed}>
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    {busy === 'duplicate'
                      ? t('engine.packages.detail.duplicating', locale)
                      : t('engine.packages.detail.duplicateGo', locale)}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDupOpen(false)} disabled={!!busy}>
                    {t('engine.cancel', locale)}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {msg && (
          <div
            className={`mt-4 rounded-md border p-2 text-sm ${
              msg.kind === 'ok'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'border-destructive/40 bg-destructive/10 text-destructive'
            }`}
          >
            {msg.text}
          </div>
        )}

        <EditPackageDialog
          pkg={pkg}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={() => {
            setMsg({ kind: 'ok', text: t('engine.packages.edit.saved', locale) });
            onChanged();
          }}
        />
        <PackageFormDialog
          mode="view"
          open={viewOpen}
          onOpenChange={setViewOpen}
          manifest={pkg?.manifest ?? null}
        />

        <AlertDialog
          open={deleteOpen}
          onOpenChange={(next) => {
            // Not dismissable while the DELETE is in flight.
            if (busy === 'delete') return;
            setDeleteOpen(next);
          }}
        >
          <AlertDialogContent data-testid="pkg-detail-delete-dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {tFormat('engine.packages.detail.deleteTitle', locale, { name: displayName })}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('engine.packages.detail.deleteDescription', locale)}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <RadioGroup
              value={deleteMode}
              onValueChange={(v) => setDeleteMode(v === 'structure' || v === 'all' ? v : '')}
              aria-label={t('engine.packages.detail.deleteApp', locale)}
              className="gap-3"
            >
              <div className="flex items-start gap-2">
                <RadioGroupItem
                  value="structure"
                  id={`${fieldId}-delete-structure`}
                  data-testid="pkg-detail-delete-mode-structure"
                  className="mt-0.5"
                />
                <Label htmlFor={`${fieldId}-delete-structure`} className="grid gap-0.5 font-normal">
                  <span className="font-medium">{t('engine.packages.detail.deleteModeStructure', locale)}</span>
                  <span className="text-xs text-muted-foreground">
                    {t('engine.packages.detail.deleteModeStructureHint', locale)}
                  </span>
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem
                  value="all"
                  id={`${fieldId}-delete-all`}
                  data-testid="pkg-detail-delete-mode-all"
                  className="mt-0.5"
                />
                <Label htmlFor={`${fieldId}-delete-all`} className="grid gap-0.5 font-normal">
                  <span className="font-medium">{t('engine.packages.detail.deleteModeAll', locale)}</span>
                  <span className="text-xs text-muted-foreground">
                    {t('engine.packages.detail.deleteModeAllHint', locale)}
                  </span>
                </Label>
              </div>
            </RadioGroup>
            <div className="grid gap-1.5">
              <Label htmlFor={`${fieldId}-delete-name`} className="text-sm font-medium">
                {tFormat('engine.packages.detail.deleteTypeName', locale, { name: displayName })}
              </Label>
              <Input
                id={`${fieldId}-delete-name`}
                value={deleteTyped}
                onChange={(e) => setDeleteTyped(e.target.value)}
                placeholder={displayName}
                autoComplete="off"
                data-testid="pkg-detail-delete-name-input"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy === 'delete'} data-testid="pkg-detail-delete-cancel">
                {t('engine.cancel', locale)}
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={!deleteArmed || busy === 'delete'}
                data-testid="pkg-detail-delete-confirm"
                onClick={(e) => {
                  // Stay open while the DELETE runs; `deleteApp` closes it.
                  e.preventDefault();
                  void deleteApp();
                }}
              >
                {busy === 'delete'
                  ? t('engine.packages.detail.deleting', locale)
                  : t('engine.packages.detail.deleteApp', locale)}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
          <AlertDialogContent data-testid="pkg-detail-discard-dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {tFormat('engine.packages.detail.discardTitle', locale, { count: drafts?.length ?? 0 })}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('engine.packages.detail.discardDescription', locale)}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="pkg-detail-discard-cancel">
                {t('engine.cancel', locale)}
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="pkg-detail-discard-confirm"
                onClick={() => void discardDrafts()}
              >
                {tFormat('engine.packages.detail.discardChanges', locale, { count: drafts?.length ?? 0 })}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export function PackagesPage() {
  const locale = useMetadataLocale();
  const { pathname } = useLocation();
  // App base = path up to (and excluding) `/component/...`, so links to
  // `/apps/:app/metadata/...` work regardless of nesting.
  const appBase = React.useMemo(() => {
    const idx = pathname.indexOf('/component');
    return idx >= 0 ? pathname.slice(0, idx) : pathname;
  }, [pathname]);

  const [packages, setPackages] = React.useState<InstalledPackageRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [showKernel, setShowKernel] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<InstalledPackageRow | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [importing, setImporting] = React.useState(false);
  const [importMsg, setImportMsg] = React.useState<{ kind: 'ok' | 'err'; text: string } | null>(
    null,
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<{ packages: InstalledPackageRow[] }>(API);
      const list = Array.isArray(data?.packages) ? data.packages : [];
      list.sort((a, b) => {
        // User (project) packages first, then by name.
        const sa = a.manifest.scope === 'project' ? 0 : 1;
        const sb = b.manifest.scope === 'project' ? 0 : 1;
        if (sa !== sb) return sa - sb;
        return (a.manifest.name || a.manifest.id).localeCompare(b.manifest.name || b.manifest.id);
      });
      setPackages(list);
    } catch (e: any) {
      setError(e?.message ?? t('engine.packages.loadFailed', locale));
    } finally {
      setLoading(false);
    }
  }, [locale]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // Keep the open detail sheet in sync with refreshed data.
  React.useEffect(() => {
    if (!selected) return;
    const fresh = packages.find((p) => p.manifest.id === selected.manifest.id);
    if (fresh && fresh !== selected) setSelected(fresh);
  }, [packages, selected]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return packages.filter((p) => {
      const kernel = p.manifest.scope === 'system' || p.manifest.scope === 'cloud';
      if (kernel && !showKernel) return false;
      if (!q) return true;
      return (
        p.manifest.id.toLowerCase().includes(q) ||
        (p.manifest.name || '').toLowerCase().includes(q)
      );
    });
  }, [packages, query, showKernel]);

  const openDetail = (pkg: InstalledPackageRow) => {
    setSelected(pkg);
    setDetailOpen(true);
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const text = await file.text();
      let manifest: any;
      try {
        manifest = JSON.parse(text);
      } catch {
        throw new Error(t('engine.packages.import.invalidJson', locale));
      }
      if (!manifest || typeof manifest !== 'object' || (!manifest.id && !manifest.name)) {
        throw new Error(t('engine.packages.import.invalidPackage', locale));
      }
      const res = await apiJson<any>('/api/v1/marketplace/install-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifest }),
      });
      setImportMsg({
        kind: 'ok',
        text: tFormat('engine.packages.import.success', locale, { id: res?.manifestId ?? manifest.id }),
      });
      await load();
    } catch (err: any) {
      setImportMsg({ kind: 'err', text: err?.message ?? t('engine.packages.import.failed', locale) });
    } finally {
      setImporting(false);
    }
  };

  const kernelCount = packages.filter(
    (p) => p.manifest.scope === 'system' || p.manifest.scope === 'cloud',
  ).length;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-6">
      {/* Hero */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <PackageIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{t('engine.packages.title', locale)}</h1>
            <p className="text-sm text-muted-foreground">
              {t('engine.packages.description', locale)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('engine.packages.refresh', locale)}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onImportFile}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
          >
            <FileUp className="mr-1.5 h-3.5 w-3.5" />
            {importing ? t('engine.packages.importing', locale) : t('engine.packages.import', locale)}
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t('engine.packages.new', locale)}
          </Button>
        </div>
      </div>

      {importMsg && (
        <div
          className={`mt-4 rounded-md border p-2 text-sm ${
            importMsg.kind === 'ok'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'border-destructive/40 bg-destructive/10 text-destructive'
          }`}
        >
          {importMsg.text}
        </div>
      )}

      {/* Toolbar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder={t('engine.packages.search', locale)}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {kernelCount > 0 && (
          <div className="flex items-center gap-2">
            <Switch id="show-kernel" checked={showKernel} onCheckedChange={setShowKernel} />
            <Label htmlFor="show-kernel" className="text-sm text-muted-foreground">
              {tFormat('engine.packages.showPlatform', locale, { count: kernelCount })}
            </Label>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="mt-4 rounded-lg border">
        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 p-4 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {/* A stable handle for the load-failure pins (`36fc74629`): the
                words in here are the server's, so a test that located this
                banner BY those words could not assert what is absent from it. */}
            <span data-testid="packages-load-error">{error}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <Empty>
              <EmptyTitle>{t('engine.packages.empty', locale)}</EmptyTitle>
              <EmptyDescription>
                {packages.length === 0
                  ? t('engine.packages.emptyCreate', locale)
                  : t('engine.packages.emptyFiltered', locale)}
              </EmptyDescription>
            </Empty>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('engine.packages.col.name', locale)}</TableHead>
                <TableHead>ID</TableHead>
                <TableHead className="w-24">{t('engine.packages.col.version', locale)}</TableHead>
                <TableHead className="w-24">{t('engine.packages.col.scope', locale)}</TableHead>
                <TableHead className="w-24">{t('engine.packages.col.status', locale)}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow
                  key={p.manifest.id}
                  className="cursor-pointer"
                  onClick={() => openDetail(p)}
                >
                  <TableCell className="font-medium">{p.manifest.name || p.manifest.id}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {p.manifest.id}
                  </TableCell>
                  <TableCell>{p.manifest.version || '—'}</TableCell>
                  <TableCell>
                    <ScopeBadge scope={p.manifest.scope} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge pkg={p} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <CreatePackageDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={async () => {
          await load();
        }}
      />
      <PackageDetailSheet
        pkg={selected}
        appBase={appBase}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onChanged={() => void load()}
      />
    </div>
  );
}

export default PackagesPage;
