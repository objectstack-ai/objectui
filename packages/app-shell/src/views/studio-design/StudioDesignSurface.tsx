// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * StudioDesignSurface — the open-source WYSIWYG design surface (ADR-0080).
 *
 * Routed as /studio/:packageId/{data|automations|interfaces} — three pillars,
 * each composed AROUND existing renderers (no new editor code):
 *   - Interfaces: the real App navigation tree → live canvas (getMetadataPreview)
 *     + inspector (getMetadataInspector), edits persisting via draft → publish.
 *   - Data: the package's objects → fields + record grid.
 *   - Automations: flows → FlowPreview (default OFF / review-then-enable).
 *
 * Open-core boundary: the left AI copilot is NOT part of the open-source
 * surface — it is an injected slot (`aiSlot`) the cloud edition fills.
 */

import * as React from 'react';
import { useParams, useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useAdapter, SchemaRendererProvider } from '@object-ui/react';
// The ONE draft-envelope reader (objectui#8181): unwrap AND strip the
// framework's read decorations in one place. This file used to carry its own
// copy that did the unwrap and skipped the strip.
// …and `formatMetadataError`, the one metadata-save error reader (objectui#11302).
// …and `dropServedPicklistOptions`, the served -> authored conversion of a
// picklist-bound field (objectui#10202), moved here by objectui#11692.
import { dropServedPicklistOptions, extractDraftBody, formatMetadataError } from '@object-ui/data-objectstack';
import type { FlowRuntimeState as SpecFlowRuntimeState } from '@objectstack/spec/contracts';
import type { I18nLabel } from '@objectstack/spec/ui';
import { StudioChatDock, type StudioSurfaceLabel } from './StudioAiCopilot.js';
import { nextCenterTab, type StudioCenterTab } from './centerTab.js';
import { useIsWideViewport } from './wideViewport.js';
import {
  GridFieldAuthoringProvider,
  cn,
  useIsMobile,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Popover,
  PopoverTrigger,
  PopoverContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Badge,
  Separator,
} from '@object-ui/components';
import { ObjectView as PluginObjectView } from '@object-ui/plugin-view';
import { ListView } from '@object-ui/plugin-list';
import { ObjectForm } from '@object-ui/plugin-form';
import {
  AlertTriangle,
  Ban,
  Boxes,
  Building2,
  FileText,
  Database,
  LayoutDashboard,
  BarChart3,
  Table2,
  Folder,
  Compass,
  Link as LinkIcon,
  Puzzle,
  BookOpen,
  Workflow,
  SlidersHorizontal,
  MousePointer2,
  Code2,
  Eye,
  Loader2,
  Pencil,
  Check,
  Plus,
  X,
  GitBranch,
  Rocket,
  ChevronDown,
  Lock,
  Settings,
  Home as HomeIcon,
  Shield,
  ShieldCheck,
  ShieldQuestion,
  Menu,
  PanelRightClose,
  PanelRightOpen,
  type LucideIcon,
} from 'lucide-react';
import {
  getMetadataPreview,
  listMetadataPreviewTypes,
  type MetadataSelection,
} from '../metadata-admin/preview-registry.js';
import { getStudioCanvasPreview, StudioCanvasNavEntryContext, type StudioCanvasNavEntry } from './studio-canvas-preview.js';
import { PermissionMatrixEditPage } from '../metadata-admin/PermissionMatrixEditor.js';
import { AccessExplainPanel } from '../metadata-admin/AccessExplainPanel.js';
import {
  getMetadataInspector,
  listMetadataInspectorTypes,
} from '../metadata-admin/inspector-registry.js';
import { getMetadataDefaultInspector } from '../metadata-admin/default-inspector-registry.js';
import { getMetadataResource } from '../metadata-admin/registry.js';
import { useMetadataClient, useMetadataTypes } from '../metadata-admin/useMetadata.js';
// objectui#11773 — every draft save of an existing item sends the version its buffer was built on.
import { useDraftSaveGuard } from '../metadata-admin/DraftConflictDialog.js';
import {
  DESIGNER_SURFACE_PARAM,
  formatSurfaceParam,
} from '../metadata-admin/nav-selection.js';
import { useNavSelDeepLink } from '../metadata-admin/useNavSelDeepLink.js';
import { SourcePageEditor } from '../metadata-admin/previews/SourcePageEditor.js';
import { fetchPendingDrafts, usePendingDrafts } from '../../preview/usePendingDrafts.js';
import { emitMetadataRefresh, subscribeMetadataRefresh } from '../../assistant/assistantBus.js';
import {
  flowSaveRefusal,
  formatPublishFailures,
  issueRefusal,
  navEntryLocator,
  objectSaveRefusal,
  plainRefusal,
  type PublishFailure,
  type StudioRefusal,
} from './metadataError.js';
import { readEnvelopeFailureText } from '../../utils/apiErrorEnvelope.js';
import { loadPackageLessSurfaces, loadPackageSurfaces } from './packageSurfaces.js';
import {
  STUDIO_ORG_SCOPE_PILLAR,
  isOrgScopeDraft,
  isStudioOrgScope,
  studioOrgScopePath,
} from './studioScope.js';
import { useMetadataRefreshNonce } from './useMetadataRefreshNonce.js';
import { useHomePath } from '../../hooks/useHomePath.js';
import { resolveSurface, findSurfaceInTree, isSameSurface, type NavNode, type Surface } from './navSurface.js';
import { useSurfaceDeepLink, resolveSurfaceDeepLink, type SurfaceTarget } from './useSurfaceDeepLink.js';
import { isStudioRunLanding } from './studioLanding.js';
import { SurfaceDeepLinkProvider, useRequestedSurface } from './surfaceDeepLinkChannel.js';
import { buildObjectSkeleton, buildFlowSkeleton, buildAppSkeleton, buildPermissionSkeleton, type AppNavSeed } from './skeletons.js';
import { OWD_CREATE_MODELS, OWD_DEFAULT, type OwdCreateModel } from './owd-sharing.js';
import { t, tFormat, translateMetadataType, useMetadataLocale } from '../metadata-admin/i18n.js';
import { useDisplayLocale } from '@object-ui/i18n';
import { SuggestedBindingsPanel } from '../../components/SuggestedBindingsPanel.js';
import { AppNavCanvas, navPayloadOf } from '../metadata-admin/previews/AppNavCanvas.js';
import {
  FlowRuntimeContext,
  deriveFlowRunStatus,
  describeFlowRunStatus,
  type FlowRuntimeRow,
} from '../metadata-admin/previews/flow-problems.js';
import {
  clearedLabel,
  inheritedNavEntryText,
  navEntryLabelText,
  navItemLabelText,
  renamedLabel,
  type NavEntryLike,
} from '../metadata-admin/previews/navItemLabel.js';
import { useNavTargetLabel } from '../../hooks/useNavTargetLabel.js';
import { listAppComponents } from '../../services/componentRegistry.js';
import {
  NAV_ENTRY_TYPES,
  isNavEntryType,
  isStaticPageOption,
  navTypeAcceptsChildren,
  retypedNavEntry,
} from '../metadata-admin/inspectors/nav-target.js';
import type { NavigationItemType } from '@object-ui/types';
import {
  readFields,
  writeFields,
  newField,
} from '../metadata-admin/previews/object-fields-io.js';
import { CreateItemDialog } from './CreateItemDialog.js';
import {
  CreatePackageDialog,
  PackageDetailSheet,
  type InstalledPackageRow,
} from '../metadata-admin/PackagesPage.js';
import { ObjectFormDesigner } from './ObjectFormDesigner.js';
import { isStudioHiddenSystemField } from './studioHiddenSystemField.js';
import { ObjectGroupInspector } from './ObjectGroupInspector.js';
import { ObjectValidationsPanel } from './ObjectValidationsPanel.js';
import { ObjectSettingsPanel } from './ObjectSettingsPanel.js';
import { PackageOwdOverviewPanel } from './PackageOwdOverviewPanel.js';
import { ObjectApiPanel } from './ObjectApiPanel.js';
import { ObjectHooksPanel } from './ObjectHooksPanel.js';
import { ObjectActionsPanel } from './ObjectActionsPanel.js';
import { getIcon } from '../../utils/getIcon.js';
import { fetchPackages, prefixObjectName, type PkgEntry } from './packages-io.js';
import { DraftChangesPanel } from '../../preview/DraftChangesPanel.js';
import { toast } from 'sonner';

// ADR-0057 P3c follow-up (#2477 item 3) — the folded layout's side-by-side
// threshold (`xl`, not `2xl`) and its matchMedia hook live in ./wideViewport so
// the rule is testable without mounting this surface; see that module for why
// 1280 is the right line and what the canvas measures there.

/**
 * The create dialog's OWD options reuse the SETTINGS tab's own label and gloss
 * strings verbatim (`7a90afdf9`). The complaint it answered was that the Settings
 * page "is excellent — four options, each with a plain-language gloss" and that
 * nothing routes the author there; copying the wording rather than writing a
 * second, shorter one is what keeps the two surfaces from drifting into two
 * descriptions of one security baseline.
 */
const OWD_OPTION_LABEL_KEY: Record<OwdCreateModel, string> = {
  private: 'engine.studio.settings.sharingPrivate',
  public_read: 'engine.studio.settings.sharingPublicRead',
  public_read_write: 'engine.studio.settings.sharingPublicReadWrite',
};
const OWD_OPTION_DESC_KEY: Record<OwdCreateModel, string> = {
  private: 'engine.studio.settings.sharingDescPrivate',
  public_read: 'engine.studio.settings.sharingDescPublicRead',
  public_read_write: 'engine.studio.settings.sharingDescPublicReadWrite',
};

const PILLARS: ReadonlyArray<{ key: string; label: string; Icon: LucideIcon }> = [
  { key: 'data', label: 'Data', Icon: Database },
  { key: 'automations', label: 'Automations', Icon: Workflow },
  { key: 'interfaces', label: 'Interfaces', Icon: LayoutDashboard },
];
// objectui#5813 — debounced draft auto-save, shared by the pillars' editors.
// Drafts never touch the live app, so persisting them automatically is
// zero-risk; the Save draft buttons it replaces were a standing tax on the
// topbars AND a real loss point (forgot-to-save). Semantics:
//  - re-arms 1.5s after the LAST edit (the snapshot key changes per edit);
//  - `blocked` mirrors each site's old disabled-guard — in particular a
//    CEL-blocking inspector must gate the TIMER, not just a button, or the
//    timer publishes the malformed definition a second later (objectui#4306);
//  - a FAILED save does not retry until the user edits again (the snapshot
//    it attempted is remembered), so an invalid draft can't toast-loop.
//  - objectui#11189 — the returned `flush` fires the pending save now instead
//    of at the timer, under the same conditions, and says whether a save went
//    out. A flushed snapshot counts as attempted, so the timer never sends it
//    a second time.
//  - objectui#11204 — a save that lands clears its dirty flag only if nothing
//    was edited while it was in flight. The hook hands every save it sends a
//    `DraftSend` claim on the snapshot it sent, and the caller's
//    `set*Dirty(false)` after its await runs only while `sent.unmoved()`. An
//    edit taken meanwhile keeps the buffer dirty, and the autosave, unblocked
//    by the save's end, sends it next. A save the caller sends itself takes
//    its claim from `sending(body)`.
//  - objectui#11232 — a dirty period belongs to the item that was open when it
//    began. The caller names the item its `save` addresses as `target`, a
//    primitive identity (type and name; never a memoised object, AGENTS.md
//    #10). On a switch the caller's `save` addresses the newly opened item at
//    once, while the buffer holds the previous item's document until the new
//    load installs its own; so a period that began on another item is never
//    sent, by the timer or by `flush`, and it ends only when the caller's dirty
//    flag falls.
//    The previous item's pending edit is dropped: what the Data pillar's switch
//    has always done, and what every pillar did whenever the new load landed
//    inside the debounce. A claim also reads moved once the target has
//    changed, so a save that lands after a switch never clears the dirty flag
//    of the item opened since.
//  - objectui#11272 — the buffer belongs to the item it was loaded for. The
//    caller names that item as `loadedFor`, in `target`'s spelling, and sets
//    it where its load installs a buffer and nowhere else. Until the open
//    item's own document is in, `loadedFor` is not `target`: then the timer
//    and `flush` send nothing, `sending` gives no claim (every save the caller
//    sends itself asks it first, and sends nothing without one), and `loaded`
//    is false, which the caller reads to show and offer nothing of the buffer
//    under the open item. An edit a period begins while the buffer is another
//    item's is never sent. It ends with the dirty flag, which every caller's
//    buffer install clears: the page inspector's and the Data pillar's as
//    they install (the Data pillar also at its load's start), a leaf with no
//    editable draft as its `{}` goes in, and Automations when the load
//    settles. The Interfaces nav installs only over a clean buffer, or on its
//    mount (it is keyed by package).

/**
 * objectui#11204 — one draft save's claim on the buffer it sent. `unmoved()`
 * is true while the buffer, as last committed, is still the snapshot that
 * save sent, compared the way the autosave compares snapshots (serialised).
 * It compares content, not an edit count: an edit undone while the save was
 * in flight leaves the buffer as the server now holds it, and so clean.
 * objectui#11232 — and only while the hook's `target` is still the item the
 * save was sent for: after a switch the buffer is the next item's to clear.
 */
interface DraftSend {
  unmoved: () => boolean;
}

/**
 * objectui#11357 — the body the Interfaces pillar saves for its open leaf. A
 * page goes through the `page` registration's `fromDraft`, the serialiser
 * the metadata editor's save uses: it leaves out the `requires` the server
 * stamps from an html page's source, so the stamp the buffer was seeded with
 * never travels back as a hand-written list. ⛔ Nothing here computes
 * `requires`. Every other type is sent as the draft it is.
 *
 * Page-scoped on purpose. This pillar applies no `toDraft` on load, so a
 * type's `fromDraft` is safe here only where that type registers no
 * `toDraft` (a pair is an inverse; half of it would send a shape the pillar
 * never received). The `page` registration has none, and the pillar's pin
 * holds that precondition.
 */
function interfacesSaveBody(type: string, draft: Record<string, unknown>): Record<string, unknown> {
  if (type !== 'page') return draft;
  const fromDraft = getMetadataResource('page')?.fromDraft;
  return fromDraft ? fromDraft(draft) : draft;
}

function draftSnapshotKey(snapshot: unknown): string {
  try {
    return JSON.stringify(snapshot ?? null);
  } catch {
    // Unserializable draft (never the case for metadata bodies): a constant
    // key means one auto-save per dirty period instead of per edit, and a
    // save that lands always reads unmoved: degraded, as before.
    return '"__unserializable__"';
  }
}

function useDraftAutoSave(opts: {
  /** objectui#11232 — the item `save` addresses, as a primitive identity. */
  target: string;
  /** objectui#11272 — the item whose document the buffer holds: the target
   * the caller's load installed it for, in the same spelling. */
  loadedFor: string;
  dirty: boolean;
  blocked: boolean;
  snapshot: unknown;
  save: (sent: DraftSend) => void | Promise<void>;
}): {
  flush: () => boolean;
  /** A claim for a save the caller sends itself; `null` refuses it (objectui#11272). */
  sending: (snapshot: unknown) => DraftSend | null;
  /** objectui#11272 — the buffer is the open item's own document. */
  loaded: boolean;
} {
  const { target, loadedFor, dirty, blocked, snapshot, save } = opts;
  // Pure (the react compiler forbids impure render calls).
  const snapKey = React.useMemo(() => draftSnapshotKey(snapshot), [snapshot]);
  const lastAttemptRef = React.useRef<string | null>(null);
  const saveRef = React.useRef(save);
  // What the timer below would send, as last committed, for `flush` and for a
  // landing save's claim to read. A layout effect, so it is current as soon as
  // a render commits: a save that lands right after an edit reads the edit.
  // `since` is the target the dirty period began on (objectui#11232): taken
  // as the flag rises, kept while it stays up.
  const pendingRef = React.useRef({ dirty, blocked, snapKey, target, loadedFor, since: target });
  React.useLayoutEffect(() => {
    const prev = pendingRef.current;
    saveRef.current = save;
    pendingRef.current = { dirty, blocked, snapKey, target, loadedFor, since: dirty && prev.dirty ? prev.since : target };
  });
  // A state initializer, not a memo: React keeps its identity by contract, so
  // a caller may list it, or a member of it, as an effect dependency
  // (AGENTS.md #10).
  const [api] = React.useState(() => {
    const claim = (key: string, sentFor: string): DraftSend => ({
      unmoved: () => pendingRef.current.target === sentFor && pendingRef.current.snapKey === key,
    });
    // objectui#11232 — the pending edit is the open item's own: its dirty
    // period began on the item `save` now addresses. objectui#11272 — and the
    // buffer it edits is that item's document: its load installed it for it.
    const owned = (): boolean => {
      const { since, target: now, loadedFor: holds } = pendingRef.current;
      return since === now && holds === now;
    };
    const send = (key: string): void => {
      lastAttemptRef.current = key;
      void saveRef.current(claim(key, pendingRef.current.target));
    };
    return {
      send,
      owned,
      flush: (): boolean => {
        const pending = pendingRef.current;
        if (!pending.dirty || pending.blocked || !owned() || lastAttemptRef.current === pending.snapKey) return false;
        send(pending.snapKey);
        return true;
      },
      sending: (sent: unknown): DraftSend | null =>
        owned() ? claim(draftSnapshotKey(sent), pendingRef.current.target) : null,
    };
  });
  React.useEffect(() => {
    if (!dirty || blocked) return;
    if (lastAttemptRef.current === snapKey) return;
    const timer = setTimeout(() => {
      if (lastAttemptRef.current === snapKey) return;
      // Read as last committed: a switch since the edit left it with its item.
      if (!api.owned()) return;
      api.send(snapKey);
    }, 1500);
    return () => clearTimeout(timer);
  }, [dirty, blocked, snapKey, api]);
  return { flush: api.flush, sending: api.sending, loaded: loadedFor === target };
}

// objectui#5813 — Access is a low-frequency ADMIN surface, demoted from the
// top-level pillar row into the "More" overflow (maintainer ruling
// 2026-08-24: primary nav aligns with the Data/Automations/Interfaces maker
// mental model). The PAGE is untouched: the /studio/:pkg/access route, the
// pillar dispatch and PILLAR_FOR_SURFACE_TYPE all still point here.
const OVERFLOW_PILLARS: ReadonlyArray<{ key: string; label: string; Icon: LucideIcon }> = [
  { key: 'access', label: 'Access', Icon: Shield },
];

/**
 * Which pillar owns a surface type — the routing half of a live surface
 * request (see surfaceDeepLinkChannel). Only the types a pillar actually
 * RESOLVES are listed, mirroring the `resolveSurfaceDeepLink` call sites
 * below; an unlisted type is delivered in place rather than guessed at,
 * because navigating to the wrong pillar costs the author their position and
 * buys nothing.
 */
const PILLAR_FOR_SURFACE_TYPE: Readonly<Record<string, string>> = {
  object: 'data',
  flow: 'automations',
  permission: 'access',
};

const KIND_ICON: Record<string, LucideIcon> = {
  group: Folder,
  page: FileText,
  object: Database,
  dashboard: LayoutDashboard,
  report: BarChart3,
  view: Table2,
  action: MousePointer2,
  // objectui#11790 — the types the nav editor can now add. A url / component /
  // doc row opens no design surface (`resolveSurface`), so it renders disabled,
  // under its own glyph rather than the generic compass.
  url: LinkIcon,
  component: Puzzle,
  doc: BookOpen,
};
const navIcon = (type?: string): LucideIcon => KIND_ICON[type ?? ''] ?? Compass;


/**
 * objectui#11785 — the strip a pillar shows for a failed save or load. It
 * shows the refusal's sentence, a "Show me" button that opens the input the
 * sentence names, and the raw text (field paths, codes) inside a closed
 * "Details" disclosure. A failure with nothing rewritten (`plainRefusal`) has
 * no detail and renders as the single line it always was.
 *
 * Exported for its pins; `index.ts` does not re-export it.
 */
export function StudioRefusalStrip({
  refusal,
  locale,
  onShow,
  className,
}: {
  refusal: StudioRefusal;
  locale: string;
  /** Opens the target's input in the pillar that raised the refusal. */
  onShow?: (target: MetadataSelection) => void;
  /** Spacing and type size, which differ by pillar. */
  className?: string;
}): React.ReactElement {
  const { message, target, detail } = refusal;
  return (
    <div
      data-testid="studio-refusal"
      className={cn('rounded-md border border-destructive/40 bg-destructive/10 text-destructive', className)}
    >
      <div className="flex items-start gap-2">
        <p data-testid="studio-refusal-message" className="min-w-0 flex-1 whitespace-pre-line">
          {message}
        </p>
        {target && onShow && (
          <button
            type="button"
            onClick={() => onShow(target)}
            className="shrink-0 rounded border border-destructive/40 px-1.5 py-0.5 font-medium hover:bg-destructive/10"
          >
            {t('engine.studio.refusal.show', locale)}
          </button>
        )}
      </div>
      {detail && (
        <details data-testid="studio-refusal-detail" className="mt-1">
          <summary className="cursor-pointer select-none opacity-80">{t('engine.studio.refusal.details', locale)}</summary>
          <pre className="mt-1 whitespace-pre-wrap break-words font-mono opacity-90">{detail}</pre>
        </details>
      )}
    </div>
  );
}

/** Top-bar package switcher: list app packages (writable base vs read-only
 * code), switch by navigation, create a new writable base via the standard
 * CreatePackageDialog, and open the standard PackageDetailSheet (info +
 * disable / duplicate / delete / publish …) for the current package. */
/**
 * One sonner id for EVERY `fetchPackages()` failure on this surface
 * (objectui#7368). Three effects call that one endpoint on mount — the
 * switcher list, the writability courtesy gate and the namespace lookup — so a
 * single 503 rejects all three. Sonner UPDATES a toast that already carries the
 * id instead of stacking a new one (the `outcomeToastId` pattern this repo
 * already uses in `packages/components/src/renderers/form/form.tsx`), so one
 * outage produces one toast, not three. Reporting the failure is the point;
 * reporting it three times is noise that would get the report muted.
 */
const PACKAGE_LIST_TOAST_ID = 'studio-package-list';

function PackageSwitcher({
  packageId,
  tab,
  beforeNavigate,
}: {
  /** The open package, or `null` in the package-less scope (objectui#11553). */
  packageId: string | null;
  tab: string;
  /** objectui#2600 — veto hook for package-switch navigation: return false to
   * stay put (the surface prompts about unsaved pillar edits). Not consulted
   * for the deleted-package eviction in onManageChanged — that navigation is
   * forced (the package under the editor is gone). */
  beforeNavigate?: () => boolean;
}): React.ReactElement {
  const navigate = useNavigate();
  const locale = useMetadataLocale();
  // objectui#7373 — where the deleted-package eviction below lands when no
  // other package is left to open: the DECLARED landing, the launcher only when
  // the deployment declares none.
  const homePath = useHomePath();
  const [open, setOpen] = React.useState(false);
  const [pkgs, setPkgs] = React.useState<PkgEntry[] | null>(null);
  /**
   * The last package-list failure, or `null` if the last attempt did not fail
   * (objectui#7368).
   *
   * `pkgs === null` alone cannot say WHY the list is absent, and the trigger's
   * `current?.name ?? packageId` then renders the same raw reverse-domain id
   * for THREE different situations — still loading, the fetch failed, and a
   * package that genuinely declares no name. The author reading `app.b2r4` in
   * the top bar had no way to tell whether to go fix the manifest or to go
   * retry, and nothing else on screen told them either: no toast, no console
   * line. This slot is the second bit that separates them, and the surface
   * spells the three out the same way it already does at the Interfaces rail
   * / Data rail / Automations rail empty states (`error ? loadFailed : loaded
   * ? none : loading`).
   */
  const [pkgsErr, setPkgsErr] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [manage, setManage] = React.useState<InstalledPackageRow | null>(null);
  const [manageOpen, setManageOpen] = React.useState(false);
  const [manageBusy, setManageBusy] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchPackages()
        .then((parsed) => {
          if (cancelled) return;
          setPkgs(parsed);
          setPkgsErr(null);
        })
        .catch((e: unknown) => {
          // objectui#7368 — the switcher still works for navigation-free
          // display, so this stays a DEGRADATION and never a throw: one 503
          // must not take the whole Studio top bar down with it. What it stops
          // being is SILENT. The failure is reported once (toast, this file's
          // own posture — `formatMetadataError` is used at 19 other call
          // sites in this file; this one was the exception, not the rule)
          // and, because a toast disappears while the top bar keeps showing
          // the id forever, it is also RECORDED so the trigger can say which
          // of the three states it is in.
          if (cancelled) return;
          const message = formatMetadataError(e);
          setPkgsErr(message);
          toast.error(message, { id: PACKAGE_LIST_TOAST_ID });
        });
    };
    load();
    // Refresh the switcher list (and thus the top-bar package name) when a
    // package is created or its manifest is edited elsewhere — PackageFormDialog
    // dispatches `objectui:packages-changed` on create/edit. Without this the
    // header showed the OLD name after a rename until a full page reload.
    window.addEventListener('objectui:packages-changed', load);
    return () => {
      cancelled = true;
      window.removeEventListener('objectui:packages-changed', load);
    };
  }, [packageId]);

  const current = pkgs?.find((p) => p.id === packageId) ?? null;
  /**
   * Which of the three the trigger is showing (objectui#7368). A failure wins
   * over a list already in hand: after a failed refresh the names on screen are
   * stale, and saying "loaded" about them would be the same lie in a new place.
   */
  const pkgListState: 'loading' | 'failed' | 'loaded' =
    pkgsErr !== null ? 'failed' : pkgs === null ? 'loading' : 'loaded';

  // Open the standard detail/management sheet for a package — fetch its full
  // installed record (manifest + status) first, since the switcher only holds
  // the trimmed {id,name,writable} view.
  const fetchFullPackage = React.useCallback(async (id: string): Promise<InstalledPackageRow | null> => {
    const res = await fetch('/api/v1/packages', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    /**
     * ⛔ `res.ok` is not optional here (objectui#7881). The platform answers a
     * failed read in the ADR-0112 envelope — `{ success: false, error: { code,
     * message } }` — and that envelope PARSES CLEANLY through the reader
     * below: `root` becomes the error object, which is neither an array nor
     * carries `packages`, so `list` fell to `[]` and `.find()` to `null`.
     * Nothing threw, `openManage`'s catch never ran, and the management sheet
     * was opened on a null package. An empty list is a completely legitimate
     * SUCCESS answer, so using it for a failure is representing failure with a
     * legitimate success value — the same family as objectui#7368 and
     * objectui#7821 (PR #7879), one seam over.
     *
     * Measured on this path, not assumed. `GET /api/v1/packages` is served by
     * the direct-mount registrar (`@objectstack/rest` `package-routes.ts`,
     * which mounts FIRST in the production stack), and `check:route-envelope`
     * pins that module at zero hand-written bodies: every failure leaves
     * through the shared `sendError` / `sendThrownError`. The reachable
     * failures are `401 UNAUTHENTICATED` (anonymous deny), `403 FORBIDDEN`
     * (the `studio.access` / `setup.access` capability gate), `503
     * SERVICE_UNAVAILABLE` (either half of the two-source merge refusing a
     * read it could not perform) and `500 INTERNAL_ERROR` — one shape,
     * `{ success: false, error: { code, message } }`, pinned wire-side by
     * `package-envelope.conformance.test.ts`.
     *
     * So the envelope's own `success` is NOT a second bit to read here: `sendOk`
     * writes `true` on every 2xx and the error writers write `false` on every
     * non-2xx, which makes it `!res.ok` restated. `res.ok` is the DECISION; the
     * envelope is read for the WORDS, which is the half that needs it — in the
     * 5xx band the platform withholds the producer's prose and answers the
     * generic `Internal server error`, leaving `error.code` as the only
     * discriminating word, so the code travels with the message.
     *
     * The one other shape a browser can meet is a non-JSON error body (a
     * proxy's HTML 502/504). `res.json()` rejects on it — which the caller
     * already reported, as a JSON syntax error — so the tolerant read below
     * names the status instead.
     */
    if (!res.ok) {
      const failure = (await res.json().catch(() => null)) as {
        error?: { code?: unknown; message?: unknown; userMessage?: unknown };
      } | null;
      /**
       * ⭐ `userMessage` OUTRANKS `message`, and the order is the contract's,
       * not a preference (objectui#7938).
       *
       * `error.userMessage` is the producer's channel (objectstack `79c46da90`),
       * and the envelope writer's own words are the rule this line implements:
       * "the text a producer marked, AT THROW TIME, as addressed to the END USER.
       * Presence IS the marking — a consumer that sees the field renders it
       * verbatim and keeps its generic substitution for everything unmarked"
       * (`sendError`, `@objectstack/types` `response-envelope.ts`). This
       * reader was that consumer and did not see the field: it read
       * `error.message` and `error.code` and stopped, so a marked sentence
       * arrived on the wire and had nowhere to appear.
       *
       * The 5xx band is where the loss became visible rather than merely
       * theoretical. That door withholds the producer's PROSE and substitutes
       * the generic `Internal server error` into `error.message` — but the
       * withhold rewrites a local `message` const and `looksLikeInternalErrorLeak`
       * is only ever handed `thrown.message`, so `userMessage` is never an
       * input to it and rides through untouched (`sendThrownError`,
       * `@objectstack/rest` `package-routes.ts`; pinned wire-side by
       * `package-door-user-message.test.ts`). So on a marked 500/503 this
       * reader showed the author the generic sentence and dropped the
       * specific one written for them — nothing invalid displayed, which is
       * exactly what made it quiet.
       *
       * ⛔ NOT scoped to 5xx, deliberately. The marked channel is
       * status-agnostic by the producing door's own ruling — "a marked text is
       * the producer's deliberate statement to the caller at any status" — so
       * a consumer that honoured it only in one band would re-create, on the
       * reading end, precisely the divergence that door refused to create on
       * the writing end. A 4xx `message` is already caller-facing by design;
       * when a producer ALSO marked a text there, the mark is the more
       * specific answer to "what should this person read", and the diagnostic
       * it displaces is not lost to diagnosis — `code` still travels below.
       *
       * ⛔ Not a tolerant alias ladder either: these are two DECLARED fields
       * with different meanings, not two spellings of one. An unmarked refusal
       * carries no `userMessage` at all (the producer's `declaredUserMessage`
       * already applied its non-empty-string rule), so the overwhelmingly
       * common case falls straight through to `message` with byte-identical
       * output.
       */
      const marked = typeof failure?.error?.userMessage === 'string' ? failure.error.userMessage : '';
      const diagnostic = typeof failure?.error?.message === 'string' ? failure.error.message : '';
      const message = marked || diagnostic;
      const code = typeof failure?.error?.code === 'string' ? failure.error.code : '';
      throw new Error(message ? (code ? `${message} (${code})` : message) : `HTTP ${res.status}`);
    }
    const data = (await res.json()) as unknown;
    const root = (data as { data?: unknown })?.data ?? data;
    const list = (Array.isArray(root) ? root : ((root as { packages?: unknown[] })?.packages ?? [])) as Array<
      InstalledPackageRow & { id?: string }
    >;
    return list.find((p) => (p?.manifest?.id ?? p?.id) === id) ?? null;
  }, []);

  const openManage = React.useCallback(
    async (id: string) => {
      setOpen(false);
      setManageBusy(true);
      try {
        const full = await fetchFullPackage(id);
        /**
         * ⛔ The sheet never opens on a `null` package (objectui#7881). With
         * the read above now refusing, `null` means only what it always should
         * have meant: the list came back, and this package is not in it —
         * deleted or uninstalled elsewhere since the switcher last loaded.
         * `PackageDetailSheet` renders `null` for a null `pkg`, so opening it
         * anyway produced a click that did nothing and said nothing, and left
         * `manageOpen` stuck true with no rendered sheet to close it.
         *
         * Reported, not thrown: the read SUCCEEDED, so there is no caught
         * error to format and nothing about the endpoint to report.
         */
        if (!full) {
          toast.error(tFormat('engine.studio.pkg.manageMissing', locale, { id }), {
            id: PACKAGE_LIST_TOAST_ID,
          });
          return;
        }
        setManage(full);
        setManageOpen(true);
      } catch (e) {
        /*
         * This surface's EXISTING objectui#7368 posture, now also carrying the
         * shared sonner id: `fetchFullPackage` is the FOURTH caller of
         * `/api/v1/packages` on this surface (the switcher list, the
         * writability courtesy gate and the namespace lookup are the other
         * three), so one outage that rejects all four is one toast, not four.
         *
         * ⛔ Deliberately NOT also recorded in `pkgsErr`. That slot is the
         * switcher LIST's state and is written exactly where `pkgs` is — the
         * mount effect and `onManageChanged`. This callback never writes
         * `pkgs`, so the names in the trigger are precisely as current as they
         * were a moment ago, and the two sibling `fetchPackages` call sites
         * that likewise do not write the list report the same way.
         */
        toast.error(formatMetadataError(e), { id: PACKAGE_LIST_TOAST_ID });
      } finally {
        setManageBusy(false);
      }
    },
    [fetchFullPackage, locale],
  );

  // A lifecycle action ran in the sheet — refresh the list AND the managed
  // snapshot (so an edit shows immediately). If the managed package was the one
  // we're editing and it's now gone (deleted), return to the Studio landing
  // (home, when no package is left).
  const onManageChanged = React.useCallback(async () => {
    /**
     * `null` means "the refresh did not tell us anything", which is NOT the
     * same fact as "the server listed the packages and yours is not among
     * them" (objectui#7821). Those two used to be the SAME value: `list`
     * started as `[]` and the `.catch` left it that way — the comment there
     * said "keep the stale list", true of the `pkgs` state, which simply is
     * not written, but never of this local. So after a failed
     * `GET /api/v1/packages` the `!list.some(...)` below was unconditionally
     * true, the code took the branch labelled `// Deleted`, and with `list[0]`
     * undefined a transient 503 evicted the author from the editor to
     * `/home` — no toast, no confirmation, package still there. Absence of
     * evidence is not evidence of deletion.
     */
    let list: PkgEntry[] | null = null;
    try {
      list = await fetchPackages();
      setPkgs(list);
      // A list we did receive is current, so it also clears an earlier
      // failure — otherwise the trigger would keep reading `failed` over
      // names that are now fresh.
      setPkgsErr(null);
    } catch (e) {
      // Reported through this surface's EXISTING posture (objectui#7368):
      // `formatMetadataError` on the shared sonner id (one outage, one toast)
      // and recorded, so the trigger reads `failed` rather than showing a
      // stale list as though it were current. ⛔ Still not a `throw` — one
      // 503 must not take the Studio down — and ⛔ still no retry, whose
      // count / backoff / give-up state nobody has ruled on.
      const message = formatMetadataError(e);
      setPkgsErr(message);
      toast.error(message, { id: PACKAGE_LIST_TOAST_ID });
    }
    const managedId = manage?.manifest.id;
    if (!managedId) return;
    // A list we actually received, that does not contain the managed package,
    // is the ONLY evidence of deletion. `list === null` draws no inference
    // either way: the author stays put, and the managed snapshot below is
    // still refreshed (that call reports its own outcome).
    if (list !== null && !list.some((p) => p.id === managedId)) {
      // Deleted — only navigate away if it was the package we're editing.
      // While other packages remain, that is the Studio landing
      // (objectui#11784), where the author picks the next one or creates one;
      // this used to open `list[0]`, whichever package the list started with,
      // so a delete read as "Studio moved me into another app". With nothing
      // left it is still the declared home (objectui#7373).
      if (managedId === packageId) {
        navigate(list.length > 0 ? '/studio' : homePath);
      }
      return;
    }
    /**
     * The managed snapshot behind the OPEN sheet (objectui#7907). A lifecycle
     * action has just run — disable / enable / duplicate / publish /
     * publish-drafts / manifest edit — so the record in `manage` is ALREADY
     * known to be out of date, and this read is what replaces it. Neither way
     * it can fail may be silent, and neither may leave the PRE-ACTION record on
     * screen as though it were current.
     *
     * The arm this replaces was `catch {}` under a comment reading "keep the
     * current snapshot" — true of what it did, and the reason it was wrong:
     * the author disabled the package, was told nothing, and went on reading
     * `Status: Enabled`. ⚠️ It is a PRE-EXISTING defect that objectui#7881
     * (PR #7906) made much easier to hit, NOT a regression from it: before that
     * card `fetchFullPackage` never read `res.ok`, so this catch could only
     * ever see a `res.json()` rejection; now that the helper refuses a non-2xx,
     * the same catch also swallows every 401 / 403 / 503 / 500. Fixing one
     * swallowing site made the next swallowing site swallow more.
     *
     * ⛔ Why the sheet CLOSES rather than staying open on the stale record.
     * `PackageDetailSheet` is an ACTION surface, and it derives its verb from
     * the record it was handed: `enabled = pkg.enabled !== false && pkg.status
     * !== 'disabled'` picks both the button's label and the endpoint it POSTs
     * (`.../${enabled ? 'disable' : 'enable'}`, `PackagesPage.tsx`). Left open
     * over a snapshot we KNOW is pre-action, it does not merely display a stale
     * badge — it re-arms the author with the verb they just fired. Closing it
     * is still a DEGRADATION and not a throw (objectui#7368's standing ruling
     * — one 503 must not take the Studio down): the editor, the top bar and
     * the package list all stay, and reopening the sheet re-runs this same read
     * one click away, which objectui#7881 taught to report its own outcome.
     *
     * ⛔ `manage` is deliberately NOT nulled — a null `pkg` with `manageOpen`
     * still true is precisely the stuck state objectui#7881 fixed, and the next
     * `openManage` overwrites the record anyway.
     *
     * ⛔ Not recorded in `pkgsErr` either, and this arm was MEASURED rather
     * than inherited: that slot is the switcher LIST's state and is written
     * exactly where `pkgs` is — the mount effect and the HEAD of this callback,
     * the only two sites that write either. This TAIL writes neither; it writes
     * `manage`. The head has just recorded the list's own verdict (a fresh list
     * and `null`, or its failure), so writing `pkgsErr` from here would mark
     * the trigger `failed` over names the head refreshed successfully a moment
     * ago — the same lie as objectui#7368's, pointed the other way.
     *
     * ⛔ And no navigation: a snapshot this read could not deliver is not
     * evidence of deletion (objectui#7821). Reporting is not inferring.
     */
    try {
      const fresh = await fetchFullPackage(managedId);
      if (fresh) {
        setManage(fresh);
      } else {
        // The read SUCCEEDED and the package is not in the list — the same
        // fact `openManage` reports when it refuses to open on it, said with
        // the same key. Not a caught error: there is nothing about the
        // endpoint to report.
        toast.error(tFormat('engine.studio.pkg.manageMissing', locale, { id: managedId }), {
          id: PACKAGE_LIST_TOAST_ID,
        });
        setManageOpen(false);
      }
    } catch (e) {
      // This surface's EXISTING objectui#7368 posture — `formatMetadataError`
      // on the shared sonner id, so ONE outage that rejects both halves of this
      // callback is one toast rather than a stack. ⛔ Not a second reporting
      // channel: the message names the consequence the author can see (their
      // panel closed) and carries the server's own words inside it.
      toast.error(
        tFormat('engine.studio.pkg.manageRefreshFailed', locale, {
          id: managedId,
          error: formatMetadataError(e),
        }),
        { id: PACKAGE_LIST_TOAST_ID },
      );
      setManageOpen(false);
    }
  }, [manage, packageId, navigate, fetchFullPackage, locale, homePath]);

  return (
    // Radix Popover (portaled to <body>) — the top bar is `overflow-x-auto`,
    // which forces `overflow-y: auto` too, so an `absolute` panel used to be
    // CLIPPED by the header instead of overlaying the canvas. Portaling escapes
    // that clip. Create / manage open the standard dialog + sheet (also
    // portaled), so neither is subject to the header clip either.
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          /* objectui#7368 — the trigger's own read of which state it is in.
             The text beside it is `current?.name ?? packageId`, which is the
             SAME string in all three states for a package that declares no
             name, so the state cannot be recovered from the text. */
          data-pkg-list-state={pkgListState}
          className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[13px] font-medium hover:bg-muted"
          title={t('engine.studio.pkg.switchTitle', locale)}
        >
          {/* objectui#11553 — the package-less scope names itself; there is
              no package id to show as the diagnostic handle. */}
          {packageId === null ? (
            <>
              <Building2 className="h-4 w-4" /> {t('engine.studio.org.name', locale)}
            </>
          ) : (
            <>
              <Boxes className="h-4 w-4" /> {current?.name ?? packageId}
            </>
          )}
          {/* ⛔ Not a replacement for the id (objectui#7368): the id is the one
              diagnostic handle the author has, so the states are told apart by
              what stands NEXT to it, never by swapping it for prose. */}
          {pkgListState === 'loading' && (
            <Loader2
              data-testid="pkg-switcher-loading"
              aria-hidden
              className="h-3 w-3 shrink-0 animate-spin text-muted-foreground"
            />
          )}
          {pkgListState === 'failed' && (
            <span
              data-testid="pkg-switcher-failed"
              title={pkgsErr ?? undefined}
              className="inline-flex items-center gap-0.5 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-normal text-destructive"
            >
              <AlertTriangle className="h-2.5 w-2.5" /> {t('engine.studio.loadFailed', locale)}
            </span>
          )}
          {current && !current.writable && (
            <span className="inline-flex items-center gap-0.5 rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-normal text-amber-600 dark:text-amber-300">
              <Lock className="h-2.5 w-2.5" /> {t('engine.studio.pkg.readonly', locale)}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={6} className="w-80 rounded-lg p-1.5">
            <p className="px-2 pb-1 pt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {t('engine.studio.pkg.heading', locale)}
            </p>
            <div className="max-h-64 overflow-auto">
              {/* Same three-way the Interfaces / Data / Automations rails
                  already spell out in this file — a failed list stops reading
                  "Loading…" forever, and carries WHY. */}
              {pkgListState === 'loading' && (
                <p className="px-2 py-2 text-[11px] text-muted-foreground">{t('engine.studio.loading', locale)}</p>
              )}
              {pkgListState === 'failed' && (
                <p
                  data-testid="pkg-switcher-failed-detail"
                  className="whitespace-pre-line px-2 py-2 text-[11px] text-destructive"
                >
                  {pkgsErr}
                </p>
              )}
              {pkgListState === 'loaded' && pkgs?.length === 0 && (
                <p className="px-2 py-2 text-[11px] text-muted-foreground">{t('engine.studio.pkg.none', locale)}</p>
              )}
              {pkgs?.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    // Re-picking the open package would re-navigate to the same
                    // URL — nothing unmounts, so no veto and no history churn.
                    if (p.id === packageId) return;
                    if (beforeNavigate && !beforeNavigate()) return;
                    navigate(`/studio/${encodeURIComponent(p.id)}/${tab}`);
                  }}
                  className={
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs ' +
                    (p.id === packageId ? 'bg-muted font-medium' : 'hover:bg-muted/60')
                  }
                >
                  <Boxes className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{p.name}</span>
                    <span className="block truncate font-mono text-[10px] text-muted-foreground">{p.id}</span>
                  </span>
                  {p.writable ? (
                    <span className="rounded bg-emerald-400/15 px-1.5 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-300">
                      {t('engine.studio.pkg.writable', locale)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] text-amber-600 dark:text-amber-300">
                      <Lock className="h-2.5 w-2.5" /> {t('engine.studio.pkg.readonly', locale)}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* objectui#11553 — the package-less scope, reachable from every
                package as it is from the Studio home. It lands on its one
                pillar whatever pillar is open here. */}
            <div className="mt-1 border-t pt-1.5">
              <button
                type="button"
                data-testid="studio-org-scope-entry"
                onClick={() => {
                  setOpen(false);
                  if (packageId === null) return;
                  if (beforeNavigate && !beforeNavigate()) return;
                  navigate(studioOrgScopePath());
                }}
                className={
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs ' +
                  (packageId === null ? 'bg-muted font-medium' : 'hover:bg-muted/60')
                }
              >
                <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{t('engine.studio.org.name', locale)}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {t('engine.studio.org.hint', locale)}
                  </span>
                </span>
              </button>
            </div>

            <div className="mt-1 space-y-0.5 border-t pt-1.5">
              {current && (
                <button
                  type="button"
                  onClick={() => void openManage(current.id)}
                  disabled={manageBusy}
                  className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  {manageBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Settings className="h-3.5 w-3.5" />}
                  {t('engine.studio.pkg.manage', locale)}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setCreateOpen(true);
                }}
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> {t('engine.studio.pkg.new', locale)}
              </button>
            </div>
      </PopoverContent>

      <CreatePackageDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => {
          // Same veto as a switch: the jump into the new package unmounts the
          // current pillar. Declining keeps the edits; the created package
          // stays reachable from the list above.
          if (beforeNavigate && !beforeNavigate()) return;
          navigate(`/studio/${encodeURIComponent(id)}/data`);
        }}
      />
      <PackageDetailSheet
        pkg={manage}
        open={manageOpen}
        onOpenChange={setManageOpen}
        onChanged={onManageChanged}
      />
    </Popover>
  );
}

export interface StudioDesignSurfaceProps {
  /** Open-core slot — the cloud edition injects its AI copilot panel here. */
  aiSlot?: React.ReactNode;
}

export function StudioDesignSurface({ aiSlot }: StudioDesignSurfaceProps): React.ReactElement {
  const params = useParams<{ packageId?: string; tab?: string }>();
  // The route segment: a package id, or the package-less scope's reserved
  // segment (objectui#11553, `studioScope.ts`). URLs are built from it.
  const scopeSegment = params.packageId ?? 'com.example.showcase';
  // `null` in the package-less scope. Every package-scoped read, write and
  // publish below keys on this value, so none of them can be handed the
  // reserved segment as though it named a package.
  const packageId: string | null = isStudioOrgScope(scopeSegment) ? null : scopeSegment;
  const tab = params.tab ?? 'interfaces';
  const locale = useMetadataLocale();

  // Courtesy gate (the framework's ADR-0124 D1 — server enforces, client is
  // courtesy): a read-only code/installed package refuses authoring
  // server-side (ADR-0070), so don't let the user build up doomed local edits
  // first — disable the authoring affordances up front. Unknown writability
  // (fetch failed / still loading) stays ungated; the server gate remains the
  // authority either way. `undefined` is "still asking" and `null` is "could
  // not find out": the gate reads both as ungated, and only the Interfaces
  // pillar's `?sel=nav:` deep link tells them apart, so that it does not act
  // on a write state nobody has answered yet (objectui#11153).
  const [pkgWritable, setPkgWritable] = React.useState<boolean | null | undefined>(undefined);
  React.useEffect(() => {
    // objectui#11553 — the package-less scope has no package to look up; its
    // writability is decided below, not fetched.
    if (packageId === null) return;
    let cancelled = false;
    setPkgWritable(undefined);
    fetchPackages()
      .then((list) => {
        if (!cancelled) setPkgWritable(list.find((p) => p.id === packageId)?.writable ?? null);
      })
      .catch((e: unknown) => {
        // Staying ungated is still right — the server gate is the authority
        // and a failed probe must not lock the author out of their own
        // package. But "I could not find out" is not the same event as "still
        // asking", and until objectui#7368 neither one said anything at all.
        // Same toast id as the switcher: one outage, one toast.
        if (cancelled) return;
        setPkgWritable(null);
        toast.error(formatMetadataError(e), { id: PACKAGE_LIST_TOAST_ID });
      });
    return () => {
      cancelled = true;
    };
  }, [packageId]);
  // objectui#11553 — the package-less scope's flows are the organization's
  // own, so they open editable whatever the last package answered. The
  // server's write gate stays the authority, exactly as for a writable package.
  const readOnly = packageId !== null && pkgWritable === false;

  // objectui#2600 — the header's pillar links, Home button and PackageSwitcher
  // are pure SPA client navigation, so the editors' `beforeunload` guard never
  // fires; a dirty pillar unmounts silently and its unsaved edits are gone
  // (Access matrix cells, Interfaces nav). Each pillar mirrors its dirty state
  // up (the PR #2588 `onDirtyChange` contract) and every header-driven
  // departure gates on the same native confirm the pillars use internally.
  // Pillars reset their report on unmount, so a confirmed discard clears the
  // flag by itself.
  const [pillarDirty, setPillarDirty] = React.useState(false);
  const confirmLeavePillar = React.useCallback(() => {
    if (!pillarDirty) return true;
    return window.confirm(t('engine.edit.unsavedLeaveConfirm', locale));
  }, [pillarDirty, locale]);
  // Browser-native "leave site?" prompt on tab close / reload while a pillar
  // is dirty. The matrix editor installs its own (double registration is
  // harmless); the Interfaces nav editor has none, so this closes that gap.
  React.useEffect(() => {
    if (!pillarDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Required for Chrome to actually show the prompt.
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [pillarDirty]);

  // The shared authenticated metadata client for this surface. Declared here
  // rather than beside its other reader below because the publish immediately
  // under it needs the SAME instance: `useMetadataClient` is the layer that
  // hands the console's advisory toast renderer to the client, so the seam is
  // what makes the gate's per-draft findings reach the author (objectui#10039).
  const shellClient = useMetadataClient();

  // Package-level publish (ADR-0033/0037/0048): edits accumulate as per-item
  // drafts STAMPED with this package (each save passes packageId → the draft row's
  // sys_metadata.package_id). Publishing promotes exactly THIS package's drafts in
  // one atomic pass (POST /packages/:id/publish-drafts), reviewed as a whole in
  // DraftChangesPanel. There is no per-item publish.
  const [changesOpen, setChangesOpen] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [publishNonce, setPublishNonce] = React.useState(0); // ↑ → pillars re-read the published baseline
  const [draftNonce, setDraftNonce] = React.useState(0); // ↑ → refresh the pending-draft count

  // objectui#5801 — the shared pending-drafts source: same fetch, same count,
  // and the assistant bus's metadata-refresh pulse keeps this topbar in step
  // with every OTHER surface's publishes (chat bar, home banner) — previously
  // a publish from the right dock never updated this count.
  //
  // objectui#11553 — the package-less scope reads the env-wide feed and counts
  // only what it shows and publishes: package-less FLOW drafts. Still `null`
  // while the feed is unknown, so the header keeps telling unknown from zero.
  const {
    count: feedCount,
    entries: pendingEntries,
    refresh: refreshPending,
  } = usePendingDrafts({ packageId });
  const pendingCount =
    packageId !== null ? feedCount : feedCount === null ? null : pendingEntries.filter(isOrgScopeDraft).length;

  React.useEffect(() => {
    void refreshPending();
  }, [refreshPending, publishNonce, draftNonce]);

  const doPublish = React.useCallback(async () => {
    setPublishing(true);
    try {
      if (packageId === null) {
        // objectui#11553 — the package-less scope has no package to publish
        // as a batch: `POST /packages/:id/publish-drafts` cannot reach a draft
        // bound to none. Each package-less flow draft is promoted BY REFERENCE
        // instead, through the single-item door the client documents for
        // exactly that case (`publishDraft`), as Home's publish-all does for
        // its package-less drafts. Read fresh, never from the header's count,
        // and narrowed to what this scope reviewed: package-less flows.
        const pending = (await fetchPendingDrafts(null)).filter(isOrgScopeDraft);
        const failed: PublishFailure[] = [];
        for (const d of pending) {
          try {
            await shellClient.publishDraft('flow', d.name);
          } catch (e) {
            failed.push({ type: 'flow', name: d.name, error: formatMetadataError(e) });
          }
        }
        if (failed.length > 0) {
          // Not all-or-nothing: the drafts that went live stay live, and the
          // ones that did not are named with the server's own reason.
          toast.error(formatPublishFailures(failed));
        } else {
          toast.success(t('engine.studio.org.published', locale));
          setChangesOpen(false);
        }
        setPublishNonce((n) => n + 1);
        emitMetadataRefresh();
        // The tail below the `finally` is the package path's; this one
        // re-reads the count itself before leaving.
        await refreshPending();
        return;
      }
      // objectui#10039 — through `MetadataClient`, not a bare `fetch`. The
      // route answers the runtime authoring gate's per-draft advisories on
      // each `published[]` element (objectstack#9343), and the client is the
      // seam that reports them: one advisory event per advised item, into the
      // same sink, renderer and wording every other write door on this surface
      // uses. A bare fetch had nothing to report THROUGH. Same move
      // PR objectui#10038 made for the two sibling call sites.
      const payload = (await shellClient.publishPackageDrafts(packageId)) as {
        success?: boolean;
        error?: { message?: string; details?: { issues?: unknown } };
        failed?: PublishFailure[];
      };
      // A non-2xx now throws inside the client, already carrying the server's
      // message AND the field-anchored `error.details.issues` on
      // `MetadataError.issues` — which is exactly what `formatMetadataError`
      // in the catch below reads, so the hard-failure branch keeps its shape
      // without restating it. What is left here is the 2xx batch verdict.
      if (payload?.success === false) {
        // The status is no longer in hand — a non-2xx threw above — so the
        // last rung is a sentence rather than "HTTP 200".
        throw Object.assign(
          new Error(
            // The sibling call site's own last rung for THIS route
            // (`PackagesPage`'s `publishDrafts`), reused rather than a new
            // key: one route, one sentence when the body carried no prose.
            readEnvelopeFailureText(payload) ||
              t('engine.packages.detail.actionFailed', locale),
          ),
          { issues: payload?.error?.details?.issues },
        );
      }
      // `failed[]` off the body the client returns: it unwraps the
      // dispatcher's `{ success, data }` for this route (the one route whose
      // spec declaration says it arrives inside one), so the enveloped and
      // unenveloped compositions read through ONE spelling here.
      const failed = payload?.failed ?? [];
      if (failed.length > 0) {
        // Partial publish: some drafts did NOT go live. The server returns 200
        // with them buried in `failed[]`, so the UI used to claim success and
        // swallow the reason — surface which drafts failed and why instead.
        toast.error(formatPublishFailures(failed));
      } else {
        toast.success(t('engine.studio.publishedAll', locale));
        setChangesOpen(false);
      }
      setPublishNonce((n) => n + 1);
      // objectui#5801 — announce the publish so the chat bar / home banner /
      // draft cards converge without their own polling.
      emitMetadataRefresh();
    } catch (e) {
      toast.error(formatMetadataError(e));
    } finally {
      setPublishing(false);
    }
    await refreshPending();
  }, [shellClient, packageId, refreshPending, locale]);

  const onDraftSaved = React.useCallback(() => setDraftNonce((n) => n + 1), []);
  const hasPending = (pendingCount ?? 0) > 0;
  const publishNoneReasonId = React.useId();

  // Builder → running-app bridge (Airtable's Launch): the builder edits the
  // package (the design surface), the app is its published front-end. If this
  // package ships an app, offer Open app — opened in a new tab so the builder
  // context survives. (App → builder is the reverse bridge, tracked separately.)
  const shellNavigate = useNavigate();
  // objectui#7373 — the header's Home button walks back to the DECLARED
  // landing; the environment launcher only where nothing is declared.
  const shellHomePath = useHomePath();
  // objectui#11181 — `label` is the app's own `I18nLabel` (a plain string or an
  // inline locale map), held as the spec types it and never `String()`ed: a map
  // would read `[object Object]`. Only the presence of `packageApp` is read
  // today; a reader of `label` resolves it in the designer locale at render,
  // through `navItemLabelText`, as the Interfaces rail heading does.
  const [packageApp, setPackageApp] = React.useState<{ name: string; label: I18nLabel } | null>(null);
  // Create app (package has no app yet): create a draft `app` item — the
  // published front-end's on-ramp. The button flips to Open app after the
  // package publish.
  const [appCreating, setAppCreating] = React.useState(false);
  const [appBusy, setAppBusy] = React.useState(false);
  const [appErr, setAppErr] = React.useState<string | null>(null);
  const [appDraftPending, setAppDraftPending] = React.useState<string | null>(null);
  // Scaffold the new app's navigation from the package's objects (default on) —
  // otherwise a fresh app has zero menu items and every object must be wired by
  // hand in the Interfaces pillar (objectui#2262).
  const [appAddObjects, setAppAddObjects] = React.useState(true);

  const loadPackageObjects = React.useCallback(async (): Promise<AppNavSeed[]> => {
    // Published objects + pending DRAFT objects, merged — a fresh package's
    // objects are usually still drafts (same merge the Data pillar rail does).
    // Names only (objectui#11201): a seeded entry carries no label, so nothing
    // here reads one. This used to hand `buildAppSkeleton` each object's label,
    // and a draft's or unlabelled object's machine name in its place.
    // The package-less scope creates no app (objectui#11553): nothing to seed.
    if (packageId === null) return [];
    const [list, draftHeaders] = await Promise.all([
      shellClient.list('object', { packageId }) as Promise<Array<Record<string, unknown>>>,
      shellClient.listDrafts({ packageId, type: 'object' }).catch(() => [] as Array<{ name?: string }>),
    ]);
    const items: AppNavSeed[] = (list || [])
      .map((o) => ({ name: String(o.name ?? '') }))
      .filter((o) => o.name);
    const known = new Set(items.map((o) => o.name));
    for (const d of draftHeaders) {
      if (d.name && !known.has(d.name)) items.push({ name: d.name });
    }
    return items;
  }, [shellClient, packageId]);

  const doCreateApp = React.useCallback(
    async (label: string, name: string) => {
      // The package-less scope offers no Create app (objectui#11553).
      if (packageId === null) return;
      setAppBusy(true);
      setAppErr(null);
      try {
        const navObjects = appAddObjects ? await loadPackageObjects().catch(() => []) : [];
        await shellClient.save(
          'app',
          name,
          buildAppSkeleton(name, label, navObjects),
          { mode: 'draft', packageId },
        );
        toast.success(tFormat('engine.studio.app.savedDraft', locale, { label }));
        setAppDraftPending(label);
        setAppCreating(false);
        setDraftNonce((n) => n + 1);
      } catch (e) {
        setAppErr(formatMetadataError(e));
      } finally {
        setAppBusy(false);
      }
    },
    [appAddObjects, loadPackageObjects, shellClient, packageId, locale],
  );

  // objectui#5800, fixed in passing — the topbar's app detection used to
  // disagree with the Interfaces pillar's (published-only read, no draftNonce
  // dep, no refresh subscription, and never re-run on a pillar switch since
  // /data and /access share one route element): a deep-link to /access could
  // report "This package has no app yet." while /data showed the app at the
  // same moment. Same resolution as the pillar now: published first, DRAFT app
  // fallback, re-resolved on draft saves and on the metadata-refresh pulse.
  const resolvePackageApp = React.useCallback(async (): Promise<void> => {
    // objectui#11553 — no package, so no package app to resolve.
    if (packageId === null) {
      setPackageApp(null);
      return;
    }
    try {
      const apps = (await shellClient.list('app', { packageId })) as Array<Record<string, unknown>>;
      let first = (apps || [])
        .map((a) => ({ name: String(a.name ?? ''), label: (a.label ?? a.name ?? '') as I18nLabel }))
        .filter((a) => a.name)[0];
      if (!first) {
        const drafts = await shellClient.listDrafts?.({ packageId, type: 'app' });
        const d = drafts?.[0] as { name?: unknown; label?: I18nLabel } | undefined;
        if (d?.name) first = { name: String(d.name), label: d.label ?? String(d.name) };
      }
      setPackageApp(first ?? null);
    } catch {
      setPackageApp(null);
    }
  }, [shellClient, packageId]);
  React.useEffect(() => {
    void resolvePackageApp();
    return subscribeMetadataRefresh(() => {
      void resolvePackageApp();
    });
  }, [resolvePackageApp, publishNonce, draftNonce]);

  // ADR-0057 P3 — the decided Studio grid: `[left: nav/tree] [center: canvas +
  // properties] [right: chat]`. NOT keyed on the async agent catalog (that
  // would flip the whole grid after load): on an agent-less env the folded
  // center layout still works; the right dock simply self-gates away. An
  // injected `aiSlot` (the cloud seam, ADR-0080) keeps the legacy left panel
  // — the cloud edition migrates on its own schedule.
  const chatDockMode = !aiSlot;
  // objectui#8219 — the Interfaces pillar's open leaf, lifted to the dock so
  // the copilot's "discussing" chip reads its display label (objectui#7254).
  // Display-only; the agent's context stays URL-derived. Other pillars report
  // nothing, so their chip keeps reading `type · name`.
  const [surfaceLabel, setSurfaceLabel] = React.useState<StudioSurfaceLabel | null>(null);

  /**
   * Host side of the live `?surface=` channel. Producers below the provider —
   * today the pending-changes sheet's security block, which names a draft the
   * publish door would refuse — hand us a surface identity and we put the
   * author in front of it:
   *
   *  - ANOTHER pillar's surface still travels through the URL, because that
   *    pillar is unmounted and its mount-time capture is the mechanism built
   *    for exactly this. Vetoed (`false`) when the author declines to abandon
   *    unsaved edits, so a request never outlives the navigation it needed.
   *  - THIS pillar's surface is the case the capture cannot serve at all —
   *    nothing remounts — so the channel carries it and the pillar applies it
   *    once.
   *
   * Either way the sheet closes: a selection nobody can see is not navigation.
   */
  const requestSurface = React.useCallback(
    (target: SurfaceTarget): boolean | void => {
      const pillar = PILLAR_FOR_SURFACE_TYPE[target.type];
      // objectui#11553 — the package-less scope has one pillar; a surface
      // owned by another is not in this scope, so nothing to navigate to.
      const reachable = packageId !== null || pillar === STUDIO_ORG_SCOPE_PILLAR;
      if (pillar && pillar !== tab && reachable) {
        if (!confirmLeavePillar()) return false;
        shellNavigate(
          `/studio/${scopeSegment}/${pillar}?${DESIGNER_SURFACE_PARAM}=${encodeURIComponent(formatSurfaceParam(target))}`,
        );
      }
      setChangesOpen(false);
    },
    [tab, packageId, scopeSegment, confirmLeavePillar, shellNavigate],
  );

  return (
    <SurfaceDeepLinkProvider onRequest={requestSurface}>
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
        {/* The ADR-0080 `aiSlot` seam — a cloud edition may still inject its own
          * left copilot panel; the built-in copilot is the RIGHT dock below. */}
        {aiSlot ? (
          <aside className="w-64 shrink-0 overflow-auto border-r bg-muted/40">{aiSlot}</aside>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* `overflow-x-auto` — none of Package/pillars/Publish shrink (all
            * `shrink-0`, and PackageSwitcher's trigger is `whitespace-nowrap`),
            * so on a narrow viewport this whole strip overflows instead of any
            * one piece silently clipping off past the screen edge. Scrolling
            * the header is a worse look than a proper responsive redesign, but
            * it guarantees every pillar and the Publish button stay reachable. */}
          <header className="flex items-center gap-3 overflow-x-auto border-b px-3 py-2">
            {/* Never a dead end: walk back to the platform Home / builder landing. */}
            <button
              type="button"
              onClick={() => {
                if (!confirmLeavePillar()) return;
                shellNavigate(shellHomePath);
              }}
              title={t('engine.studio.home', locale)}
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <HomeIcon className="h-4 w-4" />
            </button>
            <div className="shrink-0">
              <PackageSwitcher packageId={packageId} tab={tab} beforeNavigate={confirmLeavePillar} />
            </div>
            <span className="shrink-0 text-muted-foreground">·</span>
            <nav className="flex shrink-0 gap-1">
              {/* objectui#11553 — the package-less scope offers its one pillar. */}
              {(packageId === null ? PILLARS.filter((p) => p.key === STUDIO_ORG_SCOPE_PILLAR) : PILLARS).map((p) => (
                <Link
                  key={p.key}
                  to={`/studio/${scopeSegment}/${p.key}`}
                  onClick={(e) => {
                    // Re-clicking the open pillar re-navigates to the same URL —
                    // nothing unmounts. Modified/aux clicks open a new tab and
                    // leave this one (and its edits) alone; react-router defers
                    // those to the browser, so don't veto them either.
                    if (tab === p.key) return;
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                    if (!confirmLeavePillar()) e.preventDefault();
                  }}
                  className={
                    'inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors ' +
                    (tab === p.key
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground')
                  }
                >
                  <p.Icon className="h-3.5 w-3.5" />
                  {t(`engine.studio.pillar.${p.key}`, locale)}
                </Link>
              ))}
              {/* objectui#5813 — low-frequency surfaces live in "More". The
                  trigger takes the active pillar styling when one of them is
                  open, so the demotion never hides WHERE you are. Each item is
                  a real router Link carrying the SAME dirty-guard as the
                  primary pillars — an overflow entry must not become the one
                  door that silently discards edits. None of them is in the
                  package-less scope (objectui#11553). */}
              {packageId !== null && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    data-testid="studio-nav-more"
                    className={
                      'inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors ' +
                      (OVERFLOW_PILLARS.some((p) => tab === p.key)
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground')
                    }
                  >
                    {OVERFLOW_PILLARS.some((p) => tab === p.key)
                      ? t(`engine.studio.pillar.${tab}`, locale)
                      : t('engine.studio.more', locale)}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-44 p-1">
                  {OVERFLOW_PILLARS.map((p) => (
                    <Link
                      key={p.key}
                      to={`/studio/${scopeSegment}/${p.key}`}
                      onClick={(e) => {
                        if (tab === p.key) return;
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                        if (!confirmLeavePillar()) e.preventDefault();
                      }}
                      className={
                        'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors ' +
                        (tab === p.key
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground')
                      }
                    >
                      <p.Icon className="h-3.5 w-3.5" />
                      {t(`engine.studio.pillar.${p.key}`, locale)}
                    </Link>
                  ))}
                </PopoverContent>
              </Popover>
              )}
            </nav>

            {/* Package-level draft review + one atomic publish (replaces per-item Publish) */}
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {/* objectui#5800 — the Open app teleport is retired: the canvas's
                  Run mode IS the way to try the app without leaving the
                  workbench. The published-app state needs no chrome at all.
                  objectui#11553 — the package-less scope has no app to create. */}
              {packageId === null || packageApp ? null : appDraftPending ? (
                <span
                  title={t('engine.studio.app.willOpenAfterPublish', locale)}
                  className="rounded bg-amber-400/15 px-2 py-0.5 text-[11px] text-amber-600 dark:text-amber-300"
                >
                  {tFormat('engine.studio.app.pending', locale, { label: appDraftPending })}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setAppCreating(true)}
                  disabled={readOnly}
                  title={readOnly ? t('engine.studio.pkg.readonlyHint', locale) : t('engine.studio.app.noneTitle', locale)}
                  className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t('engine.studio.app.create', locale)}
                </button>
              )}
              <button
                type="button"
                onClick={() => setChangesOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <GitBranch className="h-3.5 w-3.5" />
                {t('engine.studio.changes', locale)}{hasPending ? ` · ${pendingCount}` : ''}
              </button>
              {/* objectui#8219 — with nothing to publish, say so on the page
                  rather than only in the hover tooltip. */}
              {!hasPending && !readOnly && !publishing && (
                <span
                  id={publishNoneReasonId}
                  className="text-[11px] text-muted-foreground"
                  data-testid="publish-none-reason"
                >
                  {t('engine.studio.publishNoneTitle', locale)}
                </span>
              )}
              <button
                type="button"
                // Publish is review-then-confirm: open the pending-changes panel,
                // whose footer button fires the actual atomic package publish —
                // never straight from this header click (objectui#2261).
                onClick={() => setChangesOpen(true)}
                disabled={publishing || !hasPending || readOnly}
                aria-describedby={!hasPending && !readOnly && !publishing ? publishNoneReasonId : undefined}
                title={
                  readOnly
                    ? t('engine.studio.pkg.readonlyHint', locale)
                    : hasPending
                      ? t('engine.studio.publishTitle', locale)
                      : t('engine.studio.publishNoneTitle', locale)
                }
                // objectui#8219 — the primary style is for a publish the author
                // CAN do. A disabled one (no draft, or a read-only package)
                // drops to an outline, instead of staying the loudest element
                // on the page dimmed only by `disabled:opacity-50`.
                className={cn(
                  // The border is on both states so the swap never shifts the bar.
                  'inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-medium',
                  publishing || (hasPending && !readOnly)
                    ? 'border-transparent bg-primary text-primary-foreground disabled:opacity-50'
                    : 'text-muted-foreground',
                )}
              >
                {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
                {t('engine.studio.publish', locale)}
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1">
            {/* objectui#11272 — Data and Automations are keyed by package too,
                for the reason written at `InterfacesPillar` below. Unkeyed,
                each list effect kept the open item (it keeps the current one
                on a re-read of the same package, a publish or a copilot
                pulse, as it must), its load did not re-run, and an edit saved
                the previous package's item into the next package.
                objectui#11553 — the package-less scope is keyed the same way,
                by its segment, and serves its one pillar: another pillar's
                URL lands on it rather than on a package pillar with no
                package under it. */}
            {packageId === null ? (
              tab === STUDIO_ORG_SCOPE_PILLAR ? (
                <AutomationsPillar
                  key={scopeSegment}
                  packageId={null}
                  publishNonce={publishNonce}
                  onDraftSaved={onDraftSaved}
                  readOnly={readOnly}
                />
              ) : (
                <Navigate to={studioOrgScopePath()} replace />
              )
            ) : tab === 'data' ? (
              <DataPillar
                key={packageId}
                packageId={packageId}
                publishNonce={publishNonce}
                onDraftSaved={onDraftSaved}
                readOnly={readOnly}
              />
            ) : tab === 'automations' ? (
              <AutomationsPillar
                key={packageId}
                packageId={packageId}
                publishNonce={publishNonce}
                onDraftSaved={onDraftSaved}
                readOnly={readOnly}
              />
            ) : tab === 'access' ? (
              <AccessPillar
                packageId={packageId}
                publishNonce={publishNonce}
                onDraftSaved={onDraftSaved}
                readOnly={readOnly}
                onDirtyChange={setPillarDirty}
              />
            ) : (
              // objectui#11203 / objectui#11232 — keyed by package. A package
              // switch keeps this route mounted, and every piece of the
              // pillar's state is the package's: the app and its nav edit
              // buffer, the nav editor's dirty flag and open editing, the open
              // leaf and its page draft. Kept, they outlived the confirmed
              // discard: the load installed the next package's app under a
              // dirty flag that still stood, and the autosave sent it as a
              // draft; the previous package's page stayed open and saved into
              // the next one. One reset, of all of it. This is a new document,
              // not a data refresh, which Commandment #8 keeps from a key bump.
              <InterfacesPillar
                key={packageId}
                packageId={packageId}
                publishNonce={publishNonce}
                draftNonce={draftNonce}
                onDraftSaved={onDraftSaved}
                onCreateApp={readOnly ? undefined : () => setAppCreating(true)}
                readOnly={readOnly}
                readOnlySettled={pkgWritable !== undefined}
                foldInspector={chatDockMode}
                onDirtyChange={setPillarDirty}
                onSurfaceLabelChange={setSurfaceLabel}
              />
            )}
          </div>
        </div>

        {/* ADR-0057 P3c — the copilot as the shared right dock (same package-
          * scoped build thread as the left panel it replaces; self-gates on the
          * agent catalog like the copilot always has). */}
        {/* objectui#11553 — not in the package-less scope: its build thread
          * is a PACKAGE's, and there is no package here to build into. */}
        {chatDockMode && packageId !== null && (
          <StudioChatDock packageId={packageId} locale={locale} surfaceLabel={surfaceLabel} />
        )}

        {/* objectui#11553 — the package-less scope reviews exactly what its
          * Publish ships: package-less flow drafts, read off the env-wide
          * feed (`packageId` null) and narrowed by `include`. */}
        <DraftChangesPanel
          open={changesOpen}
          onOpenChange={setChangesOpen}
          packageId={packageId}
          include={packageId === null ? isOrgScopeDraft : undefined}
          onPublish={readOnly ? undefined : doPublish}
          publishing={publishing}
        />

        <CreateItemDialog
          open={appCreating}
          onOpenChange={setAppCreating}
          title={t('engine.studio.app.create', locale)}
          labelFieldLabel={t('engine.studio.app.nameLabel', locale)}
          labelPlaceholder={t('engine.studio.app.namePlaceholder', locale)}
          idFieldLabel={t('engine.studio.app.idLabel', locale)}
          idPlaceholder={t('engine.studio.app.idPlaceholder', locale)}
          submitLabel={t('engine.studio.createDraft', locale)}
          submittingLabel={t('engine.studio.creating', locale)}
          busy={appBusy}
          error={appErr}
          locale={locale}
          onSubmit={({ label, name }) => void doCreateApp(label, name)}
          extra={
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={appAddObjects}
                onChange={(e) => setAppAddObjects(e.target.checked)}
                className="h-3.5 w-3.5 accent-primary"
              />
              {t('engine.studio.app.scaffoldNav', locale)}
            </label>
          }
        />
      </div>
    </SurfaceDeepLinkProvider>
  );
}

/**
 * Recursive App-navigation tree: groups, separators and typed leaves.
 *
 * objectui#11791 — the rail draws a `separator` and a leaf's `badge` /
 * `badgeVariant` with the decisions the running app's sidebar makes
 * (`NavigationRenderer` in `@object-ui/layout`, which `UnifiedSidebar` mounts),
 * so the design surface agrees with the app it designs. Mirrored, not
 * imported: the sidebar draws both inline in its row renderer, and its rows
 * are `SidebarMenu` items this rail does not use. The pin that holds the two
 * together renders both: `StudioDesignSurface.railSeparatorBadge-11791.test.tsx`.
 */
function NavTree({
  nodes,
  active,
  onPick,
  objectIcons,
}: {
  nodes: NavNode[];
  active: Surface | null;
  onPick: (s: Surface) => void;
  /** object name → its metadata icon, so object nav items show their own glyph. */
  objectIcons?: Record<string, string | undefined>;
}): React.ReactElement {
  const locale = useMetadataLocale();
  // What a label-less row inherits is asked of the console's own resolver, so
  // the rail names it as the console's sidebar does (objectui#11196).
  const targetLabel = useNavTargetLabel();
  return (
    <>
      {nodes.map((node, i) => {
        // objectui#11158 — the spec types a nav item's `label` as `I18nLabel`,
        // so a locale map rendered raw threw ("Objects are not valid as a
        // React child") and took the whole rail down. Every read below goes
        // through the family's one helper, in the designer locale.
        // objectui#11196 — an ABSENT label shows the text the entry inherits:
        // the runtime's own rule, never a second copy of it.
        // objectui#11791 — a `separator` is a rule between rows, not an entry.
        // It used to fall through to the leaf branch below, which drew it as a
        // disabled, unlabeled button with the generic glyph. The sidebar's
        // decision, mirrored: a decorative `Separator` (`role="none"`), so it
        // is no row to click, no stop for the keyboard, and nothing a screen
        // reader announces. The spec's separator carries `type`, `id` and
        // `order` only, so there is no label or badge to draw.
        if (node.type === 'separator') {
          return <Separator key={node.id ?? i} className="my-2" />;
        }
        const labelText = navEntryLabelText(node, locale, targetLabel);
        if (node.type === 'group' || (Array.isArray(node.children) && node.children.length)) {
          return (
            <div key={node.id ?? i} className="mb-1">
              <p className="flex items-center gap-1 px-2 pb-1 pt-3 text-[11px] text-muted-foreground">
                <Folder className="h-3 w-3" /> {labelText}
              </p>
              <div className="pl-1.5">
                <NavTree nodes={node.children ?? []} active={active} onPick={onPick} objectIcons={objectIcons} />
              </div>
            </div>
          );
        }
        // The same resolver names the Surface a click opens, so the caption,
        // the breadcrumb and the copilot chip read what this row reads.
        const surface = resolveSurface(node, locale, targetLabel);
        // Icon precedence: the nav item's own `icon` (honoured — it was ignored
        // before), then an object surface's own metadata icon, then the
        // type-generic fallback.
        const objIcon = surface?.type === 'object' ? objectIcons?.[surface.name] : undefined;
        const Icon: React.ElementType = node.icon ? getIcon(node.icon) : objIcon ? getIcon(objIcon) : navIcon(node.type);
        // objectui#11774 — the ENTRY is active, not every entry of its target:
        // compared by nav id when both carry one (see `isSameSurface`).
        const isActive = !!surface && !!active && isSameSurface(active, surface);
        return (
          <button type="button"
            key={node.id ?? i}
            onClick={() => surface && onPick(surface)}
            disabled={!surface}
            title={surface ? `${surface.type} · ${surface.name}` : labelText || undefined}
            className={
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs disabled:opacity-40 ' +
              (isActive ? 'bg-muted font-medium' : 'text-foreground/90 hover:bg-muted/60')
            }
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {/* objectui#7254 — a nav item with no declared label used to render
                an EMPTY row. It now shows what it inherits (objectui#11196): its
                target's current label, else the target's internal name, which
                is the fallback #7254 chose. `surface?.name` stays for a label
                that is present but resolves to nothing (an empty map). */}
            <span className="flex-1 truncate">{labelText || surface?.name}</span>
            {/* objectui#11791 — the spec's `badge` / `badgeVariant`, drawn when
                the sidebar row draws them (a present `badge`, a count `0`
                included) with the same `Badge` and the same variant: an absent
                `badgeVariant` is `Badge`'s own default, which is the
                sidebar's. On every leaf, a disabled one too, as the sidebar
                draws it on every entry it draws; never on a group heading,
                where the sidebar draws none. Before the label's kind chip, so
                the pill sits beside the text it qualifies. */}
            {node.badge != null && (
              <Badge variant={node.badgeVariant} className="shrink-0 px-1.5 py-0 text-[10px]">
                {node.badge}
              </Badge>
            )}
            {surface && surface.type !== 'page' && (
              // The kind chip was the raw English metadata type in an otherwise
              // localized rail. `uppercase` is dropped with it: it is a
              // Latin-script affordance that does nothing for CJK and mangles
              // nothing else only by luck.
              <span className="text-[9px] tracking-wide text-muted-foreground/60">
                {translateMetadataType(surface.type, locale)}
              </span>
            )}
          </button>
        );
      })}
    </>
  );
}

/** Interfaces pillar — real App nav · live canvas · inspector. */
/**
 * StudioNavItemInspector — right-panel editor for the selected nav item while
 * editing an app's navigation. The Studio adds flat top-level items
 * (`navigation[i]`), so binding is a business-friendly picker per type (below,
 * objectui#11790) rather than the raw path field of the generic
 * AppNavInspector. For an `object` entry, picking an object
 * writes `{ type: 'object', objectName }` (which the runtime resolves to that
 * object's record list) and leaves the label as it is (objectui#11196, the
 * shape `AppNavInspector`'s picker has). A label-less entry stays label-less,
 * a standard one (objectui#11201, ruling B): its absent label inherits the
 * object's current label at render time, in the viewer's language. It used to
 * adopt the object's label here, stored as a copy (the machine name for a
 * draft or unlabelled object), and then to remove a "New item" placeholder
 * label; the canvas now births an entry label-less (`AppNavCanvas`), so there
 * is no placeholder left to recognise. A present label renders verbatim, so a
 * label the author typed, a locale map, and a legacy stored "New item" are all
 * kept as authored.
 * The comment used to say it writes `{ object }` — the bare
 * spelling `AppSchema` answers with `unrecognized_keys`; the code has always
 * written the canonical key and cleared `object` (objectui#4881).
 *
 * The Label input edits the item's `label`, an `I18nLabel` (a plain string or
 * an inline locale map), through the same `navItemLabel` module as the canvas
 * card beside it (objectui#11148) and `AppNavInspector`'s Label field
 * (objectui#11196), so the three cannot disagree. Its VALUE is the authored
 * text in the designer locale, and its PLACEHOLDER the text the entry inherits
 * (`inheritedNavEntryText`, the runtime's rule with the console's resolver),
 * never a stored value. Typing writes an author label; an edit of a map writes
 * only that locale's entry and keeps every other one. Emptying the field
 * restores inheritance: `clearedLabel` answers what is left, and when that is
 * nothing the `label` key is REMOVED, never written as `''`. It used to read
 * `String(label ?? title ?? name)`, so a map showed as `[object Object]`, and
 * one keystroke wrote a string over the whole map; until objectui#11196 an
 * emptied field wrote `label: ''`, an entry that then showed nothing instead of
 * inheriting. `title` / `name` are not nav-item keys and are not read as the
 * label.
 *
 * Every type the spec declares (objectui#11790). The nav editor's *Add nav
 * item* births an `object` entry and selects it; this inspector's Type choice
 * then offers exactly the members of the spec's `NavigationItemSchema`
 * (`NAV_ENTRY_TYPES`, keyed by the spec-derived `NavigationItemType`). A change
 * of type keeps what describes the entry and drops what it opened
 * (`retypedNavEntry`), so every write is a shape the spec's strict member for
 * that type takes. Each target-bearing type then picks its target from what the
 * package already has — its pages, dashboards, reports, actions, docs and
 * books, published and draft alike, as the object picker reads the pillar's
 * objects — or, for a `component`, from the screens registered with this
 * console; a `url` is typed. A `group` made here is born with no children
 * (this editor edits top-level entries only, so nothing is nested under it
 * from here), and a `separator` carries no label. An entry holding children
 * changes only to a type that keeps them. An
 * entry whose target is not picked yet, or is cleared, stays in the editor and
 * is left out of what a save sends (`navPayloadOf`, objectui#11776).
 *
 * Exported for tests (`StudioDesignSurface.navItemInspector.test.tsx`) — the
 * object picker's canonical-key binding is pinned there directly rather than
 * by driving the whole pillar. Not re-exported from the package index.
 */
export function StudioNavItemInspector({
  navId,
  appDraft,
  objects,
  packageId,
  onNavPatch,
  onClear,
}: {
  navId: string;
  appDraft: Record<string, unknown>;
  objects: Array<{ name: string; label: string }>;
  /** The package whose items the non-object pickers offer (objectui#11790). */
  packageId: string;
  onNavPatch: (patch: Record<string, unknown>) => void;
  onClear: () => void;
}): React.ReactElement {
  const locale = useMetadataLocale();
  // The console's own resolver for what a label-less entry inherits.
  const targetLabel = useNavTargetLabel();
  const typeGroupName = React.useId();
  const idx = React.useMemo(() => {
    const m = /^navigation\[(\d+)\]$/.exec(navId);
    return m ? Number(m[1]) : -1;
  }, [navId]);
  const nav = React.useMemo(
    () => (Array.isArray(appDraft.navigation) ? (appDraft.navigation as Array<Record<string, unknown>>) : []),
    [appDraft],
  );
  const node = idx >= 0 ? nav[idx] : null;
  // A type the spec declares, else `null`: an untyped entry (what an object
  // unbind leaves) or a spelling no member declares.
  const kind: NavigationItemType | null = node && isNavEntryType(node.type) ? node.type : null;
  // Hooks run before the not-found return below; `undefined` fetches nothing.
  const targets = usePackageNavTargets(packageId, kind ? NAV_TARGET_METADATA[kind] : undefined);
  const books = usePackageNavTargets(packageId, kind === 'doc' ? 'book' : undefined);
  if (!node) {
    return (
      <div className="px-2 py-10 text-center text-xs text-muted-foreground">{t('engine.studio.nav.selectItem', locale)}</div>
    );
  }
  const patch = (updates: Record<string, unknown>) => {
    onNavPatch({ navigation: nav.map((n, i) => (i === idx ? { ...n, ...updates } : n)) });
  };
  /** Replace the entry whole: a write that must leave no key behind. */
  const replace = (next: Record<string, unknown>) => {
    onNavPatch({ navigation: nav.map((n, i) => (i === idx ? next : n)) });
  };
  /**
   * Set the entry's target `key`, or remove it when `value` is empty. ⛔ Never
   * written as `''`: a key holding a string is a target the save sends
   * (`navPayloadOf`), and an emptied picker means the entry is unbound again.
   */
  const setTarget = (key: string, value: string) => {
    const next = { ...node };
    if (value) next[key] = value;
    else delete next[key];
    replace(next);
  };
  /** An `action` entry's target is the action it runs: `actionDef.actionName`. */
  const setAction = (actionName: string) => {
    const next = { ...node };
    if (actionName) next.actionDef = { actionName };
    else delete next.actionDef;
    replace(next);
  };
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  // Canonical key FIRST (objectui#4881). `object` is a spelling `AppSchema`
  // rejects with `unrecognized_keys`, so it can only ever appear on a draft
  // that cannot be saved; when a draft carries both, the picker must show the
  // key the schema accepts, never the one it refuses. Whether the fallback
  // read should exist at all — a draft carrying `object` ALONE still displays
  // as bound — is a follow-up card's question, deliberately left out of #4881's scope.
  const boundObject = String(node.objectName ?? node.object ?? '');
  const label = node.label as I18nLabel | undefined;
  /**
   * The Label field's edit (objectui#11196). Typing writes an author label
   * (`renamedLabel`: a map changes only the designer locale's entry). Emptying
   * the field restores inheritance: `clearedLabel` answers what is left, and
   * when that is nothing the `label` key is REMOVED, never written as `''`.
   */
  const editLabel = (value: string) => {
    const next = value === '' ? clearedLabel(label, locale) : renamedLabel(label, value, locale);
    onNavPatch({
      navigation: nav.map((n, i) => {
        if (i !== idx) return n;
        if (next !== undefined) return { ...n, label: next };
        const rest = { ...n };
        delete rest.label;
        return rest;
      }),
    });
  };
  /**
   * Binding an object to this entry. The label is not touched: a label-less
   * entry stays label-less and inherits the object's label (objectui#11201),
   * and a present one renders verbatim (objectui#11196).
   */
  const bindObject = (objName: string) => {
    // Emit a spec-complete ObjectNavItem: the app schema's nav is a
    // discriminated union on `type` and BaseNavItem requires a snake_case
    // `id`. Missing either fails "navigation.0: Invalid input" at save.
    // `object`/`path` are cleared so no stray keys linger from an off-spec
    // draft.
    patch({
      id: (node.id as string) || `nav_${objName}`,
      type: 'object',
      objectName: objName,
      object: undefined,
      path: undefined,
    });
  };
  const optionsOf = (rows: ReadonlyArray<NavTargetRow>) =>
    rows.map((row) => {
      const text = navItemLabelText(row.label, locale).trim();
      return { value: row.name, label: text && text !== row.name ? `${text} (${row.name})` : row.name };
    });
  const str = (v: unknown): string => (typeof v === 'string' ? v : '');
  const actionDef = node.actionDef as { actionName?: unknown } | undefined;
  // Whether the entry names a target for its type yet (a group and a
  // separator name none, and are never unbound).
  const unbound =
    (kind === 'page' && !str(node.pageName)) ||
    (kind === 'dashboard' && !str(node.dashboardName)) ||
    (kind === 'report' && !str(node.reportName)) ||
    (kind === 'url' && !str(node.url)) ||
    (kind === 'component' && !str(node.componentRef)) ||
    (kind === 'action' && !str(actionDef?.actionName)) ||
    (kind === 'doc' && !str(node.doc) && !str(node.book));
  const labelField = (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{t('engine.studio.nav.label', locale)}</label>
      <input
        value={navItemLabelText(label, locale)}
        onChange={(e) => editLabel(e.target.value)}
        placeholder={inheritedNavEntryText(node as NavEntryLike, targetLabel)}
        className="w-full rounded border bg-background px-2 py-1 text-xs"
      />
    </div>
  );
  return (
    <div className="space-y-3">
      <fieldset>
        <legend className="mb-1 block text-[11px] font-medium text-muted-foreground">
          {t('engine.inspector.appNav.typeField', locale)}
        </legend>
        <div className="flex flex-wrap gap-1">
          {NAV_ENTRY_TYPES.map((type) => {
            // An entry holding children changes only to a type that keeps them.
            const disabled = hasChildren && !navTypeAcceptsChildren(type);
            return (
              <label key={type} className={cn('relative', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer')}>
                <input
                  type="radio"
                  name={typeGroupName}
                  value={type}
                  checked={kind === type}
                  disabled={disabled}
                  onChange={() => replace(retypedNavEntry(node, type))}
                  className="peer sr-only"
                />
                <span className="inline-flex rounded border px-1.5 py-0.5 text-[11px] text-muted-foreground peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-foreground peer-focus-visible:ring-1 peer-focus-visible:ring-ring">
                  {t(`engine.inspector.appNav.type.${type}`, locale)}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      {(kind === 'object' || kind === null) && (
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{t('engine.studio.nav.linkObject', locale)}</label>
          <select
            value={boundObject}
            onChange={(e) => {
              const objName = e.target.value;
              if (!objName) {
                // Unbind → back to an (invalid, dropped-on-save) placeholder.
                patch({ type: undefined, objectName: undefined, object: undefined });
                return;
              }
              bindObject(objName);
            }}
            className="w-full rounded border bg-background px-2 py-1 text-xs"
          >
            <option value="">{t('engine.studio.nav.chooseObject', locale)}</option>
            {objects.map((o) => (
              <option key={o.name} value={o.name}>
                {o.label} ({o.name})
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {boundObject ? t('engine.studio.nav.boundHint', locale) : t('engine.studio.nav.unboundHint', locale)}
          </p>
          {objects.length === 0 && (
            <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
              {t('engine.studio.nav.noObjects', locale)}
            </p>
          )}
        </div>
      )}
      {(kind === 'page' || kind === 'dashboard' || kind === 'report') && (
        <NavTargetSelect
          label={t(`engine.inspector.appNav.type.${kind}`, locale)}
          value={str(node[NAV_TARGET_KEY[kind]])}
          options={optionsOf(targets.rows)}
          loading={targets.loading}
          onPick={(v) => setTarget(NAV_TARGET_KEY[kind], v)}
          locale={locale}
        />
      )}
      {kind === 'action' && (
        <NavTargetSelect
          label={t('engine.inspector.appNav.type.action', locale)}
          value={str(actionDef?.actionName)}
          options={optionsOf(targets.rows)}
          loading={targets.loading}
          onPick={setAction}
          hint={t('engine.inspector.appNav.actionHint', locale)}
          locale={locale}
        />
      )}
      {kind === 'component' && (
        <NavTargetSelect
          label={t('engine.inspector.appNav.type.component', locale)}
          value={str(node.componentRef)}
          options={listAppComponents().map((c) => ({
            value: c.ref,
            label: c.label && c.label !== c.ref ? `${c.label} (${c.ref})` : c.ref,
          }))}
          loading={false}
          onPick={(v) => setTarget('componentRef', v)}
          locale={locale}
        />
      )}
      {kind === 'doc' && (
        <>
          <NavTargetSelect
            label={t('engine.inspector.appNav.docPage', locale)}
            value={str(node.doc)}
            options={optionsOf(targets.rows)}
            loading={targets.loading}
            onPick={(v) => setTarget('doc', v)}
            locale={locale}
          />
          <NavTargetSelect
            label={t('engine.inspector.appNav.book', locale)}
            value={str(node.book)}
            options={optionsOf(books.rows)}
            loading={books.loading}
            onPick={(v) => setTarget('book', v)}
            hint={t('engine.inspector.appNav.docHint', locale)}
            locale={locale}
          />
        </>
      )}
      {kind === 'url' && (
        <NavUrlFields
          url={str(node.url)}
          target={str(node.target) || '_self'}
          onUrl={(v) => setTarget('url', v)}
          onTarget={(v) => setTarget('target', v)}
          locale={locale}
        />
      )}
      {unbound && <p className="text-[11px] text-muted-foreground">{t('engine.inspector.appNav.unboundHint', locale)}</p>}
      {kind === 'group' && <p className="text-[11px] text-muted-foreground">{t('engine.inspector.appNav.groupHint', locale)}</p>}
      {kind === 'separator' ? (
        <p className="text-[11px] text-muted-foreground">{t('engine.inspector.appNav.separatorHint', locale)}</p>
      ) : (
        labelField
      )}
      <button
        type="button"
        onClick={onClear}
        className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
      >
        {t('engine.studio.deselect', locale)}
      </button>
    </div>
  );
}

/** A nav target the package holds: its machine name and, when published, its label. */
interface NavTargetRow {
  name: string;
  label?: I18nLabel;
}

/**
 * The metadata type each target-bearing nav type picks its target from
 * (objectui#11790). `object` reads the pillar's own object list, `component`
 * the component registry, and a `url` is typed; a `doc` entry also picks a
 * `book`.
 */
const NAV_TARGET_METADATA: Partial<Record<NavigationItemType, string>> = {
  page: 'page',
  dashboard: 'dashboard',
  report: 'report',
  action: 'action',
  doc: 'doc',
};

/** The key a `page` / `dashboard` / `report` entry names its target with — the spec member's own key. */
const NAV_TARGET_KEY = {
  page: 'pageName',
  dashboard: 'dashboardName',
  report: 'reportName',
} as const;

/**
 * Whether a listed row can be a nav target. A record page needs a record id a
 * `page` entry cannot pass (`isStaticPageOption`), and an action bound to an
 * object is not addressable from the nav, which runs GLOBAL actions only
 * (`useNavActionDispatch`). Only a CONFIRMED one is left out: a draft header
 * carries no body, so a draft-only row is kept, as `isStaticPageOption` keeps
 * a row with no `type`.
 */
function isNavTargetRow(metaType: string, row: Record<string, unknown>): boolean {
  if (metaType === 'page') return isStaticPageOption(row as { type?: string });
  if (metaType === 'action') return !row.objectName;
  return true;
}

/**
 * The package's items of `metaType`, published ∪ draft by name (the published
 * row wins, for its label), as the pillar's object list is read
 * (objectui#11790). `undefined` reads nothing. A failed read leaves the
 * picker empty, as the object picker's does.
 */
function usePackageNavTargets(
  packageId: string,
  metaType: string | undefined,
): { rows: ReadonlyArray<NavTargetRow>; loading: boolean } {
  const client = useMetadataClient();
  const key = metaType ? `${metaType}:${packageId}` : '';
  const [state, setState] = React.useState<{ key: string; rows: NavTargetRow[] } | null>(null);
  React.useEffect(() => {
    if (!metaType) return;
    let cancelled = false;
    (async () => {
      const byName = new Map<string, NavTargetRow>();
      try {
        const [published, drafts] = await Promise.all([
          client.list(metaType, { packageId }) as Promise<Array<Record<string, unknown>> | null | undefined>,
          client.listDrafts({ packageId, type: metaType }).catch(() => [] as Array<{ name?: string | null }>),
        ]);
        for (const row of published ?? []) {
          const name = typeof row?.name === 'string' ? row.name : '';
          if (!name || byName.has(name) || !isNavTargetRow(metaType, row)) continue;
          byName.set(name, { name, label: row.label as I18nLabel | undefined });
        }
        for (const draft of drafts ?? []) {
          const name = typeof draft?.name === 'string' ? draft.name : '';
          if (name && !byName.has(name)) byName.set(name, { name });
        }
      } catch {
        /* non-fatal — the picker just stays empty */
      }
      if (!cancelled) setState({ key, rows: [...byName.values()] });
    })();
    return () => {
      cancelled = true;
    };
  }, [client, packageId, metaType, key]);
  if (!metaType) return { rows: [], loading: false };
  return state?.key === key ? { rows: state.rows, loading: false } : { rows: [], loading: true };
}

/**
 * One nav target picker: the package's items of one type, plus the entry's own
 * target when the list does not hold it (a target another package owns, or a
 * list still loading), so a bound entry never reads as unbound.
 */
function NavTargetSelect({
  label,
  value,
  options,
  loading,
  onPick,
  hint,
  locale,
}: {
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  loading: boolean;
  onPick: (value: string) => void;
  hint?: string;
  locale: string;
}): React.ReactElement {
  const id = React.useId();
  const shown = value && !options.some((o) => o.value === value) ? [{ value, label: value }, ...options] : options;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[11px] font-medium text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onPick(e.target.value)}
        className="w-full rounded border bg-background px-2 py-1 text-xs"
      >
        <option value="">{t('engine.inspector.appNav.choose', locale)}</option>
        {shown.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
      {!loading && options.length === 0 && (
        <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">{t('engine.inspector.appNav.noTargets', locale)}</p>
      )}
    </div>
  );
}

/** A `url` entry's address, typed, and the window it opens in. */
function NavUrlFields({
  url,
  target,
  onUrl,
  onTarget,
  locale,
}: {
  url: string;
  target: string;
  onUrl: (value: string) => void;
  onTarget: (value: string) => void;
  locale: string;
}): React.ReactElement {
  const urlId = React.useId();
  const targetId = React.useId();
  return (
    <div className="space-y-2">
      <div>
        <label htmlFor={urlId} className="mb-1 block text-[11px] font-medium text-muted-foreground">
          {t('engine.inspector.appNav.url', locale)}
        </label>
        <input
          id={urlId}
          type="url"
          value={url}
          onChange={(e) => onUrl(e.target.value)}
          placeholder="https://"
          className="w-full rounded border bg-background px-2 py-1 font-mono text-xs"
        />
      </div>
      <div>
        <label htmlFor={targetId} className="mb-1 block text-[11px] font-medium text-muted-foreground">
          {t('engine.inspector.appNav.urlTarget', locale)}
        </label>
        <select
          id={targetId}
          value={target}
          onChange={(e) => onTarget(e.target.value)}
          className="w-full rounded border bg-background px-2 py-1 text-xs"
        >
          <option value="_self">{t('engine.inspector.appNav.urlTargetSelf', locale)}</option>
          <option value="_blank">{t('engine.inspector.appNav.urlTargetBlank', locale)}</option>
        </select>
      </div>
    </div>
  );
}

/** The Interfaces pillar's leaf identity, `type:name` (`:` when none is open). */
const leafKeyOf = (s: Surface | null): string => `${s?.type ?? ''}:${s?.name ?? ''}`;

export function InterfacesPillar({
  packageId,
  publishNonce = 0,
  draftNonce = 0,
  onDraftSaved,
  onCreateApp,
  readOnly = false,
  readOnlySettled = true,
  foldInspector = false,
  onDirtyChange,
  onSurfaceLabelChange,
}: {
  packageId: string;
  publishNonce?: number;
  /** Bumped when a draft is saved elsewhere (e.g. the header's create-app flow) — a
   * re-resolve signal so a just-created app appears without a reload. */
  draftNonce?: number;
  onDraftSaved?: () => void;
  /** Invoked from the empty state when this package has no app, to open the
   * header's create-app flow (single source of truth for app creation). */
  onCreateApp?: () => void;
  /** Courtesy gate: hide/disable interface-authoring affordances — nav
   * editing, the canvas's in-place edits and every editor in the right rail
   * (the block inspector, the default inspector, a source page's code editor)
   * included. Both autosaves below are blocked on it, so an affordance that
   * ignored it would take an edit on screen and silently discard it
   * (objectui#11136). */
  readOnly?: boolean;
  /** objectui#11153 — false while the package's write state is still being
   * asked for: the Studio surface learns it from the package list, its own
   * request, not ordered against this pillar's app draft. Only the
   * `?sel=nav:` deep link reads it, and waits on it rather than read the
   * unknown state as writable. Defaults to true: a caller that passes
   * `readOnly` outright has settled it. */
  readOnlySettled?: boolean;
  /** ADR-0057 P3c — the chat dock owns the right side, so the inspector folds
   * into center `[canvas | properties]` tabs instead of its own right aside.
   * Default false → the classic three-zone layout, pixel-identical. */
  foldInspector?: boolean;
  /** objectui#2600 — mirrors the unsaved-nav-edit state (`navDirty`) up to the
   * Studio header, whose pillar/Home/package navigation unmounts this whole
   * pillar (SPA nav, so no beforeunload). Reports `false` on unmount so a
   * confirmed discard clears the surface's guard. */
  onDirtyChange?: (dirty: boolean) => void;
  /** objectui#8219 — reports the open leaf's display label (tagged with the
   * leaf's type and name) up to the surface that mounts the copilot dock, for
   * its "discussing" chip. A label-less leaf reports the text it inherits
   * (objectui#11196), so the chip reads what the rail reads. `null` when no
   * leaf is open, when its display text is empty (a label that is present but
   * resolves to nothing), and on unmount. */
  onSurfaceLabelChange?: (surface: StudioSurfaceLabel | null) => void;
}): React.ReactElement {
  const client = useMetadataClient();
  const locale = useMetadataLocale();
  // See DataPillar's rail — same mobile-overlay treatment for the nav tree.
  const isMobile = useIsMobile();
  const [railOpen, setRailOpen] = React.useState(false);

  // objectui#11181 — the app's own `label`, held as the spec types it
  // (`I18nLabel`: a plain string or an inline locale map) and resolved at render
  // in the designer locale, so the rail heading follows a designer-language
  // switch as the nav rows do. ⛔ Never `String()` it: a map reads
  // `[object Object]`.
  const [appLabel, setAppLabel] = React.useState<I18nLabel>(packageId);
  const [appName, setAppName] = React.useState<string | null>(null);
  const [appDraft, setAppDraft] = React.useState<Record<string, unknown>>({});
  // objectui#11272 — the app `appDraft` was loaded for, `app:NAME`: written
  // where the app load installs it, and nowhere else.
  const [appDraftFor, setAppDraftFor] = React.useState('');
  // objectui#11167 — the app document as the server holds it, as far as this
  // pillar knows: written where the load below installs `appDraft` and where a
  // nav save lands. `appDraft` is also the nav edit buffer, so this is what a
  // read-only answer puts back (see the effect below).
  const navBaselineRef = React.useRef<Record<string, unknown>>({});
  const navTree = React.useMemo<NavNode[]>(
    () => (Array.isArray(appDraft.navigation) ? (appDraft.navigation as NavNode[]) : []),
    [appDraft],
  );
  // nav editing — drag-drop reorder / rename / add / remove via AppNavCanvas
  const [editNav, setEditNav] = React.useState(false);
  const [navSel, setNavSel] = React.useState<{ kind: string; id: string } | null>(null);
  const [navDirty, setNavDirty] = React.useState(false);
  // objectui#11776 — the last nav save's failure, the nav editor's own: shown
  // in the canvas banner beside the pillar's `error` until a nav save lands,
  // or the buffer it was about is put back. Held apart from `error` so a nav
  // save that lands clears its own failure and never one a leaf load or save
  // is still showing. objectui#11785 — held as a refusal: the author sentence,
  // the nav entry it names, and the raw text behind Details.
  const [navError, setNavError] = React.useState<StudioRefusal | null>(null);

  // App resolution status — tells "still loading" apart from "this package has
  // no app", so the canvas shows a real empty state instead of an endless
  // spinner.
  const [appStatus, setAppStatus] = React.useState<'loading' | 'ready' | 'missing'>('loading');

  // objectui#11167 — a read-only answer closes nav editing. The Studio surface
  // learns the package's write state from its own request (see
  // `readOnlySettled`), and an unknown state stays ungated, so the toggle is on
  // offer while that request is in flight: an author can open nav editing, and
  // edit, before `writable: false` arrives. The nav autosave is blocked on
  // `readOnly`, and the server refuses authoring on a read-only package
  // (ADR-0070), so from that answer on nothing in the buffer can be saved.
  //  - Editing closes the way the toggle closes it: `editNav` and `navSel`
  //    reset, and the nav-item inspector (it needs both) goes with them.
  //  - An unsaved edit is put back to the baseline, which the toggle does not
  //    do: on a writable package a buffer kept at "Done" still has an autosave
  //    to reach, and here it has none. Kept, it would stay on screen in the rail
  //    as if it were the package's navigation, and hold the leave guard and the
  //    copilot refresh (both keyed on `navDirty`) for good.
  // Declared BEFORE the `?sel=nav:` deep link below on purpose: effects run in
  // declaration order, and the answer that closes editing is also the one
  // that settles a pending link, so the link applies after the close and its
  // read-only selection is not cleared by it. Both read the same `readOnly`.
  React.useEffect(() => {
    if (!readOnly) return;
    if (editNav) {
      setEditNav(false);
      setNavSel(null);
    }
    if (navDirty) {
      setAppDraft(navBaselineRef.current);
      setNavDirty(false);
      // objectui#11776 — a failure of the buffer just put back is moot.
      setNavError(null);
    }
  }, [readOnly, editNav, navDirty]);

  // #2272 — designer deep-link: `?sel=nav:<id>` selects the nav item with
  // that spec `id` and switches the pillar into nav editing. The id is the
  // stable external contract; positional `navigation[i]` selection ids stay
  // internal. Selection changes mirror back to the URL (replace).
  // objectui#11153 — the shared hook keeps the param until the app draft has
  // loaded, and on a read-only package selects the item without entering nav
  // editing (whose autosave is blocked there). The pillar reads only the
  // `navigation` root key, so that is the document the link resolves against.
  const navDoc = React.useMemo(() => ({ navigation: navTree }), [navTree]);
  useNavSelDeepLink({
    enabled: true,
    draft: navDoc,
    loaded: appStatus === 'ready',
    readOnly: readOnlySettled ? readOnly : undefined,
    selection: navSel,
    onApply: (hit, { enterEditing }) => {
      if (enterEditing) setEditNav(true);
      setNavSel({ kind: 'nav', id: hit.selectionId });
    },
  });
  // Mirror `navDirty` up to the surface (see the onDirtyChange prop doc).
  // Ref-stabilized like PermissionMatrixEditPage's report, so a non-memoized
  // callback prop doesn't refire the effect; the unmount cleanup reports
  // `false` so a deliberately-discarded pillar clears the host's guard state.
  const onDirtyChangeRef = React.useRef(onDirtyChange);
  React.useEffect(() => {
    onDirtyChangeRef.current = onDirtyChange;
  });
  React.useEffect(() => {
    onDirtyChangeRef.current?.(navDirty);
  }, [navDirty]);
  // objectui#11189 — `navDirty` as last committed, for the app load, which
  // installs what it read after an await. The same state, read late; only this
  // effect writes it. (A nav save completing reads the autosave's claim on the
  // buffer it sent instead, objectui#11204.)
  const navCommittedRef = React.useRef({ dirty: navDirty });
  React.useEffect(() => {
    navCommittedRef.current = { dirty: navDirty };
  }, [navDirty]);
  React.useEffect(
    () => () => {
      onDirtyChangeRef.current?.(false);
    },
    [],
  );
  const [navHasDraft, setNavHasDraft] = React.useState(false);
  const [navSaving, setNavSaving] = React.useState<false | 'draft' | 'publish'>(false);
  // objectui#11773 — two buffers, two guards: the open leaf's `draft` and the
  // app document `appDraft` the nav editor saves. Each sends the version its
  // own buffer was saved at; a conflict's "reload" re-runs that buffer's load.
  const [leafReloadNonce, setLeafReloadNonce] = React.useState(0);
  const reloadLeafDraft = React.useCallback(() => setLeafReloadNonce((n) => n + 1), []);
  const {
    save: saveLeafDraft,
    forget: forgetLeafVersion,
    dialog: leafConflictDialog,
  } = useDraftSaveGuard(client, reloadLeafDraft);
  const [navReloadNonce, setNavReloadNonce] = React.useState(0);
  // A reload replaces the buffer even over an unsent edit: the author chose
  // the saved version over it.
  const reloadNavDraft = React.useCallback(() => {
    setNavDirty(false);
    setNavReloadNonce((n) => n + 1);
  }, []);
  const {
    save: saveNavDraft,
    forget: forgetNavVersion,
    dialog: navConflictDialog,
  } = useDraftSaveGuard(client, reloadNavDraft);
  // The app load also re-reads after every draft save in the package (the
  // `draftNonce` it keys on), its own included. The re-read that follows this
  // pillar's own nav save installs what that save wrote, so the version stays;
  // any other install forgets it. Holds the `publishNonce` the save landed
  // under: a publish in between dropped the draft, version and all.
  const navEchoRef = React.useRef<number | null>(null);
  // objectui#7255 — the copilot dock shares this document, so a turn that
  // staged/published metadata converges the rail here instead of waiting for a
  // page reload. HELD while the nav editor has unsaved (or in-flight) edits:
  // this pillar's load rehydrates `appDraft`, which IS the nav edit buffer, so
  // an unheld pulse would overwrite the author mid-drag. The hold defers, it
  // does not drop — autosave clears `navDirty` within a beat and the pulse
  // lands then.
  const metadataRefreshNonce = useMetadataRefreshNonce(navDirty || !!navSaving);
  const [current, setCurrent] = React.useState<Surface | null>(null);
  // objectui#11196 — the open leaf's Surface names a label-less entry by what
  // it inherits, asked of the console's own resolver, as the rail's rows ask
  // it. The app load reads it through this ref after its awaits: the latest
  // resolver, and never a dependency of that effect, whose re-run rehydrates
  // the nav edit buffer. (Commandment #10: nothing here rests on the hook's
  // memoised identity.)
  const targetLabel = useNavTargetLabel();
  const targetLabelRef = React.useRef(targetLabel);
  React.useEffect(() => {
    targetLabelRef.current = targetLabel;
  });
  // `?surface=` capture + mirror — shared plumbing (see useSurfaceDeepLink).
  const initialSurface = useSurfaceDeepLink(current);
  // objectui#8219 — lift the open leaf's label to the dock (see the prop doc).
  // Keyed on the primitives, and the callback read through a ref, so neither a
  // re-created Surface object nor a non-memoized callback refires the report.
  const onSurfaceLabelChangeRef = React.useRef(onSurfaceLabelChange);
  React.useEffect(() => {
    onSurfaceLabelChangeRef.current = onSurfaceLabelChange;
  });
  const currentType = current?.type;
  const currentName = current?.name;
  const currentLabel = current?.label;
  React.useEffect(() => {
    onSurfaceLabelChangeRef.current?.(
      currentType && currentName && currentLabel
        ? { type: currentType, name: currentName, label: currentLabel }
        : null,
    );
  }, [currentType, currentName, currentLabel]);
  React.useEffect(
    () => () => {
      onSurfaceLabelChangeRef.current?.(null);
    },
    [],
  );
  // Inspector tab — source pages carry a `source` string, not a block tree, so
  // their editor lives in a dedicated Source tab (the Properties tab has no
  // blocks to inspect). Non-source surfaces never show the tab strip.
  const [inspectorTab, setInspectorTab] = React.useState<'props' | 'source'>('source');
  const [draft, setDraft] = React.useState<Record<string, unknown>>({});
  // objectui#11272 — the leaf `draft` was loaded for, as `leafKeyOf` spells
  // it: written where the load below installs a buffer, and nowhere else.
  const [draftFor, setDraftFor] = React.useState('');
  // objectui#7137 — the block selection is STAMPED with the leaf it was made
  // on, so it expires BY CONSTRUCTION when the leaf changes — the same shape
  // `blockingReport` already uses against `inspectorKey` below, and the reason
  // that one cannot be stranded either.
  //
  // The previous shape was a bare `MetadataSelection | null` whose ONLY clear
  // lived inside the draft-load effect, *after* its
  // `if (!current || !isEditable) … return` guard. So the clear never ran on any
  // leaf where `isEditable` is false, and `isEditable = !!Preview && !StudioCanvas`
  // is a conjunction — that is a studio-canvas leaf OR a leaf whose own type has
  // no registered designer. Walking to either carried a selection describing a
  // block on the PREVIOUS leaf's canvas. Measured before the repair: the scoped
  // inspector mounted three times as `page:home_page:block:blk_1` with `blk_1` a
  // dashboard block, and in the folded layout `hasInspectorTarget` stayed true
  // across the leaf change so `nextCenterTab` saw no edge and stranded the author
  // on Properties ("expected 'Properties' to be 'Canvas'").
  //
  // ⛔ Deliberately NOT repaired by hoisting that imperative clear above the
  // guard. Two reasons, the first measured: a clear in an effect runs one
  // COMMITTED render after the leaf change, so the foreign-block inspector still
  // mounts and runs its effects before being torn down — keying it to the leaf
  // makes `selection` null in the SAME render. And an imperative clear is what
  // this defect was: a guard added later stranded it, and the next guard could
  // strand it again.
  const leafKey = leafKeyOf(current);
  const [selectionState, setSelectionState] = React.useState<{
    key: string;
    value: MetadataSelection | null;
  }>({ key: '', value: null });
  const selection = selectionState.key === leafKey ? selectionState.value : null;
  const setSelection = React.useCallback(
    (next: MetadataSelection | null) => setSelectionState({ key: leafKey, value: next }),
    [leafKey],
  );
  // ADR-0057 P3c — the folded-layout center tab (canvas | properties). The
  // auto-switch below reacts to inspector-target EDGES (select a block → jump
  // to Properties; deselect → back to Canvas) while preserving a manual choice
  // in steady state — see nextCenterTab. Inert when `foldInspector` is off.
  const [centerTab, setCenterTab] = React.useState<StudioCenterTab>('canvas');
  // Folded layout, wide viewport (xl+, #2477 item 3 — was 2xl): enough room to
  // show canvas AND properties side by side beside the chat dock — no tabs, no
  // auto-switch.
  const isWide = useIsWideViewport();
  const showFoldedTabs = foldInspector && !isWide;
  // The right-hand properties aside can be collapsed to a thin rail to give the
  // canvas (and the chat dock beside it) more room — in-memory, per-mount. Only
  // meaningful in the aside layouts (`!showFoldedTabs`); the narrow center-tabs
  // layout already toggles properties as a tab, so it ignores this.
  //
  // objectui#11658 — an arrival that asks for the run-mode landing (the
  // post-build transition, see `studioLanding.ts`) opens on 「运行」 with this
  // aside collapsed: the running app, full width beside the chat. Read once, at
  // mount. The collapse is the landing's, not the user's, so the first switch
  // to 「设计」 hands the properties back (see `landingCollapsedRef`).
  const location = useLocation();
  const [landedInRun] = React.useState(() => isStudioRunLanding(location.state));
  const [inspectorCollapsed, setInspectorCollapsedState] = React.useState(landedInRun);
  const landingCollapsedRef = React.useRef(landedInRun);
  // Any explicit collapse/expand by the user ends the landing's claim on it.
  const setInspectorCollapsed = React.useCallback((collapsed: boolean) => {
    landingCollapsedRef.current = false;
    setInspectorCollapsedState(collapsed);
  }, []);
  const canCollapseInspector = !showFoldedTabs;
  const hasInspectorTarget = Boolean((editNav && navSel) || selection);
  const prevInspectorTargetRef = React.useRef(hasInspectorTarget);
  React.useEffect(() => {
    if (!showFoldedTabs) return;
    const hadTarget = prevInspectorTargetRef.current;
    prevInspectorTargetRef.current = hasInspectorTarget;
    setCenterTab((cur) => nextCenterTab(cur, hadTarget, hasInspectorTarget));
  }, [showFoldedTabs, hasInspectorTarget]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState<false | 'draft' | 'publish'>(false);
  const [hasDraft, setHasDraft] = React.useState(false);
  // objectui#11785 — a load failure as it was (`plainRefusal`), a refused leaf
  // save as an author sentence with the raw text behind Details.
  const [error, setError] = React.useState<StudioRefusal | null>(null);
  // Objects in THIS package (published ∪ draft) — the nav item inspector's
  // object picker, so nav can be wired to sibling objects before publishing.
  const [pkgObjects, setPkgObjects] = React.useState<Array<{ name: string; label: string; icon?: string }>>([]);
  const objectIconMap = React.useMemo(
    () => Object.fromEntries(pkgObjects.map((o) => [o.name, o.icon])),
    [pkgObjects],
  );

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pub, drafts] = await Promise.all([
          client.list('object', { packageId }) as Promise<Array<Record<string, unknown>>>,
          client.listDrafts({ packageId, type: 'object' }).catch(() => [] as Array<Record<string, unknown>>),
        ]);
        if (cancelled) return;
        const byName = new Map<string, { name: string; label: string; icon?: string }>();
        for (const raw of [...(pub || []), ...(drafts || [])]) {
          const o = raw as Record<string, unknown>;
          const name = String(o.name ?? '');
          if (!name || byName.has(name)) continue;
          byName.set(name, { name, label: String(o.label ?? o.name ?? name), icon: o.icon ? String(o.icon) : undefined });
        }
        setPkgObjects([...byName.values()]);
      } catch {
        /* non-fatal — picker just stays empty */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, packageId, publishNonce, draftNonce, metadataRefreshNonce]);

  // Resolve THIS package's App → load its navigation tree. The query is scoped
  // to the package (`list('app', { packageId })`) so a design surface only ever
  // shows the current package's app — never another package's. `list()` sees
  // published metadata only, so a freshly-created (unpublished) app is found via
  // `listDrafts()` instead, keeping it designable before its first publish.
  //
  // objectui#7255 — which package we are resolving, so a RE-read of the same
  // package (a publish, a draft save, a copilot pulse) refreshes in place while
  // a genuine package switch still shows the loading state. Without this the
  // status flapped `ready → loading → ready` on every pulse and the nav
  // toolbar (gated on `ready`) blinked once per copilot turn: rebuilding UI for
  // a data refresh, which is exactly what AGENTS.md Commandment #8 forbids.
  const appIdentityRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    const isSameApp = appIdentityRef.current === packageId;
    appIdentityRef.current = packageId;
    if (!isSameApp) setAppStatus('loading');
    (async () => {
      try {
        const published = (await client.list('app', { packageId })) as Array<Record<string, unknown>>;
        if (cancelled) return;
        let name = published?.[0]?.name ? String(published[0].name) : null;
        let label: I18nLabel = published?.[0]
          ? ((published[0].label ?? published[0].name ?? packageId) as I18nLabel)
          : packageId;
        if (!name) {
          const drafts = await client.listDrafts({ packageId, type: 'app' });
          if (cancelled) return;
          const d = drafts?.[0];
          if (d?.name) {
            name = String(d.name);
            label = String(d.name);
          }
        }
        if (!name) {
          setAppStatus('missing');
          return;
        }
        setAppLabel(label);
        setAppName(name);
        const [layRaw, appDraftResp] = await Promise.all([
          client.layered<Record<string, unknown>>('app', name),
          client.getDraft<Record<string, unknown>>('app', name).catch(() => null),
        ]);
        if (cancelled) return;
        const lay = layRaw as { effective?: Record<string, unknown>; code?: Record<string, unknown> };
        const eff = (lay.effective ?? lay.code ?? {}) as Record<string, unknown>;
        const appDraftBody = extractDraftBody(appDraftResp);
        // A served draft is the whole document — taken as-is, never spread
        // over the published layer (objectui#10765; the rule is stated once
        // at `ResourceEditPage`'s load effect). Baseline only when no draft.
        const body = appDraftBody ?? eff;
        // The body's own label, else its name; a body with neither keeps the
        // list row's. A locale map is taken as it is, not stringified.
        const bodyLabel = (body.label ?? body.name) as I18nLabel | undefined;
        if (bodyLabel != null) setAppLabel(bodyLabel);
        // objectui#11189 — a re-read of the same package (a save's
        // draft-saved signal, a publish, a copilot pulse) does not install
        // the served draft over a buffer holding an unsent nav edit, taken
        // before this read or while it was in flight. It defers: the save
        // that sends the edit signals again, and that re-read installs. A
        // package switch replaces the buffer, as it always has.
        if (!isSameApp || !navCommittedRef.current.dirty) {
          setAppDraft(body);
          setAppDraftFor(`app:${name}`);
          // objectui#11773 — a read serves no version, unless it is the read-back
          // of this pillar's own nav save (see `navEchoRef`).
          if (!isSameApp || navEchoRef.current !== publishNonce) forgetNavVersion();
          navEchoRef.current = null;
        }
        navBaselineRef.current = body;
        setNavHasDraft(!!appDraftBody);
        setAppStatus('ready');
        const tree = Array.isArray(body.navigation) ? (body.navigation as NavNode[]) : [];
        // auto-open the first resolvable leaf. Its label is resolved in the
        // designer locale of this load, like the rail's (objectui#11158), and
        // a label-less leaf's with the rail's resolver (objectui#11196).
        // `locale` is deliberately not a dependency of this effect: a language
        // switch must not re-run the load, which rehydrates the nav edit buffer.
        const resolveTarget = targetLabelRef.current;
        const firstLeaf = (function find(nodes: NavNode[]): Surface | null {
          for (const n of nodes) {
            if (n.type === 'group' || n.children?.length) {
              const r = find(n.children ?? []);
              if (r) return r;
            } else {
              const s = resolveSurface(n, locale, resolveTarget);
              if (s) return s;
            }
          }
          return null;
        })(tree);
        // A `?surface=` deep-link wins over the first-leaf default when it
        // still resolves to a leaf in this app's nav; otherwise fall back.
        // Its `?nav=` entry id, when that entry still exists, picks the entry
        // among several that open one target (objectui#11774).
        const deepLinked = initialSurface ? findSurfaceInTree(tree, initialSurface, locale, resolveTarget) : null;
        setCurrent((cur) => cur ?? deepLinked ?? firstLeaf);
      } catch (e) {
        if (!cancelled) {
          setError(plainRefusal(e));
          setAppStatus('missing');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, packageId, publishNonce, draftNonce, metadataRefreshNonce, navReloadNonce, forgetNavVersion]);

  const Preview = getMetadataPreview(current?.type ?? '');
  // Studio-canvas surface override: the SAME type can render as a different
  // surface here than in the Data pillar. Only `object` opts in today (→ the
  // runtime records grid, not the field-form designer that is `object`'s
  // MetadataPreview). Overridable/extendable via `registerStudioCanvasPreview`.
  const StudioCanvas = getStudioCanvasPreview(current?.type ?? '');
  // objectui#11774 — the entry the canvas is open on (its id, and an object
  // entry's `filters` / `viewName`), handed to the studio canvas beside its
  // props. Read by value downstream, never by this object's identity.
  const canvasNavEntry = React.useMemo<StudioCanvasNavEntry | null>(
    () => (current ? { navId: current.navId, filters: current.filters, viewName: current.viewName } : null),
    [current],
  );
  const Inspector = getMetadataInspector(current?.type ?? '');
  // The "home" (no-selection) inspector for the surface type — e.g. a page's
  // interfaceConfig form. Interface/list pages (kanban/calendar boards) have no
  // block tree, so `selection` never populates; without this the panel would
  // sit permanently on the "click a block" empty state.
  const DefaultInspector = getMetadataDefaultInspector(current?.type ?? '');
  // objectui#6795 part C — WHY the three reads above can be `undefined` decides
  // what this pillar may truthfully say, and there are exactly two causes:
  //   1. no designer is registered for THIS type (others are) — a product fact;
  //   2. the registries are empty wholesale, because the module-scope
  //      registration side effect has not run — an environment fact.
  // The retired copy asserted (2)'s cause with (1)'s wording ("design support is
  // in progress") on a branch that renders no preview at all, so it was false
  // either way. `list*Types()` is a read of the SAME already-imported registry
  // module, so telling the two apart costs nothing and invents no state.
  //
  // ⛔ Neither branch may promise recovery. These registries are plain `Map`s
  // with no change notification and every read here happens during render with
  // no subscription, so a consumer that reads an empty registry never recovers
  // when registration lands later (measured on #6795: "still fallback after
  // registration: true | late inspector rendered: false"). "Loading…" / "try
  // again" would swap one false statement for another; making recovery real is
  // part A of that card.
  const designersUnregistered =
    listMetadataPreviewTypes().length === 0 && listMetadataInspectorTypes().length === 0;
  // Blocking author-time issues the right-rail inspector is showing — a CEL
  // predicate that does not parse must not be saveable here either
  // (objectui#4527). #4306 wired the Data pillar only, which left the SAME
  // malformed-CEL publish reachable through this pillar with the gate inert.
  //
  // One hold serves both rail branches, stamped with which of them produced it
  // and with the selection it described, so it expires by construction when the
  // selection changes, when the rail swaps scoped for default, or when the leaf
  // changes — an unmounted inspector can never retract its last verdict.
  const [blockingReport, setBlockingReport] = React.useState({ key: '', count: 0 });
  const inspectorKey = `${leafKey}:${selection ? `${selection.kind}:${selection.id}` : 'default'}`;
  const inspectorBlocking = blockingReport.key === inspectorKey ? blockingReport.count : 0;
  // A studio-canvas surface (e.g. object → runtime records grid) renders the
  // running app, not an editable draft — schema editing is the Data pillar's
  // job — so those leaves are not draft-editable in this canvas.
  const isEditable = !!Preview && !StudioCanvas;
  // objectui#5800 — Design ⇄ Run: one canvas, two modes (ADR-0080's pivot made
  // visible). Run mode is pure subtraction: `editing=false` drops the design
  // overlays (dashboard widget overlays, page block canvas) and the SAME
  // renderer serves the interactive runtime — click New, enter a record.
  // Selection state is retained so switching back to design keeps context.
  const [canvasMode, setCanvasModeState] = React.useState<'design' | 'run'>(landedInRun ? 'run' : 'design');
  const designing = canvasMode === 'design';
  // objectui#11658 — 「设计」 is one click from the run-mode landing: the first
  // switch to it also re-opens the properties aside the landing collapsed.
  const setCanvasMode = React.useCallback((mode: 'design' | 'run') => {
    setCanvasModeState(mode);
    if (mode === 'design' && landingCollapsedRef.current) {
      landingCollapsedRef.current = false;
      setInspectorCollapsedState(false);
    }
  }, []);
  // `kind: 'html'`/`'react'` pages are a `source` string (ADR-0080/0081),
  // rendered by SourcePageEditor as a code-editor + live-preview split — there
  // is no block tree, so `selection` never populates and the generic "click a
  // block" Properties empty state below would otherwise be permanently dead
  // for these pages.
  const sourcePageKind = current?.type === 'page' ? (draft as { kind?: string })?.kind : undefined;
  const isSourcePage = sourcePageKind === 'html' || sourcePageKind === 'react';

  // Load the selected surface's draft (only for editable preview types).
  React.useEffect(() => {
    if (!current || !isEditable) {
      // objectui#11272 — `{}` is this leaf's buffer, not the page it replaces:
      // stamped as this leaf's, and clean, like every buffer a load installs.
      // Otherwise a dirty flag raised on a page outlived it, and reopening
      // that page with its reload slower than the debounce sent `{}` as the
      // page's draft.
      setDraft({});
      setDraftFor(leafKeyOf(current));
      forgetLeafVersion();
      setHasDraft(false);
      setIfDirty(false);
      return;
    }
    let cancelled = false;
    // objectui#11331 — whether this run's load has settled (see the cleanup).
    let settled = false;
    setLoading(true);
    setError(null);
    // A LEAF CHANGE no longer needs this — `selection` is keyed to the leaf and
    // is already null by the time this runs (objectui#7137). What is left is the
    // narrower case this effect also fires for: a RELOAD of the same leaf
    // (`publishNonce` bumped, or a new `client`), where the leaf key is unchanged
    // and a block selected against the pre-publish draft should not carry into
    // the reloaded one.
    setSelection(null);
    (async () => {
      try {
        const [lay, draftResp] = await Promise.all([
          client.layered<Record<string, unknown>>(current.type, current.name),
          client.getDraft<Record<string, unknown>>(current.type, current.name).catch(() => null),
        ]);
        if (cancelled) return;
        const baseline = ((lay as { effective?: unknown; code?: unknown }).effective ??
          (lay as { code?: unknown }).code ??
          {}) as Record<string, unknown>;
        const body = extractDraftBody(draftResp);
        // Served draft as-is, baseline only without one (objectui#10765): a
        // spread over `effective` resurrects every key the draft deleted.
        setDraft(body ?? baseline);
        setDraftFor(leafKeyOf(current));
        // objectui#11773 — a read serves no version: the next save is unpinned.
        forgetLeafVersion();
        setHasDraft(!!body);
        setIfDirty(false);
      } catch (e) {
        if (!cancelled) setError(plainRefusal(e));
      } finally {
        settled = true;
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      // objectui#11331 — a load cancelled before it settled takes back what
      // its start claimed. Its `finally` will not lower `loading`, and the next
      // run may start no load at all (a leaf with no designer returns early
      // above), which left the canvas on "Loading…" for good. A next run that
      // does load raises the flag again in this same effect flush, so the two
      // updates batch into one render; the `!draftLoaded` arm covers the new
      // leaf either way. The Data and Automations pillars' loads follow the
      // same rule.
      if (!settled) setLoading(false);
    };
  }, [client, current, isEditable, publishNonce, leafReloadNonce, forgetLeafVersion]);

  // objectui#5813 — a local dirty flag so auto-save only arms after a real
  // edit, never on the load-effect's own setDraft.
  const [ifDirty, setIfDirty] = React.useState(false);
  const onPatch = React.useCallback(
    (patch: Record<string, unknown>) => {
      setDraft((d) => ({ ...d, ...patch }));
      setIfDirty(true);
    },
    [],
  );
  const doSave = React.useCallback(async (sent: DraftSend) => {
    if (!current) return;
    setSaving('draft');
    try {
      const outcome = await saveLeafDraft(current.type, current.name, interfacesSaveBody(current.type, draft), { mode: 'draft', packageId });
      // objectui#11773 — the author chose the saved version; the load replaces the buffer.
      if (outcome === 'reloaded') return;
      setHasDraft(true);
      // objectui#11204 — clean only if nothing was edited while it was in flight.
      if (sent.unmoved()) setIfDirty(false);
      onDraftSaved?.();
    } catch (e) {
      // objectui#11785 — no locator: a leaf's issue paths (page blocks,
      // dashboard widgets) name no input this pillar can open, so the sentence
      // says the draft was refused and Details keep every path.
      setError(issueRefusal(e, locale));
    } finally {
      setSaving(false);
    }
  }, [saveLeafDraft, current, draft, onDraftSaved, packageId, locale]);
  const { loaded: draftLoaded } = useDraftAutoSave({
    // objectui#11232 — the leaf `doSave` addresses, `type:name`.
    target: leafKey,
    loadedFor: draftFor,
    dirty: ifDirty,
    blocked: !current || !isEditable || !!saving || readOnly || inspectorBlocking > 0,
    snapshot: draft,
    save: doSave,
  });

  // nav editing — patch appDraft.navigation, then save/publish the App overlay
  const onNavPatch = React.useCallback((patch: Record<string, unknown>) => {
    setAppDraft((d) => ({ ...d, ...patch }));
    setNavDirty(true);
  }, []);
  const doNavSave = React.useCallback(async (sent: DraftSend) => {
    if (!appName) return;
    setNavSaving('draft');
    // objectui#11776 — "Add nav item" births `{ id, type: 'object' }`, which
    // the spec refuses until a target is picked in the inspector, and an
    // unbind leaves an entry with no `type`. The save sends the editor's
    // navigation less every entry that names no target for its `type`, at
    // every depth (`navPayloadOf`); the editor keeps showing it, in its
    // place. A root entry with no `id` is given one by its place in the
    // EDITOR, before anything is left out, so leaving an entry out never
    // moves another entry's id. objectui#11785 — computed before the save so
    // a refusal is placed on the entry it names: its path indexes `sentNav`,
    // and `editorNav` keeps the editor's indexes.
    const rawNav = Array.isArray(appDraft.navigation) ? appDraft.navigation : [];
    const editorNav = rawNav.map((n, i) => {
      const item = n as Record<string, unknown>;
      if (!item || typeof item !== 'object' || (typeof item.id === 'string' && item.id)) return n;
      return { ...item, id: `nav_item_${i + 1}` };
    });
    const sentNav = navPayloadOf(editorNav);
    try {
      const leftOut = sentNav.length !== editorNav.length || sentNav.some((n, i) => n !== editorNav[i]);
      const saved = { ...appDraft, navigation: sentNav };
      const outcome = await saveNavDraft('app', appName, saved, { mode: 'draft', packageId });
      // objectui#11773 — the author chose the saved version; the load replaces
      // the buffer, and with it any failure this editor showed (objectui#11776).
      if (outcome === 'reloaded') {
        setNavError(null);
        return;
      }
      navEchoRef.current = publishNonce;
      navBaselineRef.current = saved;
      setNavHasDraft(true);
      // objectui#11776 — the save landed: the failure an earlier one showed goes.
      setNavError(null);
      // objectui#11189, objectui#11204 — clean only if the buffer is still what
      // this save sent. An edit taken while it was in flight keeps the buffer
      // dirty: the autosave (or a pending "Done") sends it next, and the leave
      // guard holds until then. objectui#11776 — so does an entry this save
      // left out for want of a target: it is on screen and not on the server,
      // and a clean buffer would let the re-read this save signals install the
      // served draft over it. Binding it is the edit that sends it.
      if (sent.unmoved() && !leftOut) setNavDirty(false);
      onDraftSaved?.();
    } catch (e) {
      setNavError(
        issueRefusal(
          e,
          locale,
          navEntryLocator({ sent: sentNav, editor: editorNav, locale, targetLabel: targetLabelRef.current }),
        ),
      );
    } finally {
      setNavSaving(false);
    }
  }, [saveNavDraft, appName, appDraft, onDraftSaved, packageId, publishNonce, locale]);
  // objectui#5813 — nav edits auto-save while edit mode is open.
  const { flush: flushNavSave } = useDraftAutoSave({
    // objectui#11232 — the app `doNavSave` addresses. The package is this
    // pillar's mount (it is keyed by package where the surface renders it).
    target: `app:${appName ?? ''}`,
    loadedFor: appDraftFor,
    dirty: navDirty,
    blocked: !appName || !editNav || !!navSaving || readOnly,
    snapshot: appDraft,
    save: doNavSave,
  });
  // objectui#11189 — "Done" never closes nav editing over an unsent edit. It
  // asks for the close; this effect sends a dirty buffer at once (the
  // autosave, fired early), waits out a save in flight, and closes once the
  // buffer is clean. A buffer that cannot be sent (the save it already
  // attempted failed, and its error is on screen) keeps editing open.
  const [navClosing, setNavClosing] = React.useState(false);
  React.useEffect(() => {
    if (!navClosing || navSaving) return;
    if (navDirty && flushNavSave()) return;
    setNavClosing(false);
    if (navDirty) return;
    setEditNav(false);
    setNavSel(null);
  }, [navClosing, navSaving, navDirty, flushNavSave]);

  // ADR-0057 P3c — the canvas and the inspector are rendered by BOTH layouts
  // below (the classic three-zone row, and the folded center-tabs grid that
  // cedes the right side to the chat dock), so they are built once here. The
  // extraction is presentation-neutral: the classic branch composes exactly
  // the pre-P3c tree.
  // objectui#8219 — true exactly when the canvas below renders its `Preview`
  // branch (same guards, same order). A registered preview brings its own
  // frame (PreviewShell), so the wrapper then draws none: one frame, and the
  // wrapper's border and padding go back to the preview. Every other canvas
  // state (no app, nothing picked, loading, the studio-canvas records grid,
  // no designer) has no shell of its own and keeps the wrapper's card.
  const canvasHostsPreviewShell =
    !(appStatus === 'missing' && !error) &&
    !!current &&
    !loading &&
    draftLoaded &&
    !StudioCanvas &&
    !isSourcePage &&
    !!Preview;
  const canvasEl = (
    <main className="flex min-w-0 flex-1 flex-col overflow-auto bg-muted/30 p-4">
      <div className="mb-3 flex shrink-0 items-center gap-2">
        {/* objectui#5800 — the Design ⇄ Run switch replaces the static Live
            preview chip: same renderer either way, the switch only adds/removes
            the design affordances.

            objectui#7121 — ...but only where a renderer READS the mode. `editing`
            is handed to exactly one canvas branch (`Preview`, below); a
            studio-canvas leaf renders `StudioCanvas`, whose props
            (`StudioCanvasPreviewProps`) carry no `editing` by contract — it is
            the running app, not an editable draft. So on those leaves the
            switch moved `canvasMode` and nothing else: a live-looking control
            wired to nothing. Gated on `StudioCanvas` — the SAME value that
            selects the canvas branch — and deliberately NOT on `isEditable`,
            which is `!!Preview && !StudioCanvas` and would also strip the
            switch from the no-designer leaves that #6795 part C pinned. */}
        {!StudioCanvas && (
        <div className="inline-flex items-center gap-0.5 rounded-lg bg-muted p-1" data-testid="canvas-mode-toggle">
          <button
            type="button"
            onClick={() => setCanvasMode('design')}
            aria-pressed={designing}
            className={
              'rounded-md px-2.5 py-0.5 text-[11px] transition-all ' +
              (designing ? 'bg-background font-medium text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')
            }
          >
            {t('engine.studio.if.modeDesign', locale)}
          </button>
          <button
            type="button"
            onClick={() => setCanvasMode('run')}
            aria-pressed={!designing}
            className={
              'rounded-md px-2.5 py-0.5 text-[11px] transition-all ' +
              (!designing ? 'bg-background font-medium text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')
            }
          >
            {t('engine.studio.if.modeRun', locale)}
          </button>
        </div>
        )}
        {/* objectui#7254 — the canvas caption names WHAT you are editing, in
            the author's own vocabulary: the item's metadata label plus its
            translated KIND ("Pipeline · Dashboard"). The internal `type · name`
            pair it used to print verbatim is developer identity and moves to
            the tooltip, which the ruling keeps as its allowed home. With no
            label declared the caption shows what the entry inherits
            (objectui#11196), as the rail does; the internal name is left for a
            label that is present but resolves to nothing. */}
        {current && (
          <span
            className="text-[11px] text-muted-foreground"
            title={`${t('engine.studio.if.internalId', locale)}: ${current.type} · ${current.name}`}
            data-testid="if-canvas-caption"
          >
            {current.label || current.name} · {translateMetadataType(current.type, locale)}
          </span>
        )}
      </div>
      {(error || navError) && (
        <div className="mb-3 flex shrink-0 flex-col gap-1.5">
          {/* objectui#11776 — the pillar's failure and the nav editor's own,
              each cleared by what settles it, the same failure shown once.
              objectui#11785 — each as a refusal strip; the nav editor's "Show
              me" opens nav editing on the entry it names. */}
          {error && <StudioRefusalStrip refusal={error} locale={locale} className="px-3 py-2 text-xs" />}
          {navError && !(error && error.message === navError.message && error.detail === navError.detail) && (
            <StudioRefusalStrip
              refusal={navError}
              locale={locale}
              onShow={(target) => {
                setEditNav(true);
                setNavSel({ kind: target.kind, id: target.id });
              }}
              className="px-3 py-2 text-xs"
            />
          )}
        </div>
      )}
      <div
        className={cn(
          // Source pages: let the live preview fill the canvas height (it
          // brings its own PreviewShell chrome), so it balances the taller
          // editor panel instead of floating as a short card.
          isSourcePage
            ? 'min-h-0 flex-1 overflow-hidden'
            : canvasHostsPreviewShell
              ? undefined
              : 'rounded-lg border bg-background p-4',
        )}
      >
        {appStatus === 'missing' && !error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <LayoutDashboard className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{t('engine.studio.if.noAppTitle', locale)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('engine.studio.if.noAppHint', locale)}</p>
            </div>
            {onCreateApp && (
              <button
                type="button"
                onClick={onCreateApp}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> {t('engine.studio.app.create', locale)}
              </button>
            )}
          </div>
        ) : !current ? (
          <div className="py-16 text-center text-sm text-muted-foreground">{t('engine.studio.if.pickLeft', locale)}</div>
        ) : loading || !draftLoaded ? (
          // objectui#11272 — nothing of another leaf's buffer is shown under
          // this one. A load that failed leaves it there: the error above says
          // why, and no spinner promises it is still coming.
          error && !loading ? null : (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> {t('engine.studio.loading', locale)}
            </div>
          )
        ) : StudioCanvas ? (
          // Studio-canvas surface override. The object nav leaf resolves here to
          // the records list as the running app shows it (preview = runtime) —
          // schema editing lives in the Data pillar, so this is the object-view
          // grid, not the field-form preview. Default lives in
          // `studio-canvas-preview`; downstream can override via
          // `registerStudioCanvasPreview()` instead of forking this component.
          // objectui#11774 — the open nav entry rides beside the props, not in
          // them (`StudioCanvasPreviewProps` is a published face): the default
          // object canvas previews the entry's slice or named view.
          <StudioCanvasNavEntryContext.Provider value={canvasNavEntry}>
            <StudioCanvas type={current.type} name={current.name} draft={draft} locale={locale} />
          </StudioCanvasNavEntryContext.Provider>
        ) : isSourcePage ? (
          // Source pages have no block tree — the canvas shows only the live
          // preview; the code editor lives in the inspector's Source tab.
          <SourcePageEditor mode="preview" draft={draft} readOnly locale={locale} />
        ) : Preview ? (
          <Preview
            type={current.type}
            name={current.name}
            draft={draft}
            editing={designing}
            selection={designing ? selection : null}
            onSelectionChange={designing ? setSelection : undefined}
            // objectui#11136 — a read-only package gets no `onPatch`: per the
            // preview contract the canvas is then read-only (no add, drag,
            // rename or delete — each a write the blocked autosave would
            // discard), while selecting a block or widget still opens the
            // inspector, read-only.
            onPatch={readOnly ? undefined : onPatch}
            locale={locale}
          />
        ) : (
          <div className="py-12 text-center text-xs text-muted-foreground">
            {tFormat(
              designersUnregistered
                ? 'engine.studio.if.designersMissing'
                : 'engine.studio.if.noDesigner',
              locale,
              { type: current.type },
            )}
          </div>
        )}
      </div>
      {!isEditable && current?.type === 'object' ? (
        <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Database className="h-3 w-3" /> {t('engine.studio.if.objectHintPre', locale)}<span className="font-medium">Data</span>{t('engine.studio.if.objectHintPost', locale)}
        </p>
      ) : null}
    </main>
  );

  const inspectorHeaderEl = (
    <header className="flex shrink-0 items-center gap-2 border-b bg-background/95 px-3 py-2">
      <SlidersHorizontal className="h-3.5 w-3.5" />
      <span className="text-[13px] font-medium">{t('engine.studio.inspector.props', locale)}</span>
      <div className="ml-auto flex items-center gap-0.5">
        {/* objectui#7121 — same gate as the rail branch: offering "clear
            selection" on a studio-canvas leaf would contradict the rail beside
            it, which states this canvas has no blocks. (The leftover STATE that
            once reached here is gone since objectui#7137 keyed `selection` to
            its leaf; this gate stays because it is the RAIL's consistency rule,
            and a studio-canvas leaf can never produce a selection to clear
            either way — `StudioCanvasPreviewProps` carries no
            `onSelectionChange` by contract.) */}
        {selection && !StudioCanvas && (
          <button
            type="button"
            onClick={() => setSelection(null)}
            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t('engine.studio.deselect', locale)}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {canCollapseInspector && (
          <button
            type="button"
            onClick={() => setInspectorCollapsed(true)}
            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t('engine.studio.inspector.collapse', locale)}
            title={t('engine.studio.inspector.collapse', locale)}
          >
            <PanelRightClose className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </header>
  );

  // Collapsed state — a thin rail on the right with an expand affordance, so the
  // canvas reclaims the ~288px the properties aside otherwise holds.
  const inspectorCollapsedRailEl = (
    <aside className="flex w-9 shrink-0 flex-col items-center gap-1.5 border-l bg-background py-2">
      <button
        type="button"
        onClick={() => setInspectorCollapsed(false)}
        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={t('engine.studio.inspector.expand', locale)}
        title={t('engine.studio.inspector.props', locale)}
      >
        <PanelRightOpen className="h-4 w-4" />
      </button>
      <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
    </aside>
  );

  const inspectorBodyEl =
    editNav && navSel ? (
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <StudioNavItemInspector
          navId={navSel.id}
          appDraft={appDraft}
          objects={pkgObjects}
          packageId={packageId}
          onNavPatch={onNavPatch}
          onClear={() => setNavSel(null)}
        />
      </div>
    ) : StudioCanvas && current ? (
      // ⭐ objectui#7121 — a studio-canvas leaf has no block tree, so the
      // generic "click a block on the canvas" invitation below instructs the
      // author to do something impossible: `StudioCanvasPreviewProps` carries
      // no `selection`/`onSelectionChange` by contract, so this canvas can
      // never produce one. Measured with the designer registry POPULATED
      // (`listMetadataPreviewTypes() === ['dashboard']`), which is what makes
      // this a different cause from #6795 part C's empty-registry states.
      //
      // Ordered BEFORE the `selection` branch on purpose, mirroring the canvas
      // chain where `StudioCanvas` also wins. When this ordering landed it was
      // also load-bearing against a second defect: `selection` outlived a leaf
      // change (the load effect cleared it only on the editable path), so
      // arriving here with a block selected on the PREVIOUS leaf opened the
      // scoped inspector for a block this canvas does not contain — measured,
      // `ObjectFieldInspector` handed `object:showcase_task:block:blk_1`.
      // objectui#7137 fixed that at the source by keying `selection` to its
      // leaf, so this branch is no longer the thing standing between an author
      // and a foreign block. Keep the order anyway: it states which branch is
      // TRUE for this leaf, and it does not depend on the state lifecycle
      // staying correct.
      //
      // ⛔ Says what is true and promises no recovery — no "loading…", no "try
      // again". Same constraint part C established: these registries are plain
      // `Map`s read during render with no subscription. Here the statement is
      // not even about registration — this canvas has no blocks by contract,
      // so there is nothing to wait for.
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <div className="flex flex-col items-center gap-2 px-2 py-10 text-center text-xs text-muted-foreground">
          <Eye className="h-5 w-5" />
          {t('engine.studio.inspector.studioCanvasNoBlocks', locale)}
        </div>
      </div>
    ) : current && !draftLoaded ? (
      // objectui#11272 — no editor over another leaf's buffer: the canvas
      // beside it says whether this leaf's own document is on its way.
      <div className="min-h-0 flex-1" />
    ) : selection && Inspector && current ? (
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <Inspector
          type={current.type}
          name={current.name}
          draft={draft}
          selection={selection}
          onPatch={onPatch}
          onClearSelection={() => setSelection(null)}
          onSelectionChange={setSelection}
          onBlockingIssuesChange={(count: number) =>
            setBlockingReport({ key: inspectorKey, count })
          }
          // objectui#11136 — the pillar's real flag, threaded exactly as the
          // Data pillar threads it (objectui#2259).
          readOnly={readOnly}
          locale={locale}
        />
      </div>
    ) : isSourcePage ? (
      showFoldedTabs ? (
        // Folded tabs mode: the center Canvas tab already shows the live
        // preview, so the nested Source/Props tab strip adds nothing — the
        // Properties tab body IS the code editor (its Props pane was only an
        // empty state pointing back at Source).
        // objectui#11136 — the editor's own read-only contract ("onPatch:
        // undefined in read-only mode"), fed by the pillar's real flag.
        <div className="mt-2 min-h-0 flex-1 border-t">
          <SourcePageEditor
            mode="editor"
            draft={draft}
            onPatch={readOnly ? undefined : onPatch}
            readOnly={readOnly}
            locale={locale}
          />
        </div>
      ) : (
      <Tabs
        value={inspectorTab}
        onValueChange={(v) => setInspectorTab(v === 'props' ? 'props' : 'source')}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="mx-3 mt-2 shrink-0 self-start">
          <TabsTrigger value="source" className="gap-1 text-xs">
            <Code2 className="h-3.5 w-3.5" /> {t('engine.studio.inspector.tabSource', locale)}
          </TabsTrigger>
          <TabsTrigger value="props" className="text-xs">
            {t('engine.studio.inspector.tabProps', locale)}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="source" className="mt-2 min-h-0 flex-1 border-t">
          <SourcePageEditor
            mode="editor"
            draft={draft}
            onPatch={readOnly ? undefined : onPatch}
            readOnly={readOnly}
            locale={locale}
          />
        </TabsContent>
        <TabsContent value="props" className="mt-0 min-h-0 flex-1 overflow-auto p-3">
          <div className="flex flex-col items-center gap-2 px-2 py-10 text-center text-xs text-muted-foreground">
            <Code2 className="h-5 w-5" />
            {tFormat('engine.studio.inspector.sourcePageLine1', locale, { kind: sourcePageKind! })}
            <br />
            {t('engine.studio.inspector.sourcePageLine2', locale)}
          </div>
        </TabsContent>
      </Tabs>
      )
    ) : DefaultInspector && current && isEditable ? (
      // No block selected → the surface's "home" inspector (e.g. a page's
      // interfaceConfig form). Selecting a sub-element from it swaps in the
      // scoped block inspector above via onSelectionChange.
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <DefaultInspector
          type={current.type}
          name={current.name}
          draft={draft}
          onPatch={onPatch}
          onSelectionChange={setSelection}
          onBlockingIssuesChange={(count: number) =>
            setBlockingReport({ key: inspectorKey, count })
          }
          // objectui#11136 — same flag, same threading as the block inspector.
          readOnly={readOnly}
          locale={locale}
        />
      </div>
    ) : designersUnregistered ? (
      // ⭐ #6795 part C. "Click a block on the canvas, and edit its properties
      // right here" instructs the author to do something impossible: with the
      // registries unpopulated the canvas beside this rail is the
      // designers-missing notice, not a block tree, so there is nothing to
      // click and nothing this rail could open if they did.
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <div className="flex flex-col items-center gap-2 px-2 py-10 text-center text-xs text-muted-foreground">
          <Ban className="h-5 w-5" />
          {t('engine.studio.inspector.designersMissing', locale)}
        </div>
      </div>
    ) : (
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <div className="flex flex-col items-center gap-2 px-2 py-10 text-center text-xs text-muted-foreground">
          <MousePointer2 className="h-5 w-5" />
          {t('engine.studio.inspector.emptyLine1', locale)}
          <br />
          {t('engine.studio.inspector.emptyLine2', locale)}
        </div>
      </div>
    );

  return (
    <div className="flex h-full flex-col">
      {leafConflictDialog}
      {navConflictDialog}
      <div className="flex items-center gap-2 border-b px-3 py-1.5">
        <button
          type="button"
          onClick={() => setRailOpen((v) => !v)}
          aria-label={t('engine.studio.toggleRail', locale)}
          className="-ml-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        {/* objectui#7254 — the breadcrumb's chip carried the raw
            `dashboard · customer_dashboard` beside a Chinese label, so the same
            strip spoke two vocabularies at once. The chip now carries the
            translated KIND; the internal identity is on the tooltip. */}
        {current ? (
          <span
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
            title={`${t('engine.studio.if.internalId', locale)}: ${current.type} · ${current.name}`}
            data-testid="if-breadcrumb"
          >
            <span className="text-[13px] font-medium text-foreground">
              {current.label || current.name}
            </span>
            <span className="rounded bg-muted px-1.5 py-0.5">
              {translateMetadataType(current.type, locale)}
            </span>
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">{t('engine.studio.if.pickLeft', locale)}</span>
        )}
        {hasDraft && draftLoaded && (
          <span className="rounded bg-amber-400/15 px-2 py-0.5 text-[11px] text-amber-600 dark:text-amber-300">
            {t('engine.studio.unpublishedDraft', locale)}
          </span>
        )}
        {/* objectui#5813 — drafts auto-save; the spinner is the affordance. */}
        {saving === 'draft' && (
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground" data-testid="if-autosaving">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t('engine.studio.autoSaving', locale)}
          </span>
        )}
      </div>

      <div className="relative flex min-h-0 flex-1">
        {isMobile && railOpen && (
          <div
            className="absolute inset-0 z-10 bg-black/30"
            onClick={() => setRailOpen(false)}
            aria-hidden="true"
          />
        )}
        {/* real App navigation tree */}
        <nav
          className={cn(
            (editNav ? 'w-72' : 'w-52') + ' flex shrink-0 flex-col border-r bg-background',
            isMobile && 'absolute inset-y-0 left-0 z-20 shadow-lg transition-transform duration-200',
            isMobile && !railOpen && '-translate-x-full',
          )}
        >
          <div className="shrink-0 border-b px-2 py-1.5">
            <div className="flex items-center justify-between gap-1">
              <p className="truncate text-[11px] font-medium text-muted-foreground">{tFormat('engine.studio.if.navHeading', locale, { app: navItemLabelText(appLabel, locale) })}</p>
              {appStatus === 'ready' && !readOnly && (
                <button
                  type="button"
                  onClick={() => {
                    // objectui#11189 — "Done" closes through the effect beside
                    // the nav autosave, which sends an unsent edit first.
                    if (editNav) {
                      setNavClosing(true);
                      return;
                    }
                    setEditNav(true);
                    setNavSel(null);
                  }}
                  title={editNav ? t('engine.studio.if.doneEditTitle', locale) : t('engine.studio.if.editNavTitle', locale)}
                  className={
                    'inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] ' +
                    (editNav ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted')
                  }
                >
                  {editNav ? (
                    <>
                      <Check className="h-3 w-3" /> {t('engine.studio.done', locale)}
                    </>
                  ) : (
                    <>
                      <Pencil className="h-3 w-3" /> {t('engine.studio.edit', locale)}
                    </>
                  )}
                </button>
              )}
            </div>
            {editNav && (
              <div className="mt-1.5 flex items-center gap-1.5">
                {navHasDraft && (
                  <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] text-amber-600 dark:text-amber-300">
                    {t('engine.studio.unpublished', locale)}
                  </span>
                )}
                {navSaving === 'draft' && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground" data-testid="nav-autosaving">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {t('engine.studio.autoSaving', locale)}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-2">
            {appStatus === 'missing' && !error ? (
              <div className="px-2 py-3">
                <p className="text-[11px] text-muted-foreground">{t('engine.studio.if.noApp', locale)}</p>
                {onCreateApp && (
                  <button
                    type="button"
                    onClick={onCreateApp}
                    className="mt-2 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] hover:bg-muted"
                  >
                    <Plus className="h-3 w-3" /> {t('engine.studio.app.create', locale)}
                  </button>
                )}
              </div>
            ) : editNav ? (
              // Edit mode renders AppNavCanvas even when the nav is empty — it
              // carries its own "Add nav item" affordance, so a fresh app can be
              // built up from nothing.
              <AppNavCanvas
                draft={appDraft}
                rootKey="navigation"
                onPatch={onNavPatch}
                selection={navSel}
                onSelectionChange={(s) => setNavSel(s ? { kind: s.kind, id: s.id } : null)}
              />
            ) : navTree.length === 0 ? (
              <p className="px-2 py-3 text-[11px] text-muted-foreground">
                {error
                  ? t('engine.studio.loadFailed', locale)
                  : appStatus === 'loading'
                    ? t('engine.studio.loading', locale)
                    : t('engine.studio.if.noNavItems', locale)}
              </p>
            ) : (
              <NavTree
                nodes={navTree}
                active={current}
                objectIcons={objectIconMap}
                onPick={(s) => {
                  setCurrent(s);
                  if (isMobile) setRailOpen(false);
                }}
              />
            )}
          </div>
        </nav>

        {!foldInspector ? (
          <>
            {/* canvas */}
            {canvasEl}

            {/* inspector — full-height flex column so the source editor fills it
                top-to-bottom instead of squeezing into a fixed height with dead
                space below. Widens for source pages so code has room. Collapses
                to a thin rail to hand the width back to the canvas. */}
            {inspectorCollapsed ? inspectorCollapsedRailEl : (
              <aside
                className={cn(
                  'flex shrink-0 flex-col overflow-hidden border-l',
                  isSourcePage && !(selection && Inspector && current) && !(editNav && navSel)
                    ? 'w-[24rem] xl:w-[30rem] 2xl:w-[36rem]'
                    : 'w-72',
                )}
              >
                {inspectorHeaderEl}
                {inspectorBodyEl}
              </aside>
            )}
          </>
        ) : isWide ? (
          // Folded layout on a WIDE (xl+) viewport: enough room to keep the
          // canvas and the properties side by side beside the chat dock — the
          // tabs (and their auto-switch) only exist where width forces them.
          // The inspector is slimmer at xl (and grows at 2xl) so the canvas
          // keeps usable width once the ~420px dock is also on screen.
          <>
            {canvasEl}
            {inspectorCollapsed ? inspectorCollapsedRailEl : (
              <aside
                data-testid="studio-folded-inspector"
                className={cn(
                  'flex shrink-0 flex-col overflow-hidden border-l',
                  isSourcePage && !(selection && Inspector && current) && !(editNav && navSel)
                    ? 'w-[22rem] 2xl:w-[28rem]'
                    : 'w-72 2xl:w-80',
                )}
              >
                {inspectorHeaderEl}
                {inspectorBodyEl}
              </aside>
            )}
          </>
        ) : (
          // ADR-0057 P3c — folded layout: the chat dock owns the right side,
          // so the inspector shares the center with the canvas as tabs
          // (`[left: nav/tree] [center: canvas + properties] [right: chat]`).
          <Tabs
            value={centerTab}
            onValueChange={(v) => setCenterTab(v === 'properties' ? 'properties' : 'canvas')}
            className="flex min-w-0 flex-1 flex-col"
            data-testid="studio-center-tabs"
          >
            <TabsList className="mx-3 mt-2 shrink-0 self-start">
              <TabsTrigger value="canvas" className="gap-1 text-xs">
                <Eye className="h-3.5 w-3.5" /> {t('engine.studio.if.tabCanvas', locale)}
              </TabsTrigger>
              <TabsTrigger value="properties" className="gap-1 text-xs">
                <SlidersHorizontal className="h-3.5 w-3.5" /> {t('engine.studio.inspector.props', locale)}
              </TabsTrigger>
            </TabsList>
            {/* forceMount + state-hidden: the canvas hosts the RUNTIME preview
                (records grids, PreviewShell iframes) — unmounting it on every
                flip to Properties would refetch/reload it each time. */}
            <TabsContent
              forceMount
              value="canvas"
              className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
            >
              {canvasEl}
            </TabsContent>
            <TabsContent value="properties" className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden">
              {inspectorHeaderEl}
              {inspectorBodyEl}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

/** Next unused `field_N` name for a freshly-added field. */
function nextFieldName(existing: string[]): string {
  let i = existing.length + 1;
  let name = `field_${i}`;
  while (existing.includes(name)) name = `field_${++i}`;
  return name;
}

/**
 * Data pillar — the package's objects: a records grid (Airtable parity) plus
 * table-based field management. Add a field, or click a column header's edit
 * affordance, to open ObjectFieldInspector (full type list + per-type config)
 * in the right panel; changes persist via the object draft → publish overlay.
 */
/**
 * Framework-managed/audit fields. They lead the raw metadata order but aren't
 * what a user manages in a data grid, so the Data pillar drops them from the
 * column set (mirrors ObjectGrid's regular-vs-system split) to open on the
 * meaningful fields first — the same way Airtable hides system columns.
 *
 * objectui#11780 — this list is no longer the only test. The columns the
 * platform injects AND hides (`system: true` + `hidden: true` on the served
 * definition: `__search`, `owning_business_unit_id`, `organization_id`) are
 * dropped by `isStudioHiddenSystemField`, read off each field's definition
 * beside this list. The list keeps its own job: the audit columns are
 * `system` but NOT `hidden` in the platform's own definitions
 * (`AUDIT_FIELD_DEFS`), so the marks alone would put them back.
 */
const STUDIO_SYSTEM_FIELD_NAMES = new Set<string>([
  '_id', 'id', 'organization_id', 'org_id', 'space_id',
  'created_at', 'created_by', 'updated_at', 'updated_by',
  'modified_at', 'modified_by', 'created_time', 'modified_time', 'updated_time',
  'deleted_at', 'deleted_by',
]);

/**
 * Render the Data pillar's records grid using the SAME rich list surface as the
 * runtime list pages — the standard toolbar (view switcher, search, sort, filter,
 * group, hide-fields) plus Airtable-style inline data management. This is the
 * plugin ObjectView's `renderListView` slot, so the object-view still owns data
 * fetching while ListView owns the toolbar + grid. Defined at module scope (not
 * inline) so it stays a static component reference.
 *
 * Exported for tests (StudioDesignSurface.gridRefresh.test.tsx) — the refresh
 * channel this slot rides is a property of THIS function's schema forward, so
 * the test drives the real slot rather than a reconstruction of it. It is a
 * render-prop callback rather than a component, so Fast Refresh cannot treat it
 * as one; the export is scoped to that test and never reaches the package entry
 * (`index.ts` re-exports a named list, and `package.json` exports only `.`).
 */
// eslint-disable-next-line react-refresh/only-export-components -- see above
export function renderStudioGridList(props: {
  schema: Record<string, unknown>;
  dataSource: unknown;
  onEdit?: (record: Record<string, unknown>) => void;
  className?: string;
  onAddRecord?: () => void;
}): React.ReactElement {
  const { schema: listSchema, dataSource: ds, onEdit, className, onAddRecord } = props;
  return (
    <ListView
      schema={
        {
          // The spread carries the slot's `refreshTrigger` — the signal the
          // plugin ObjectView bumps after a mutation, and the ONE refresh input
          // ListView actually reads (it is in its fetch effect's dependency
          // array). Keep it: dropping or shadowing `refreshTrigger` here silently
          // severs the Data pillar's post-mutation refetch, and nothing looks
          // wrong afterwards because the grid re-renders constantly regardless.
          // The slot also passes a bare `refreshKey` carrying the same number;
          // that one is not a prop of ListView or of anything it renders, so the
          // forward was dead and objectui#4528 removed it (objectui#4549 measured
          // the channel and dropped the leftover parameter).
          ...listSchema,
          viewType: 'grid',
          showSearch: true,
          showSort: true,
          showFilters: true,
          showGroup: true,
          showHideFields: true,
          inlineEdit: true,
          addDeleteRecordsInline: true,
          // Fold "+ New" into this toolbar (next to Hide fields/Filter/Group/
          // Sort) instead of ObjectView's separate `showCreate` row above it —
          // that row was otherwise ~90% empty (nothing else populates its
          // left side in Studio) and just added a dead band before the grid.
          addRecord: { enabled: true },
        } as never
      }
      dataSource={ds as never}
      onEdit={onEdit}
      onAddRecord={onAddRecord}
      className={className}
    />
  );
}

// Exported for tests (StudioDesignSurface.emptyPackage.test.tsx) — the empty-
// package behavior (no forced creator modal, empty-state CTA) lives here.
export function DataPillar({
  packageId,
  publishNonce = 0,
  onDraftSaved,
  readOnly = false,
}: {
  packageId: string;
  publishNonce?: number;
  onDraftSaved?: () => void;
  /** Courtesy gate: hide/disable metadata-authoring affordances (records stay usable). */
  readOnly?: boolean;
}): React.ReactElement {
  const client = useMetadataClient();
  const adapter = useAdapter();
  const locale = useMetadataLocale();
  // The last-saved time reads the DISPLAY locale — not `locale` above, which
  // picks the pillar's strings and is `'en-US'` for every non-zh language
  // (objectui#10232).
  const displayLocale = useDisplayLocale();
  // Live server JSONSchemas per metadata type (`/meta/types`) — handed to the
  // Actions/Hooks config panels so their forms are driven by the real metadata
  // contract (and stay forward-compatible when the server spec adds fields).
  const { entries: metaTypes } = useMetadataTypes(client);
  const typeSchemas = React.useMemo(() => {
    const idx: Record<string, Record<string, unknown> | undefined> = {};
    for (const e of metaTypes) idx[e.type] = e.schema;
    return idx;
  }, [metaTypes]);
  // Below the mobile breakpoint the Objects rail overlays the canvas instead
  // of a permanent 208px column (which otherwise squeezed the grid/form
  // canvas down to almost nothing on phones) — closed by default, toggled by
  // the header's Menu button.
  const isMobile = useIsMobile();
  const [railOpen, setRailOpen] = React.useState(false);
  const [objects, setObjects] = React.useState<Surface[]>([]);
  const [objectsLoaded, setObjectsLoaded] = React.useState(false);
  // objectui#7255 — the copilot dock shares this document; a turn that staged
  // or published metadata re-reads this rail in place. No hold is needed: the
  // rail load only replaces the LIST (the per-object edit buffer is loaded by
  // its own `loadedNameRef`-guarded effect and is never touched here).
  const metadataRefreshNonce = useMetadataRefreshNonce();
  const [current, setCurrent] = React.useState<Surface | null>(null);
  // `?surface=object:<name>` capture + mirror — the app→Studio bridge
  // (ADR-0080, `appStudioObjectPath`) lands here with a specific object;
  // shared plumbing (see useSurfaceDeepLink).
  const initialSurface = useSurfaceDeepLink(current);
  // The LIVE half of the same plumbing (see surfaceDeepLinkChannel): a
  // producer already inside this mounted pillar — the pending-changes sheet's
  // security block, naming the object the publish door would refuse — asks for
  // an object long after the capture ref above was read.
  //
  // Applied AT MOST ONCE, by id. A standing request re-resolved on every rail
  // reload (publish, package switch) would drag the author back off whatever
  // they had since selected, which is the regression the mount-time ref exists
  // to prevent — so the id is marked spent as soon as the loaded rail has been
  // consulted, whether or not it held a match.
  const requestedSurface = useRequestedSurface();
  const appliedRequestRef = React.useRef(0);
  React.useEffect(() => {
    if (!requestedSurface || !objectsLoaded) return;
    if (requestedSurface.id === appliedRequestRef.current) return;
    appliedRequestRef.current = requestedSurface.id;
    const match = resolveSurfaceDeepLink(objects, requestedSurface.target, 'object');
    if (match) setCurrent(match);
  }, [requestedSurface, objects, objectsLoaded]);
  const [objDraft, setObjDraft] = React.useState<Record<string, unknown>>({});
  // objectui#11272 — the object `objDraft` was loaded for, `object:NAME`:
  // written where the load below installs it, and nowhere else.
  const [objDraftFor, setObjDraftFor] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  // objectui#11785 — a load failure as it was (`plainRefusal`), a refused save
  // as an author sentence naming the field, with the raw text behind Details.
  const [error, setError] = React.useState<StudioRefusal | null>(null);
  // field management — a selected field opens ObjectFieldInspector (full type + config)
  const [fieldSel, setFieldSel] = React.useState<MetadataSelection | null>(null);
  // Blocking author-time issues the field inspector is showing — a CEL formula
  // that does not parse must not be saveable, let alone publishable as the live
  // field definition (objectui#4306).
  //
  // The count is STAMPED with the selection it came from, so it expires by
  // construction when the selection changes or the panel closes: an unmounted
  // inspector can never retract its last verdict, and a host that waited for
  // one would leave Save wedged shut with nothing on screen to fix.
  const [blockingReport, setBlockingReport] = React.useState({ key: '', count: 0 });
  const fieldSelKey = fieldSel ? `${current?.name ?? ''}:${fieldSel.kind}:${fieldSel.id}` : '';
  const inspectorBlocking = blockingReport.key === fieldSelKey ? blockingReport.count : 0;
  // The pillar's PANEL family reports separately (objectui#4527): the
  // validations, actions and settings panels all write through this same draft
  // and own no Save of their own, so their CEL faults have to reach this
  // button too. Kept apart from the field inspector's count above because the
  // two expire on different things.
  //
  // Stamped with the panel TAB: exactly one panel is mounted at a time, so
  // leaving the tab unmounts the reporter and it can never retract its last
  // verdict — deriving against the live tab is what stops a fault authored
  // under Validations from wedging Save on a tab with no CEL editor at all.
  const [panelBlockingReport, setPanelBlockingReport] = React.useState({ key: '', count: 0 });
  const [dirty, setDirty] = React.useState(false);
  const [hasDraft, setHasDraft] = React.useState(false);
  const [saving, setSaving] = React.useState<false | 'draft' | 'publish'>(false);
  // Timestamp of the last successful draft save — renders a "last saved HH:MM"
  // hint next to the Save button (framework#2615 P3: nothing confirmed a draft
  // save persisted, unlike the sibling pillars which toast).
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);
  const [gridVer, setGridVer] = React.useState(0);
  // Records grid ⇄ Form ⇄ Validations ⇄ Settings — four views of the SAME
  // object. Grid/Form are the runtime renderer (same-renderer principle);
  // Validations edits `validations` rules; Settings edits object basics +
  // the ADR-0085 semantic roles. All patch the one `objDraft`.
  const [viewMode, setViewMode] = React.useState<'grid' | 'form' | 'rules' | 'settings' | 'hooks' | 'actions' | 'api'>('grid');
  // Stamp + read for the panel-family count declared above.
  const panelKey = `${current?.name ?? ''}:${viewMode}`;
  const panelBlocking = panelBlockingReport.key === panelKey ? panelBlockingReport.count : 0;
  const reportPanelBlocking = React.useCallback(
    (count: number) => setPanelBlockingReport({ key: panelKey, count }),
    [panelKey],
  );
  // Either source closes the door: a malformed field formula and a malformed
  // rule guard are both unsaveable, and neither excuses the other.
  const saveBlocking = inspectorBlocking + panelBlocking;
  // Within the Form view: Layout (WYSIWYG drag/section designer) ⇄ Preview
  // (live form).
  const [formMode, setFormMode] = React.useState<'layout' | 'preview'>('layout');
  // Tracks which object's baseline is currently loaded — so we (re)load exactly
  // once per selected object and never clobber an in-progress draft.
  const loadedNameRef = React.useRef<string | null>(null);
  // objectui#11773 — the version `objDraft` was saved at, sent as `If-Match` by
  // every save of this buffer (the autosave and the column reorder). A
  // conflict's "reload" re-runs the load below for the open object.
  const [objReloadNonce, setObjReloadNonce] = React.useState(0);
  const reloadObjDraft = React.useCallback(() => setObjReloadNonce((n) => n + 1), []);
  const {
    save: saveObjDraft,
    forget: forgetObjVersion,
    dialog: objConflictDialog,
  } = useDraftSaveGuard(client, reloadObjDraft);
  // Left-rail search + inline "new object" creator (design §4: rail = search + New).
  const [query, setQuery] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  // The OWD the create dialog will author (`7a90afdf9`). Pre-selected to the
  // platform's own recommended baseline; the author sees it and can change it
  // before the object exists. Reset by `openCreateDialog` below rather than by
  // an effect on `creating` — the effect spelling re-renders the dialog a
  // second time on every open purely to undo a previous session's pick.
  const [createOwd, setCreateOwd] = React.useState<OwdCreateModel>(OWD_DEFAULT);
  const openCreateDialog = React.useCallback(() => {
    setError(null);
    setCreateOwd(OWD_DEFAULT);
    setCreating(true);
  }, []);
  const [createBusy, setCreateBusy] = React.useState(false);
  // Whether the selected object exists beyond the draft (published/code baseline).
  // A draft-only object has NO physical table yet (DDL lands at publish), so the
  // Records grid must not fire data SQL against it.
  const [hasBaseline, setHasBaseline] = React.useState(true);
  /**
   * The field names that EXIST on the server for the current object — i.e. the
   * ones a data query may name in `select`.
   *
   * Measured, not assumed (cloud#1652): saving a field as a DRAFT returns 200
   * and `state=draft`, and the very next `select` naming it still answers
   * `400 INVALID_FIELD`. Materialisation happens at PUBLISH, so the draft body
   * is the wrong source for a projection even after a successful save.
   */
  const [publishedFieldNames, setPublishedFieldNames] = React.useState<Set<string>>(new Set());
  // The package's object-name namespace (framework#2694). New objects are
  // auto-prefixed with `<namespace>_` so an author can never draft a prefix-less
  // object that publish would later reject (code NAMESPACE_PREFIX).
  const [namespace, setNamespace] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetchPackages()
      .then((list) => {
        if (!cancelled) setNamespace(list.find((p) => p.id === packageId)?.namespace ?? null);
      })
      .catch((e: unknown) => {
        // The namespace stays best-effort and publish still enforces the
        // prefix server-side — but silently losing it means the author drafts
        // prefix-less objects now and hears about it only at publish. Report
        // it at the moment it breaks (objectui#7368), on the shared toast id.
        if (cancelled) return;
        toast.error(formatMetadataError(e), { id: PACKAGE_LIST_TOAST_ID });
      });
    return () => {
      cancelled = true;
    };
  }, [packageId]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Published objects + pending DRAFT objects, merged. `list()` only
        // sees published/active metadata, so a freshly-created writable base
        // whose objects are all drafts would render an empty (previously:
        // forever-"loading") rail. Draft headers carry no label — show the
        // machine name until the draft body loads on selection.
        const [list, draftHeaders] = await Promise.all([
          client.list('object', { packageId }) as Promise<Array<Record<string, unknown>>>,
          client.listDrafts({ packageId, type: 'object' }).catch(() => []),
        ]);
        if (cancelled) return;
        const items = (list || [])
          .map((o) => ({ type: 'object', name: String(o.name ?? ''), label: String(o.label ?? o.name ?? ''), icon: o.icon ? String(o.icon) : undefined }))
          .filter((o) => o.name);
        const known = new Set(items.map((o) => o.name));
        for (const d of draftHeaders) {
          if (d.name && !known.has(d.name)) {
            items.push({ type: 'object', name: d.name, label: d.name, icon: undefined });
          }
        }
        setObjects(items);
        // Honor a `?surface=object:<name>` deep-link when it names an object we
        // actually have; otherwise open the first object as before.
        const deepLinked = resolveSurfaceDeepLink(items, initialSurface, 'object');
        setCurrent((c) => c ?? deepLinked ?? items[0] ?? null);
        // An empty writable package does NOT auto-open the creator dialog —
        // it used to, which forced an unrequested modal on EVERY visit to an
        // empty package (dogfood #2555). The empty-state panel carries the
        // create CTA instead.
      } catch (e) {
        if (!cancelled) setError(plainRefusal(e));
      } finally {
        if (!cancelled) setObjectsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, packageId, readOnly, metadataRefreshNonce]);

  React.useEffect(() => {
    if (!current) return;
    // Load once per selected object. Bail if this object's baseline is already
    // loaded — a client-identity churn or a child remount must NOT re-fetch and
    // clobber the in-progress form-layout draft the designer is editing.
    // Keyed by object + publishNonce: a package publish (nonce++) re-reads the
    // fresh published baseline; otherwise we never clobber an in-progress draft.
    const loadKey = `${current.name}#${publishNonce}#${objReloadNonce}`;
    if (loadedNameRef.current === loadKey) return;
    loadedNameRef.current = loadKey;
    let cancelled = false;
    // objectui#11331 — whether this run's load has settled (see the cleanup).
    let settled = false;
    setLoading(true);
    setError(null);
    setFieldSel(null);
    setDirty(false);
    (async () => {
      try {
        const [layRaw, draftResp] = await Promise.all([
          client.layered<Record<string, unknown>>('object', current.name),
          client.getDraft<Record<string, unknown>>('object', current.name).catch(() => null),
        ]);
        if (cancelled) return;
        const lay = layRaw as { effective?: Record<string, unknown>; code?: Record<string, unknown> };
        const baseline = (lay.effective ?? lay.code ?? {}) as Record<string, unknown>;
        const draftBody = extractDraftBody(draftResp);
        // Served draft as-is, baseline only without one (objectui#10765).
        setObjDraft(draftBody ?? baseline);
        setObjDraftFor(`object:${current.name}`);
        // objectui#11773 — a read serves no version: the next save is unpinned.
        forgetObjVersion();
        // objectui#11272 — the buffer installed is clean, as every pillar's
        // is: an edit a period began while it was another object's is dropped
        // with it, never sent as this object's.
        setDirty(false);
        setHasDraft(!!draftBody);
        setHasBaseline(!!(lay.effective ?? lay.code));
        // The projection baseline: the object as the SERVER has it. `objDraft`
        // above is the pending draft as-is when one exists, which is right for
        // the editor and wrong for a `select`: a draft-only field is not a
        // column the data API can answer yet (see `gridColumns`).
        setPublishedFieldNames(new Set(readFields(baseline.fields).entries.map((e) => e.name)));
      } catch (e) {
        if (!cancelled) setError(plainRefusal(e));
      } finally {
        settled = true;
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      // objectui#11331 — a load cancelled before it settled takes back what
      // its start claimed, as in InterfacesPillar's draft load: `loading`, and
      // here the load-once claim too. The cancelled load installed nothing, so
      // a re-run for the same key (a new `client` while it was in flight) must
      // load rather than bail as if it had, which left the object on
      // "Loading…" for good. A load that settled keeps its claim, so a client
      // change after it still never clobbers the draft being edited.
      if (!settled) {
        setLoading(false);
        loadedNameRef.current = null;
      }
    };
  }, [client, current, publishNonce, objReloadNonce, forgetObjVersion]);

  const fieldCount = React.useMemo(() => readFields(objDraft.fields).entries.length, [objDraft]);

  /**
   * The design-mode grid's columns: the object's own fields in metadata order,
   * dropping framework-managed/audit fields so the grid opens on the meaningful
   * columns first. Also drops a field named `actions` — the grid always pins its
   * own row-actions column headed "Actions", so a data column of the same name
   * reads as a duplicated column. (The field stays editable in the form designer.)
   *
   * Memoized because the IDENTITY of this array, not its contents, is a data-fetch
   * input downstream (objectui#4567). It reaches `ListView` unchanged — plugin-view's
   * ObjectView forwards it to the `renderListView` slot as `columns` by reference
   * (plugin-view/src/ObjectView.tsx) — and ListView derives its `$expand` fields from
   * `schema.columns` with that array in the memo's dependency array BY IDENTITY, which
   * is itself in the fetch effect's dependency array (plugin-list/src/ListView.tsx).
   * Built inline, this allocated a fresh array on every render of the pillar, so the
   * Studio grid issued a duplicate find() per render — measured 1 -> 4 across three
   * re-renders that changed nothing. The pillar re-renders constantly (its whole
   * schema is a fresh object literal each time), so that was a steady-state duplicate
   * query source against the backend, invisible in the UI because the rows just
   * repainted with the same data.
   *
   * Keyed on `objDraft.fields` rather than on `objDraft`: `onPatch` replaces the draft
   * object while keeping `fields` identical, so the looser key would churn the columns
   * — and refetch — on every unrelated draft edit (icon, label). The dependency stays
   * LIVE: a real field add/remove/reorder produces a new `fields`, hence a new array,
   * hence the refetch that change must have. Stabilising identity here is deliberately
   * a PRODUCER-side fix; ListView's by-identity dependency is correct for a genuine
   * column change and is left alone.
   */
  const gridColumns = React.useMemo(
    () =>
      readFields(objDraft.fields)
        // objectui#11780 — a column the platform injects AND hides (`__search`,
        // `owning_business_unit_id`) is no column an author manages. Read off
        // the definition this memo already holds, so the key stays
        // `objDraft.fields` and the identity reasoning above is unchanged.
        .entries.filter((e) => !isStudioHiddenSystemField(e.def))
        .map((e) => e.name)
        .filter((n) => !STUDIO_SYSTEM_FIELD_NAMES.has(n) && n !== 'actions')
        // cloud#1652 — a column the server does not have yet must not reach the
        // `select`. "+ add field" appends `field_<N>` to the DRAFT, this array
        // is a fetch input, and the data API refuses an unknown projection key
        // by design (dropping it would silently answer a NARROWER projection
        // with a WIDER one). The result was that adding a field replaced the
        // whole grid with "This view's query was refused" — on the most
        // ordinary edit there is.
        //
        // Filtering here rather than at the fetch keeps ONE source of truth for
        // what the grid asks for. The new field is still selected in the
        // inspector, which is where it gets configured; it joins the grid once
        // it is published and therefore queryable.
        .filter((n) => publishedFieldNames.has(n)),
    [objDraft.fields, publishedFieldNames],
  );

  /**
   * The design-mode FORM's fields: the object's own fields, dropping
   * framework-managed/audit fields — the same base set `gridColumns` above
   * uses, but WITHOUT its `actions` exclusion. The grid drops a field named
   * `actions` because the grid always pins its own row-actions column headed
   * "Actions"; the form has no such column, so a data field literally named
   * `actions` stays editable here. That filter difference is why this is a
   * SECOND memo rather than a reuse of `gridColumns` — sharing it would
   * silently drop an `actions` field from the rendered form.
   *
   * Memoized for an IDENTITY reason, not a fetch reason (objectui#4574,
   * ruled to the objectui#4567 producer-side pattern above). `ObjectForm`
   * lists `schema.fields` in its field-generation effect's dependency array
   * BY IDENTITY (plugin-form/src/ObjectForm.tsx). Built inline, this
   * allocated a fresh array on every render of the pillar, so that effect
   * (ending in `setFormFields(generatedFields)`) re-ran on every keystroke —
   * redundant recomputation, NOT a duplicate query: the effect is a pure
   * derivation, and the object-schema fetch and the record load are separate
   * effects, neither of which depends on `schema.fields`. Unlike #4567,
   * there is no `dataSource` call in this effect's dependency chain today —
   * but there is a latent hazard: if one is ever added there, this becomes a
   * #4567 with no producer-side change needed, because the identity is
   * already stable.
   *
   * Keyed on `objDraft.fields` rather than `objDraft`, same reasoning as
   * `gridColumns`: `onPatch` replaces the draft object while keeping
   * `fields` identical, so the looser key would churn (and re-run the form's
   * field-generation effect) on every unrelated draft edit (icon, label).
   */
  const formFields = React.useMemo(
    () =>
      readFields(objDraft.fields)
        // objectui#11780 — the same injected-and-hidden test as `gridColumns`.
        .entries.filter((e) => !isStudioHiddenSystemField(e.def))
        .map((e) => e.name)
        .filter((n) => !STUDIO_SYSTEM_FIELD_NAMES.has(n)),
    [objDraft.fields],
  );

  const onPatch = React.useCallback((patch: Record<string, unknown>) => {
    setObjDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  }, []);

  // "+ new object": create a fresh object as a DRAFT in this package (runtime
  // create — same path the classic Studio editor uses), seeded with one text
  // field so the form/grid isn't empty. It stays draft-only (no physical table)
  // until the package publish, so we land on Form · Layout — the metadata-level
  // surface that never fires data SQL.
  const doCreateObject = React.useCallback(
    async (label: string, rawName: string, sharingModel: OwdCreateModel) => {
      if (readOnly) return;
      // Auto-prefix with the package namespace (framework#2694) so a prefix-less
      // object can't be authored; the rule lives in packages-io/spec.
      const name = prefixObjectName(rawName, namespace);
      if (objects.some((o) => o.name === name)) {
        setError({ message: tFormat('engine.studio.data.idExists', locale, { name }) });
        return;
      }
      setCreateBusy(true);
      setError(null);
      try {
        const body = buildObjectSkeleton(name, label, t('engine.studio.data.nameFieldLabel', locale), sharingModel);
        await client.save('object', name, body, { mode: 'draft', packageId });
        const surface: Surface = { type: 'object', name, label };
        setObjects((prev) => [...prev, surface]);
        setCurrent(surface);
        setViewMode('form');
        setFormMode('layout');
        setCreating(false);
        onDraftSaved?.();
      } catch (e) {
        // Shown in the create dialog, which prints the message only: kept whole.
        setError(plainRefusal(e));
      } finally {
        setCreateBusy(false);
      }
    },
    [objects, client, packageId, onDraftSaved, readOnly, locale, namespace],
  );

  const doSave = React.useCallback(async (sent: DraftSend) => {
    if (!current) return;
    setSaving('draft');
    setError(null);
    // objectui#10202 — the buffer was seeded from the served object, whose
    // picklist-bound fields carry the list's resolved `options`; the door
    // refuses them beside `picklist`, so they stay out of the body.
    // objectui#11785 — kept, so a refusal is read against what was sent.
    const body = dropServedPicklistOptions(objDraft);
    try {
      const outcome = await saveObjDraft('object', current.name, body, { mode: 'draft', packageId });
      // objectui#11773 — the author chose the saved version; the load replaces the buffer.
      if (outcome === 'reloaded') return;
      setHasDraft(true);
      // objectui#11204 — clean only if nothing was edited while it was in flight.
      if (sent.unmoved()) setDirty(false);
      setSavedAt(new Date());
      // No success toast: with auto-save (objectui#5813) it would fire after
      // every editing pause — the quiet last-saved hint is the affordance.
      onDraftSaved?.();
    } catch (e) {
      setError(objectSaveRefusal(e, body, locale));
    } finally {
      setSaving(false);
    }
  }, [saveObjDraft, current, objDraft, onDraftSaved, packageId, locale]);

  // objectui#5813 — auto-save replaces the Save draft button; the blocked guard
  // is the button's old disabled-condition verbatim.
  const { sending: sendingObjDraft, loaded: objLoaded } = useDraftAutoSave({
    // objectui#11232 — the object `doSave` addresses.
    target: `object:${current?.name ?? ''}`,
    loadedFor: objDraftFor,
    dirty,
    blocked: !current || !!saving || readOnly || saveBlocking > 0,
    snapshot: objDraft,
    save: doSave,
  });

  // "+ add field": append a fresh text field and select it for editing in the panel.
  // Guarded in addition to being hidden — it's also reachable through
  // GridFieldAuthoringProvider/ObjectFormDesigner.
  const addField = React.useCallback(() => {
    // objectui#11272 — never onto another object's buffer (not offered then).
    if (readOnly || !objLoaded) return;
    const view = readFields(objDraft.fields);
    const name = nextFieldName(view.entries.map((e) => e.name));
    view.entries.push(newField(name, 'text', t('engine.studio.data.newFieldLabel', locale)));
    setObjDraft((d) => ({ ...d, fields: writeFields(view) }));
    setDirty(true);
    setFieldSel({ kind: 'field', id: name });
  }, [objDraft, readOnly, objLoaded]);

  // Drag-reorder columns → reorder the object's `fields` metadata (field display
  // order follows metadata order), saved as a DRAFT. Published later via the
  // package release — NOT auto-published per reorder as it used to be.
  // objectui#11204 — this save is sent here, not by the autosave, so it takes
  // its claim on the buffer from the autosave's `sending`: an edit taken while
  // it is in flight stays dirty, and the autosave sends it next.
  const doReorderFields = React.useCallback(
    async (orderedNames: string[]) => {
      if (!current) return;
      const view = readFields(objDraft.fields);
      // Reorder only the visible fields among their own slots; keep system /
      // hidden fields (not shown as columns) in their original positions.
      const visible = new Set(orderedNames);
      const visibleInOrder = orderedNames
        .map((n) => view.entries.find((e) => e.name === n))
        .filter((e): e is (typeof view.entries)[number] => Boolean(e));
      let vi = 0;
      const entries = view.entries.map((e) => (visible.has(e.name) ? visibleInOrder[vi++] : e));
      const body = { ...objDraft, fields: writeFields({ ...view, entries }) };
      // objectui#11272 — no claim, no save: the buffer is not this object's.
      const sent = sendingObjDraft(body);
      if (!sent) return;
      setObjDraft(body);
      setSaving('draft');
      setError(null);
      // objectui#10202 — same served `options` as `doSave` above.
      const wire = dropServedPicklistOptions(body);
      try {
        const outcome = await saveObjDraft('object', current.name, wire, { mode: 'draft', packageId });
        if (outcome === 'reloaded') return;
        setHasDraft(true);
        if (sent.unmoved()) setDirty(false);
        onDraftSaved?.();
        setGridVer((v) => v + 1); // remount so the grid reflects the new (draft) order
      } catch (e) {
        setError(objectSaveRefusal(e, wire, locale));
      } finally {
        setSaving(false);
      }
    },
    [saveObjDraft, current, objDraft, onDraftSaved, sendingObjDraft, packageId, locale],
  );

  const inspector = getMetadataInspector('object');

  // The object-level tabs (Data pillar). A shadcn/HIG segmented control: a
  // recessed `bg-muted` track with an elevated `bg-background` pill on the
  // active segment — the inverse of the old transparent-track/grey-active
  // styling, which read as toolbar chrome rather than a distinct nav layer.
  // objectui#5813 — the 90% path is Records / Form (fields ARE the grid's
  // columns, with Add field right beside them, so a separate fields tab would
  // ADD a surface, not remove one). The five power tabs keep their panels
  // untouched behind one "Advanced" menu — capability stays, the default view
  // stops taxing every visit with seven choices (maintainer ruling 2026-08-24).
  const dataTabs: ReadonlyArray<{ key: typeof viewMode; label: string }> = [
    { key: 'grid', label: t('engine.studio.data.tab.records', locale) },
    { key: 'form', label: t('engine.studio.data.tab.form', locale) },
  ];
  const advancedDataTabs: ReadonlyArray<{ key: typeof viewMode; label: string }> = [
    { key: 'rules', label: t('engine.studio.data.tab.rules', locale) },
    { key: 'hooks', label: t('engine.studio.data.tab.hooks', locale) },
    { key: 'actions', label: t('engine.studio.data.tab.actions', locale) },
    { key: 'api', label: t('engine.studio.data.tab.api', locale) },
    { key: 'settings', label: t('engine.studio.data.tab.settings', locale) },
  ];
  const activeAdvancedTab = advancedDataTabs.find((tabDef) => tabDef.key === viewMode);

  // The selected object's own icon (from its metadata) — prefer the loaded
  // draft body, fall back to the rail header. getIcon degrades to Database.
  const HeaderIcon = getIcon(
    objLoaded && typeof objDraft.icon === 'string' ? (objDraft.icon as string) : current?.icon,
  );

  return (
    <div className="flex h-full flex-col">
      {objConflictDialog}
      <div className="flex items-center gap-3 border-b px-3 py-2">
        <button
          type="button"
          onClick={() => setRailOpen((v) => !v)}
          aria-label={t('engine.studio.toggleRail', locale)}
          className="-ml-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        {current ? (
          <span className="flex min-w-0 items-center gap-2">
            {/* eslint-disable-next-line react-hooks/static-components -- getIcon returns a stable icon component from a static registry, not one created during render */}
            <HeaderIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-[15px] font-semibold leading-none text-foreground">{current.label}</span>
            <span className="shrink-0 rounded bg-muted/70 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {current.name}
            </span>
            {/* objectui#11272 — the count reads the buffer: this object's only. */}
            {objLoaded && (
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {tFormat('engine.studio.data.fieldCount', locale, { count: fieldCount })}
              </span>
            )}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">{t('engine.studio.data.pickObject', locale)}</span>
        )}
        {hasDraft && objLoaded && (
          <span className="rounded bg-amber-400/15 px-2 py-0.5 text-[11px] text-amber-600 dark:text-amber-300">
            {t('engine.studio.unpublishedDraft', locale)}
          </span>
        )}
        {/* objectui#5813 — drafts auto-save (see useDraftAutoSave above); the
            hint is the whole affordance: saving spinner while in flight, the
            last-saved time once landed. The old Save draft button is retired. */}
        {saving === 'draft' ? (
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground" data-testid="data-autosaving">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t('engine.studio.autoSaving', locale)}
          </span>
        ) : savedAt && !dirty ? (
          <span className="ml-auto text-[11px] text-muted-foreground" data-testid="data-saved-at">
            {tFormat('engine.studio.data.lastSaved', locale, {
              time: savedAt.toLocaleTimeString(displayLocale, { hour: '2-digit', minute: '2-digit' }),
            })}
          </span>
        ) : null}
      </div>

      <div className="relative flex min-h-0 flex-1">
        {isMobile && railOpen && (
          <div
            className="absolute inset-0 z-10 bg-black/30"
            onClick={() => setRailOpen(false)}
            aria-hidden="true"
          />
        )}
        <nav
          className={cn(
            'flex w-52 shrink-0 flex-col border-r bg-background',
            isMobile && 'absolute inset-y-0 left-0 z-20 shadow-lg transition-transform duration-200',
            isMobile && !railOpen && '-translate-x-full',
          )}
        >
          <div className="shrink-0 p-2 pb-1">
            <p className="px-2 pb-1 pt-1 text-[11px] font-medium text-muted-foreground">{t('engine.studio.data.objects', locale)}</p>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('engine.studio.data.searchObjects', locale)}
              className="h-7 w-full rounded-md border bg-background px-2 text-[11px] outline-none placeholder:text-muted-foreground/70 focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-2 pt-1">
            {objects.length === 0 && (
              <p className="px-2 py-3 text-[11px] text-muted-foreground">
                {error ? t('engine.studio.loadFailed', locale) : objectsLoaded ? t('engine.studio.data.noObjects', locale) : t('engine.studio.loading', locale)}
              </p>
            )}
            {objects
              .filter(
                (o) =>
                  !query.trim() ||
                  o.label.toLowerCase().includes(query.trim().toLowerCase()) ||
                  o.name.toLowerCase().includes(query.trim().toLowerCase()),
              )
              .map((o) => {
                const Icon = getIcon(o.icon);
                return (
                  <button type="button"
                    key={o.name}
                    onClick={() => {
                      setCurrent(o);
                      if (isMobile) setRailOpen(false);
                    }}
                    className={
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs ' +
                      (current?.name === o.name ? 'bg-muted font-medium' : 'text-foreground/90 hover:bg-muted/60')
                    }
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 truncate">{o.label}</span>
                  </button>
                );
              })}
          </div>
          <div className="shrink-0 border-t p-2">
            {readOnly ? (
              <p
                title={t('engine.studio.pkg.readonlyHint', locale)}
                className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-muted-foreground"
              >
                <Lock className="h-3 w-3" /> {t('engine.studio.pkg.readonly', locale)}
              </p>
            ) : (
              <button
                type="button"
                onClick={openCreateDialog}
                className="inline-flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> {t('engine.studio.data.newObject', locale)}
              </button>
            )}
          </div>
        </nav>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden p-4">
          {!current ? (
            objectsLoaded && objects.length === 0 ? (
              /* Fresh package: the first act is creating an object — say so and
               * offer the creator right here (no auto-opened modal, dogfood #2555). */
              <div className="flex flex-col items-center gap-2 py-16 text-center">
                <p className="text-sm font-medium">{t('engine.studio.data.firstObjectTitle', locale)}</p>
                <p className="max-w-sm text-[11px] leading-5 text-muted-foreground">
                  {t('engine.studio.data.firstObjectHint', locale)}
                </p>
                {!readOnly && (
                  <button
                    type="button"
                    data-testid="empty-state-new-object"
                    onClick={openCreateDialog}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-3.5 w-3.5" /> {t('engine.studio.data.newObject', locale)}
                  </button>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-muted-foreground">{t('engine.studio.data.pickObject', locale)}</div>
            )
          ) : (
            <>
              <div className="mb-4 flex shrink-0 items-center gap-3">
                {/* Object-level segmented control — the primary nav layer for
                    the selected object (recessed track, elevated active pill). */}
                <div className="inline-flex items-center gap-0.5 rounded-lg bg-muted p-1">
                  {dataTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setViewMode(tab.key)}
                      aria-pressed={viewMode === tab.key}
                      className={
                        'rounded-md px-3 py-1 text-[13px] transition-all ' +
                        (viewMode === tab.key
                          ? 'bg-background font-medium text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground')
                      }
                    >
                      {tab.label}
                    </button>
                  ))}
                  {/* "Advanced" — the five power panels (objectui#5813). When one
                      is open the trigger wears its NAME and the active pill, so
                      the collapsed default never hides where you are. */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        data-testid="data-tabs-advanced"
                        aria-pressed={Boolean(activeAdvancedTab)}
                        className={
                          'inline-flex items-center gap-1 rounded-md px-3 py-1 text-[13px] transition-all ' +
                          (activeAdvancedTab
                            ? 'bg-background font-medium text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground')
                        }
                      >
                        {activeAdvancedTab
                          ? activeAdvancedTab.label
                          : t('engine.studio.data.tab.advanced', locale)}
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {advancedDataTabs.map((tab) => (
                        <DropdownMenuItem
                          key={tab.key}
                          onSelect={() => setViewMode(tab.key)}
                          className={viewMode === tab.key ? 'font-medium text-primary' : undefined}
                        >
                          {tab.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {(viewMode === 'grid' || viewMode === 'form') && !readOnly && objLoaded && (
                  <button
                    type="button"
                    onClick={addField}
                    title={t('engine.studio.data.addFieldTitle', locale)}
                    className="ml-auto inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" /> {t('engine.studio.data.addField', locale)}
                  </button>
                )}
              </div>
              {error && (
                <StudioRefusalStrip
                  refusal={error}
                  locale={locale}
                  // objectui#11785 — "Show me" opens the named field's inspector.
                  onShow={(target) => setFieldSel({ kind: target.kind, id: target.id })}
                  className="mb-2 px-3 py-1.5 text-[11px]"
                />
              )}
              {!objLoaded ? (
                // objectui#11272 — no view of another object's buffer under
                // this one; after a failed load, the error above says why.
                error && !loading ? null : (
                  <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> {t('engine.studio.loading', locale)}
                  </div>
                )
              ) : viewMode === 'rules' ? (
                <ObjectValidationsPanel
                  draft={objDraft}
                  onPatch={onPatch}
                  disabled={readOnly}
                  onBlockingIssuesChange={reportPanelBlocking}
                />
              ) : viewMode === 'settings' ? (
                <ObjectSettingsPanel
                  name={current.name}
                  draft={objDraft}
                  onPatch={onPatch}
                  locale={locale}
                  disabled={readOnly}
                  onBlockingIssuesChange={reportPanelBlocking}
                />
              ) : viewMode === 'hooks' ? (
                <ObjectHooksPanel
                  objectName={current.name}
                  packageId={packageId}
                  disabled={readOnly}
                  hookSchema={typeSchemas.hook}
                  publishNonce={publishNonce}
                />
              ) : viewMode === 'actions' ? (
                <ObjectActionsPanel
                  draft={objDraft}
                  onPatch={onPatch}
                  disabled={readOnly}
                  actionSchema={typeSchemas.action}
                  onBlockingIssuesChange={reportPanelBlocking}
                />
              ) : viewMode === 'api' ? (
                <ObjectApiPanel name={current.name} draft={objDraft} />
              ) : viewMode === 'grid' && !hasBaseline ? (
                /* Draft-only object: no physical table until the package publish —
                 * rendering the runtime grid would fire data SQL against a table
                 * that doesn't exist. Say so instead of erroring. */
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 text-center">
                  <p className="text-sm font-medium">{t('engine.studio.data.draftObjectTitle', locale)}</p>
                  <p className="max-w-md text-[11px] leading-5 text-muted-foreground">
                    {t('engine.studio.data.draftObjectHint', locale)}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('form');
                      setFormMode('layout');
                    }}
                    className="mt-1 inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs hover:bg-muted"
                  >
                    {t('engine.studio.data.goDesignFields', locale)}
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
              <>
              {/* Records grid — fields are the columns. Header "+" adds a field, the
                * per-column edit affordance opens the field editor, and dragging a
                * column header reorders the object's fields (all via the context). */}
              <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-background">
                <GridFieldAuthoringProvider
                  value={{
                    // Read-only package: keep the per-column inspector (view props)
                    // but drop add-column and drag-reorder — both are doomed writes.
                    ...(readOnly
                      ? {}
                      : {
                          onAddColumn: addField,
                          addColumnLabel: t('engine.studio.data.addField', locale),
                          onReorderFields: doReorderFields,
                        }),
                    onEditColumn: (fieldName) => {
                      // ignore non-field columns (e.g. the row-actions column)
                      if (readFields(objDraft.fields).entries.some((e) => e.name === fieldName)) {
                        setFieldSel({ kind: 'field', id: fieldName });
                      }
                    },
                    editColumnLabel: t('engine.studio.data.editFieldProps', locale),
                  }}
                >
                  {/* Provide the adapter as the dataSource context so the object-grid's
                    * inline-edit save can write back: the ListView only fetches and
                    * passes data inline, leaving the grid itself without a write dataSource. */}
                  <SchemaRendererProvider dataSource={adapter as never}>
                    <PluginObjectView
                      key={`${current.name}:${gridVer}`}
                      schema={
                        {
                          type: 'object-view',
                          objectName: current.name,
                          // "+ New" now lives in the grid's own toolbar (via
                          // renderStudioGridList's `addRecord.enabled`), next to
                          // Hide fields/Filter/Group/Sort — suppress ObjectView's
                          // separate top row so it doesn't render a second,
                          // mostly-empty toolbar above the grid.
                          showCreate: false,
                          // No saved view exists in design mode, so show the object's
                          // own fields as columns (in metadata order), dropping
                          // framework-managed/audit fields so the grid opens on the
                          // meaningful columns first — the way Airtable does.
                          // Memoized at the top of the component: this array's IDENTITY
                          // is a fetch input downstream, so rebuilding it inline here
                          // issued a duplicate find() on every render (objectui#4567).
                          table: {
                            fields: gridColumns,
                          },
                        } as never
                      }
                      dataSource={adapter as never}
                      renderListView={renderStudioGridList}
                    />
                  </SchemaRendererProvider>
                </GridFieldAuthoringProvider>
              </div>
              </>
              ) : (
              <>
              {/* form sub-mode: Layout (WYSIWYG drag/section designer) ⇄
                  Preview (live form) */}
              <div className="mb-3 flex items-center gap-2">
                <div className="inline-flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
                  <button
                    type="button"
                    onClick={() => setFormMode('layout')}
                    aria-pressed={formMode === 'layout'}
                    className={
                      'rounded-md px-2.5 py-0.5 text-[12px] transition-all ' +
                      (formMode === 'layout' ? 'bg-background font-medium text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')
                    }
                  >
                    {t('engine.studio.data.form.layout', locale)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormMode('preview')}
                    aria-pressed={formMode === 'preview'}
                    className={
                      'rounded-md px-2.5 py-0.5 text-[12px] transition-all ' +
                      (formMode === 'preview' ? 'bg-background font-medium text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')
                    }
                  >
                    {t('engine.studio.data.form.preview', locale)}
                  </button>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {formMode === 'layout' ? (
                    // The caption used to assert "your unsaved changes" from
                    // `formMode` alone — a TAB selector — so it claimed pending
                    // edits on every clean layout tab, including in a read-only
                    // package where `Save draft` is disabled and the designer has
                    // no draggable at all (objectui#4036). Say it only when it
                    // is true: real local edits, on a surface that can save
                    // them. `!readOnly` is belt-and-braces — `dirty` is set only
                    // by the edit paths, which the package gate already blocks —
                    // but it makes "no unsaved-changes claim where nothing can
                    // be saved" a property of this line rather than an
                    // inference about a state machine two hundred lines up.
                    dirty && !readOnly
                      ? t('engine.studio.data.form.layoutBadge', locale)
                      : t('engine.studio.data.form.layoutBadgeClean', locale)
                  ) : (
                    t('engine.studio.data.form.previewBadge', locale)
                  )}
                </span>
                {/* Preview renders the PUBLISHED definition on purpose: a draft with
                  * structural changes has no physical columns yet (DDL lands at
                  * publish), so a draft-with-data preview would break. Publishing is
                  * a deliberate user action — say so instead of silently lying. */}
                {formMode === 'preview' && (dirty || hasDraft) && (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-400/15 px-2 py-0.5 text-[11px] text-amber-600 dark:text-amber-300">
                    {t('engine.studio.data.form.previewWarn', locale)}
                  </span>
                )}
              </div>
              {formMode === 'layout' ? (
                <ObjectFormDesigner
                  draft={objDraft}
                  objectName={current.name}
                  systemFieldNames={STUDIO_SYSTEM_FIELD_NAMES}
                  onChange={onPatch}
                  selectedField={fieldSel?.kind === 'field' ? fieldSel.id : null}
                  onSelectField={(name) => setFieldSel({ kind: 'field', id: name })}
                  selectedGroup={fieldSel?.kind === 'group' ? fieldSel.id : null}
                  onSelectGroup={(key) => setFieldSel({ kind: 'group', id: key })}
                  onAddField={addField}
                  readOnly={readOnly}
                />
              ) : !hasBaseline ? (
                /* Draft-only object: there is no published definition to preview yet. */
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 text-center">
                  <p className="text-sm font-medium">{t('engine.studio.data.form.noPublishedTitle', locale)}</p>
                  <p className="max-w-md text-[11px] leading-5 text-muted-foreground">
                    {t('engine.studio.data.form.noPublishedHint', locale)}
                  </p>
                </div>
              ) : (
              <>
              {/* Form — the real runtime ObjectForm ("same renderer"): the object's
                * form exactly as an end user sees it. Clicking any rendered field
                * (event-delegated via the renderer's data-field) selects it into the
                * SAME field inspector the grid uses — one screen, no pillar switch. */}
              <style>{`
                /* Design preview: the form is a click-to-select canvas, not a data-entry
                 * form. Disable interaction on field contents so a click anywhere on a
                 * field routes to its [data-field] wrapper (→ select), and neutralize the
                 * create/cancel footer so nothing is submittable here. */
                .os-form-authoring [data-field]{border-radius:8px;cursor:pointer;transition:box-shadow .12s;padding:8px;margin:-8px 0;}
                .os-form-authoring [data-field] *{pointer-events:none;}
                .os-form-authoring [data-field]:hover{box-shadow:0 0 0 1px hsl(var(--border));}
                .os-form-authoring form > div:last-child:has(button){display:none;}
                ${
                  fieldSel?.kind === 'field'
                    ? `.os-form-authoring [data-field="${String(fieldSel.id).replace(/[^\w-]/g, '')}"]{box-shadow:0 0 0 2px hsl(var(--primary));}`
                    : ''
                }
              `}</style>
              <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-background p-6">
                {/* Match the real display: the runtime form auto-widens (a
                    field-heavy record opens in a near-full-width modal), so its
                    container queries reach up to 4 columns on wide screens. A
                    narrow cap here would misrepresent the end-user layout. */}
                <div
                  className="os-form-authoring mx-auto max-w-6xl"
                  onClick={(e) => {
                    const el = (e.target as HTMLElement).closest('[data-field]');
                    const name = el?.getAttribute('data-field');
                    if (name && readFields(objDraft.fields).entries.some((f) => f.name === name)) {
                      setFieldSel({ kind: 'field', id: name });
                    }
                  }}
                >
                  <SchemaRendererProvider dataSource={adapter as never}>
                    <ObjectForm
                      key={`${current.name}:${gridVer}:form`}
                      schema={
                        {
                          type: 'object-form',
                          objectName: current.name,
                          mode: 'create',
                          // Memoized above at the top of the component: this array's
                          // IDENTITY is a dependency of ObjectForm's field-generation
                          // effect, so rebuilding it inline here re-ran that effect on
                          // every keystroke-level render of the pillar (objectui#4574).
                          fields: formFields,
                        } as never
                      }
                      dataSource={adapter as never}
                    />
                  </SchemaRendererProvider>
                </div>
              </div>
              </>
              )}
              </>
              )}
            </>
          )}
        </main>

        {/* Right rail — property inspector. Fields reuse the shared
          * ObjectFieldInspector; a selected group opens ObjectGroupInspector
          * (label + collapse behaviour). */}
        {/* ⭐ objectui#6795 part C — this guard used to read
          * `(fieldSel.kind === 'group' || inspector)`, so with
          * `getMetadataInspector('object')` undefined and a FIELD selected the
          * whole rail was dropped: measured `aside` count 0, i.e. clicking a
          * field did literally nothing while the designer above it went on
          * saying "click a field to edit its properties". A selection the author
          * just made must always open its rail; whether an EDITOR exists for it
          * is a question the rail body answers, not a reason to swallow the
          * click. (Unreachable in production today only because registration is
          * eager — the very thing part A wants to make lazy.) */}
        {current && fieldSel && objLoaded && (
          <aside className="flex w-80 shrink-0 flex-col border-l">
            <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/95 px-3 py-2 backdrop-blur">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="text-[13px] font-medium">
                {t(fieldSel.kind === 'group' ? 'engine.studio.data.groupProps' : 'engine.studio.data.fieldProps', locale)}
              </span>
              <button
                type="button"
                onClick={() => setFieldSel(null)}
                className="ml-auto rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={t('engine.studio.close', locale)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-auto p-3">
              {fieldSel.kind === 'group' ? (
                <ObjectGroupInspector
                  draft={objDraft}
                  groupKey={fieldSel.id}
                  onPatch={onPatch}
                  onClose={() => setFieldSel(null)}
                  readOnly={readOnly}
                  locale={locale}
                />
              ) : inspector ? (
                React.createElement(inspector, {
                  type: 'object',
                  name: current.name,
                  draft: objDraft,
                  selection: fieldSel,
                  onPatch,
                  onClearSelection: () => setFieldSel(null),
                  onSelectionChange: setFieldSel,
                  onBlockingIssuesChange: (count: number) =>
                    setBlockingReport({ key: fieldSelKey, count }),
                  readOnly,
                  locale,
                })
              ) : (
                /* No field inspector registered. ⛔ Not "loading…" — these
                 * registries have no change notification and this read happens
                 * during render with no subscription, so a late registration
                 * never reaches this component (measured on #6795). State the
                 * fact; recovery is part A. */
                <div className="flex flex-col items-center gap-2 px-2 py-10 text-center text-xs text-muted-foreground">
                  <Ban className="h-5 w-5" />
                  {t('engine.studio.data.fieldInspectorMissing', locale)}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      <CreateItemDialog
        open={creating}
        onOpenChange={setCreating}
        title={t('engine.studio.data.newObject', locale)}
        labelFieldLabel={t('engine.studio.data.nameLabel', locale)}
        labelPlaceholder={t('engine.studio.data.labelPlaceholder', locale)}
        idFieldLabel={t('engine.studio.data.idLabel', locale)}
        idPlaceholder={t('engine.studio.data.idPlaceholder', locale)}
        submitLabel={t('engine.studio.createDraft', locale)}
        submittingLabel={t('engine.studio.creating', locale)}
        busy={createBusy}
        error={error?.message ?? null}
        locale={locale}
        // objectui#11792 — preview the name `doCreateObject` saves: the same
        // `prefixObjectName` over the same `namespace` state, so the dialog
        // shows `repairs_repair_ticket`, not the bare identifier.
        storedName={(identifier) => prefixObjectName(identifier, namespace)}
        extra={
          /* Record sharing (OWD) — the third thing `New object` must ask for
             (`7a90afdf9`). Without it the object saves as a draft happily and
             is then REFUSED at Publish → Publish all by `security-owd-unset`, a
             wall the author meets only after building the whole object. The
             gloss is the SAME string the Settings tab shows for each model, so
             the two surfaces cannot describe one baseline two ways.

             `controlled_by_parent` is absent on purpose — see OWD_CREATE_MODELS:
             a just-created object has no master-detail field for it to derive
             access from. */
          <label className="block">
            <span className="mb-1 block text-[11px] text-muted-foreground">
              {t('engine.studio.data.owdLabel', locale)}
            </span>
            <select
              value={createOwd}
              data-testid="create-object-owd"
              onChange={(e) => setCreateOwd(e.target.value as OwdCreateModel)}
              className="w-full rounded border bg-background px-2 py-1 text-[12px]"
            >
              {OWD_CREATE_MODELS.map((m) => (
                <option key={m} value={m}>
                  {t(OWD_OPTION_LABEL_KEY[m], locale)}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-[11px] text-muted-foreground">
              {t(OWD_OPTION_DESC_KEY[createOwd], locale)}
            </span>
            <span className="mt-1 block text-[11px] text-muted-foreground">
              {t('engine.studio.data.owdHint', locale)}
            </span>
          </label>
        }
        onSubmit={({ label, name }) => void doCreateObject(label, name, createOwd)}
      />
    </div>
  );
}

/** Automations pillar — flows: list → FlowPreview (default OFF / review-then-enable). */
/**
 * One flow's runtime enable/bound state, as `GET /automation/_status` puts it on
 * the wire — the same report `IAutomationService.getFlowRuntimeStates` produces,
 * so the shape is the spec's and is TAKEN from it rather than restated
 * (objectui#7265; this used to be a module-local copy under the spec's own name,
 * already three keys behind it).
 *
 * `Partial<>` is the one deliberate divergence, and it is about the READER, not
 * the contract: this types a JSON body that has not been validated and may come
 * from an older backend that sends neither `enabled` nor `bound` — the effect
 * hard-codes the degraded case (`if (!res.ok) return`, "dots just don't
 * render"). Every member is therefore optional HERE while the contract keeps
 * `name` / `enabled` / `bound` required, and the reads below narrow each one
 * explicitly (`if (s?.name)`, then `s.enabled !== false`, `!!s.bound` and the
 * two string checks in `flowRailState`) instead of trusting the type. Pinned in
 * `spec-symbol-parity.test.ts`: if the spec ever
 * relaxes those three itself, the pin fails and this alias should collapse to a
 * plain re-export.
 */
type FlowRuntimeState = Partial<SpecFlowRuntimeState>;

/**
 * What the Automations rail keeps from one flow's runtime row (objectui#11281).
 *
 * `bound` alone cannot say why an enabled flow is unbound. The contract's
 * `FlowRuntimeState.bound` is false both for a flow that declares no trigger
 * and for one whose declared trigger the engine has not armed, and "`triggerType`
 * distinguishes the two". `reason` is the platform's one sentence for why such a
 * flow is not armed: a deployment policy and a binding failure each arrive in
 * the platform's own words. So the rail keeps both beside `enabled` / `bound`.
 *
 * The shape is `flow-problems`' `FlowRuntimeRow` (objectui#11779): the rail,
 * the flow header and the Problems panel derive one run status from it
 * (`deriveFlowRunStatus`), so it is declared once, where that derivation is.
 */
type FlowRailState = FlowRuntimeRow;

/**
 * Narrow one unvalidated runtime row into the rail's state. `triggerType` and
 * `reason` are kept only as non-empty strings and are otherwise absent, the way
 * the engine omits them, so a row without them, and every older backend, reads
 * exactly as it did before they existed.
 */
function flowRailState(s: FlowRuntimeState): FlowRailState {
  const { triggerType, reason } = s;
  return {
    enabled: s.enabled !== false,
    bound: !!s.bound,
    ...(typeof triggerType === 'string' && triggerType.length > 0 ? { triggerType } : {}),
    ...(typeof reason === 'string' && reason.length > 0 ? { reason } : {}),
  };
}

/**
 * A flow's live status in the Automations rail, from the engine's runtime state
 * (persisted `status` is intent; this is what's actually live). Renders nothing
 * for a flow the engine doesn't know yet (never published) — the amber
 * "unpublished draft" chip already covers that case.
 *
 * The state is the run status `deriveFlowRunStatus` derives, worded by
 * `describeFlowRunStatus` — the derivation the flow header's Status pill and the
 * Problems panel read too (objectui#11779), so the three cannot disagree:
 *   - enabled and bound, or enabled with no declared trigger: a green dot +
 *     "On", titled "bound to its trigger" / "no trigger (run manually)" — a flow
 *     that runs when invoked is never called "not running";
 *   - enabled, with a declared trigger the engine has not armed: a grey
 *     "Not running here" chip — visible without hovering, since the deployment
 *     will never run it on that trigger. Its title is the platform's `reason`,
 *     verbatim (objectui#11281), or, from a backend that predates the field, the
 *     contract's own reading of the row: its trigger is not armed here;
 *   - disabled: a grey dot + "Off".
 * Nothing here is styled as an error: a deployment policy is not a defect.
 */
export function FlowStatusDot({ state, locale }: { state?: FlowRailState; locale: string }): React.ReactElement | null {
  if (!state) return null;
  const status = deriveFlowRunStatus(state);
  const { label, title } = describeFlowRunStatus(status, locale);
  if (status.kind === 'not-running') {
    return (
      <span title={title} className="inline-flex shrink-0 items-center rounded bg-muted px-1.5 py-px text-[10px] text-muted-foreground">
        {label}
      </span>
    );
  }
  const enabled = status.kind !== 'off';
  return (
    <span title={title} className="inline-flex shrink-0 items-center gap-1">
      <span className={'h-1.5 w-1.5 rounded-full ' + (enabled ? 'bg-emerald-500' : 'bg-muted-foreground/40')} />
      <span className={'text-[10px] ' + (enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
        {label}
      </span>
    </span>
  );
}

export function AutomationsPillar({
  packageId,
  publishNonce = 0,
  onDraftSaved,
  readOnly = false,
}: {
  /**
   * The package whose flows the rail lists, or `null` for the package-less
   * scope (objectui#11553, `studioScope.ts`): every flow that belongs to no
   * package, saved as package-less drafts.
   */
  packageId: string | null;
  publishNonce?: number;
  onDraftSaved?: () => void;
  /** Courtesy gate: hide/disable flow-authoring affordances. */
  readOnly?: boolean;
}): React.ReactElement {
  const client = useMetadataClient();
  const locale = useMetadataLocale();
  const navigate = useNavigate();
  // The draft writes' package binding (objectui#11553): none in the
  // package-less scope, so the draft row stays as package-less as the flow it
  // edits. The client sends no `package=` for an absent id.
  const draftPackageId = packageId ?? undefined;
  // See DataPillar's rail — same mobile-overlay treatment for the flow list.
  const isMobile = useIsMobile();
  const [railOpen, setRailOpen] = React.useState(false);
  const [flows, setFlows] = React.useState<Surface[]>([]);
  // objectui#7255 — same live-pulse subscription as the sibling rails; this
  // one only replaces the flow LIST, so it needs no edit-buffer hold either.
  const metadataRefreshNonce = useMetadataRefreshNonce();
  const [current, setCurrent] = React.useState<Surface | null>(null);
  // `?surface=flow:<name>` capture + mirror — shared plumbing (see
  // useSurfaceDeepLink). No producer emits this link yet; honoring it keeps
  // the pillars uniform so a future "design this flow" bridge just works.
  const initialSurface = useSurfaceDeepLink(current);
  // objectui#11553 — the package-less probe for a deep-linked flow this
  // package does not hold runs once per mount, not on every list re-read.
  const deepLinkProbedRef = React.useRef(false);
  const [draft, setDraft] = React.useState<Record<string, unknown>>({});
  // objectui#11272 — the flow `draft` was loaded for, `flow:NAME`: written
  // where the load below installs it, and nowhere else.
  const [draftFor, setDraftFor] = React.useState('');
  // objectui#11773 — the version `draft` was saved at, sent as `If-Match` by
  // every save of this buffer (the autosave and the enable switch). A
  // conflict's "reload" re-runs the flow load below.
  const [flowReloadNonce, setFlowReloadNonce] = React.useState(0);
  const reloadFlowDraft = React.useCallback(() => setFlowReloadNonce((n) => n + 1), []);
  const {
    save: saveFlowDraft,
    forget: forgetFlowVersion,
    dialog: flowConflictDialog,
  } = useDraftSaveGuard(client, reloadFlowDraft);
  const [selection, setSelection] = React.useState<MetadataSelection | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState<false | 'draft' | 'publish'>(false);
  const [hasDraft, setHasDraft] = React.useState(false);
  // objectui#11785 — a load failure as it was (`plainRefusal`), a refused save
  // as an author sentence naming the step and its input, raw text behind Details.
  const [error, setError] = React.useState<StudioRefusal | null>(null);
  // Tells "still fetching the list" apart from "fetched, package has no flows"
  // — without it the empty rail showed an endless "Loading…" for a fresh package.
  const [listed, setListed] = React.useState(false);
  // The flow a deep link named that this rail, once listed, does not hold.
  const missingFlow =
    listed && initialSurface?.type === 'flow' && !flows.some((f) => f.name === initialSurface.name)
      ? initialSurface.name
      : null;
  // Inline create — a fresh package starts with zero flows, so the pillar must
  // offer a way to author the first one (mirrors the object/app creators).
  const [creating, setCreating] = React.useState(false);
  const [createBusy, setCreateBusy] = React.useState(false);
  // objectui#11591 — keyed on the pillar's one type, as the inspector beside
  // it is, never on the open flow's: with no flow open (a deep link naming one
  // this rail does not hold, or an empty rail) a selection-keyed read found no
  // designer and the canvas chip below said none were registered, on a page
  // whose designers are.
  const Preview = getMetadataPreview('flow');
  const inspector = getMetadataInspector('flow');
  const isEditable = !!Preview;
  // objectui#6795 part C — the FOURTH site, found by sweeping past the three the
  // ruling named. Same class as the Interfaces rail: with the registries
  // unpopulated the canvas below degrades to a raw JSON dump, and both the
  // header chip ("click a node to configure") and the rail ("Click a node on the
  // canvas, and its configuration appears here") went on instructing the author
  // to click nodes that are not rendered. Same constraint on the wording — ⛔ no
  // "loading…"/"try again": a late registration never reaches this render.
  const designersUnregistered =
    listMetadataPreviewTypes().length === 0 && listMetadataInspectorTypes().length === 0;

  // Runtime enable/bound state per flow (GET /automation/_status). Persisted
  // `status` is intent; this is what's actually live in the engine — the truth
  // behind the rail's status dots. Refetched after a publish (publishNonce);
  // degrades silently on an older backend / offline (dots just don't render).
  const [flowStatus, setFlowStatus] = React.useState<Record<string, FlowRailState>>({});
  // objectui#11779 — whether `flowStatus` holds an answer from the engine. With
  // one, a flow the map has no row for is a flow the engine does not have
  // (nothing of it is deployed); without one, there is nothing to say about any
  // flow's live state, and the header reads the draft's own switch instead.
  const [flowStatusRead, setFlowStatusRead] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/v1/automation/_status', { credentials: 'include', headers: { Accept: 'application/json' } });
        if (!res.ok) return;
        const payload = (await res.json().catch(() => null)) as { data?: { flows?: FlowRuntimeState[] }; flows?: FlowRuntimeState[] } | null;
        const list = payload?.data?.flows ?? payload?.flows ?? [];
        if (cancelled || !Array.isArray(list)) return;
        const map: Record<string, FlowRailState> = {};
        for (const s of list) if (s?.name) map[s.name] = flowRailState(s);
        setFlowStatus(map);
        setFlowStatusRead(true);
      } catch {
        /* offline / older backend → no dots */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publishNonce]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Published flows ∪ pending DRAFT flows — `list()` only sees
        // published/active metadata, so a just-authored flow that hasn't been
        // published yet (or a fresh writable-base package whose flows are all
        // drafts) would render an empty rail even though "Changes · N" shows the
        // draft exists. Mirrors the Data / Interfaces / Access pillars, which all
        // merge their drafts. Keyed on `publishNonce` too so drafts that go live
        // collapse back into the published rail after a package publish.
        const items =
          packageId === null
            ? await loadPackageLessSurfaces(client, 'flow')
            : await loadPackageSurfaces(client, 'flow', packageId);
        if (cancelled) return;
        setFlows(items);
        const deepLinked = resolveSurfaceDeepLink(items, initialSurface, 'flow');
        // objectui#11553 — a deep link that NAMES a flow this rail does not
        // hold opens no other flow in its place: the first flow under the name
        // of the one asked for is how the clone's link "redirected to another
        // flow". A package-less flow named from a package's pillar is found in
        // the package-less scope and opened there, once per mount.
        const named = initialSurface?.type === 'flow' ? initialSurface.name : null;
        if (named && !deepLinked && packageId !== null && !deepLinkProbedRef.current) {
          deepLinkProbedRef.current = true;
          const packageLess = await loadPackageLessSurfaces(client, 'flow').catch(() => []);
          if (cancelled) return;
          if (packageLess.some((f) => f.name === named)) {
            navigate(studioOrgScopePath({ type: 'flow', name: named }), { replace: true });
            return;
          }
        }
        setCurrent((c) => c ?? deepLinked ?? (named ? null : items[0]) ?? null);
      } catch (e) {
        if (!cancelled) setError(plainRefusal(e));
      } finally {
        if (!cancelled) setListed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, packageId, publishNonce, metadataRefreshNonce]);

  const doCreateFlow = React.useCallback(
    async (label: string, name: string) => {
      setCreateBusy(true);
      setError(null);
      try {
        // Minimal valid, autolaunched skeleton: start → end. The designer fills in
        // the trigger + nodes; publishing it is a separate, user-initiated step.
        //
        // objectui#11779 — and it is born switched OFF, as the bar above the
        // rail promises ("Off by default · review before enabling"). With no
        // `status` the spec's default is `draft`, which the engine arms like
        // `active`: the switch read "Enabled" on a flow nobody had reviewed, and
        // a package publish armed it as soon as it had a trigger. `obsolete` is
        // what the switch itself writes for Off; enabling it is the author's
        // own flip.
        const skeleton = {
          ...buildFlowSkeleton(
            name,
            label,
            t('engine.studio.auto.nodeStart', locale),
            t('engine.studio.auto.nodeEnd', locale),
          ),
          status: 'obsolete',
        };
        await client.save('flow', name, skeleton, { mode: 'draft', packageId: draftPackageId });
        const item: Surface = { type: 'flow', name, label };
        setFlows((fs) => [...fs.filter((f) => f.name !== name), item]);
        setCurrent(item);
        setHasDraft(true);
        setCreating(false);
        onDraftSaved?.();
        toast.success(tFormat('engine.studio.auto.savedDraft', locale, { label }));
      } catch (e) {
        // Shown in the create dialog, which prints the message only: kept whole.
        setError(plainRefusal(e));
      } finally {
        setCreateBusy(false);
      }
    },
    [client, draftPackageId, onDraftSaved, locale],
  );

  React.useEffect(() => {
    if (!current) return;
    let cancelled = false;
    // objectui#11331 — whether this run's load has settled (see the cleanup).
    let settled = false;
    setLoading(true);
    setError(null);
    setSelection(null);
    (async () => {
      try {
        const [layRaw, draftResp] = await Promise.all([
          client.layered<Record<string, unknown>>('flow', current.name),
          client.getDraft<Record<string, unknown>>('flow', current.name).catch(() => null),
        ]);
        if (cancelled) return;
        const lay = layRaw as { effective?: Record<string, unknown>; code?: Record<string, unknown> };
        const baseline = (lay.effective ?? lay.code ?? {}) as Record<string, unknown>;
        const draftBody = extractDraftBody(draftResp);
        // Served draft as-is, baseline only without one (objectui#10765).
        setDraft(draftBody ?? baseline);
        setDraftFor(`flow:${current.name}`);
        // objectui#11773 — a read serves no version: the next save is unpinned.
        forgetFlowVersion();
        setHasDraft(!!draftBody);
      } catch (e) {
        if (!cancelled) setError(plainRefusal(e));
      } finally {
        settled = true;
        if (!cancelled) {
          setLoading(false);
          setAutoDirty(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      // objectui#11331 — a load cancelled before it settled lowers the
      // `loading` it raised, as in InterfacesPillar's draft load.
      if (!settled) setLoading(false);
    };
  }, [client, current, publishNonce, flowReloadNonce, forgetFlowVersion]);

  // objectui#5813 — local dirty flag: auto-save arms only after a real edit.
  const [autoDirty, setAutoDirty] = React.useState(false);
  const onPatch = React.useCallback(
    (patch: Record<string, unknown>) => {
      setDraft((d) => ({ ...d, ...patch }));
      setAutoDirty(true);
    },
    [],
  );
  const doSave = React.useCallback(async (sent: DraftSend) => {
    if (!current) return;
    setSaving('draft');
    setError(null);
    try {
      const outcome = await saveFlowDraft('flow', current.name, draft, { mode: 'draft', packageId: draftPackageId });
      // objectui#11773 — the author chose the saved version; the load replaces the buffer.
      if (outcome === 'reloaded') return;
      setHasDraft(true);
      // objectui#11204 — clean only if nothing was edited while it was in flight.
      if (sent.unmoved()) setAutoDirty(false);
      onDraftSaved?.();
    } catch (e) {
      // objectui#11785 — read against `draft`, the body this save sent.
      setError(flowSaveRefusal(e, draft, locale));
    } finally {
      setSaving(false);
    }
  }, [saveFlowDraft, current, draft, draftPackageId, onDraftSaved, locale]);
  const { sending: sendingFlowDraft, loaded: flowLoaded } = useDraftAutoSave({
    // objectui#11232 — the flow `doSave` addresses.
    target: `flow:${current?.name ?? ''}`,
    loadedFor: draftFor,
    dirty: autoDirty,
    blocked: !current || !isEditable || !!saving || readOnly,
    snapshot: draft,
    save: doSave,
  });

  // Enable/disable persists via the flow's deployment `status` (active = on,
  // obsolete = off) — the engine honors it on the next publish. The switch flips
  // it and saves the draft immediately; the change goes live when the package is
  // published (so "review before enabling" is preserved).
  const flowEnabled = draft.status !== 'obsolete' && draft.status !== 'invalid';
  // The flow the draft on screen belongs to — read by the toggle's rollback
  // below, so a refusal that lands after the author opened another flow never
  // rewrites that other flow's draft.
  const draftFlowRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    draftFlowRef.current = current?.name ?? null;
  }, [current]);
  const toggleEnabled = React.useCallback(async () => {
    // Guarded in addition to being disabled (objectui#11124): a read-only
    // package refuses the draft save, so the flip would only be rolled back.
    if (!current || readOnly) return;
    const flowName = current.name;
    const prevDraft = draft;
    const next = !(draft.status !== 'obsolete' && draft.status !== 'invalid');
    const nextStatus = next ? 'active' : 'obsolete';
    const nextDraft = { ...draft, status: nextStatus };
    // objectui#11272 — refused on a buffer that is not this flow's document
    // (its load is not in yet): the switch is not offered then either.
    if (!sendingFlowDraft(nextDraft)) return;
    setDraft(nextDraft);
    setSaving('draft');
    setError(null);
    try {
      // objectui#11773 — a reload replaced the buffer the flip was taken on.
      if ((await saveFlowDraft('flow', flowName, nextDraft, { mode: 'draft', packageId: draftPackageId })) === 'reloaded') return;
      setHasDraft(true);
      onDraftSaved?.();
      toast.success(next ? t('engine.studio.auto.enabledToast', locale) : t('engine.studio.auto.disabledToast', locale));
    } catch (e) {
      // objectui#11124 — the save was refused, so roll the optimistic flip
      // back: the switch and the canvas status (both read `draft.status`) must
      // never show a status the server refused. Only `status` is put back, so
      // an edit made while the save was in flight survives; and only on the
      // same flow, still holding the refused status.
      setDraft((d) => {
        if (draftFlowRef.current !== flowName || d.status !== nextStatus) return d;
        const { status: _refused, ...rest } = d;
        return 'status' in prevDraft ? { ...rest, status: prevDraft.status } : rest;
      });
      setError(flowSaveRefusal(e, nextDraft, locale));
    } finally {
      setSaving(false);
    }
  }, [saveFlowDraft, current, draft, draftPackageId, onDraftSaved, locale, readOnly, sendingFlowDraft]);

  return (
    <div className="flex h-full flex-col">
      {flowConflictDialog}
      <div className="flex items-center gap-2 border-b px-3 py-1.5">
        <button
          type="button"
          onClick={() => setRailOpen((v) => !v)}
          aria-label={t('engine.studio.toggleRail', locale)}
          className="-ml-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <span className="text-[11px] text-muted-foreground">{t('engine.studio.auto.defaultOff', locale)}</span>
        {hasDraft && flowLoaded && (
          <span className="rounded bg-amber-400/15 px-2 py-0.5 text-[11px] text-amber-600 dark:text-amber-300">
            {t('engine.studio.unpublishedDraft', locale)}
          </span>
        )}
        {/* objectui#11272 — the switch reads and saves the open flow's own
            document, so it waits for it: not offered over another's. */}
        {current && flowLoaded && (
          <button
            type="button"
            role="switch"
            aria-checked={flowEnabled}
            onClick={toggleEnabled}
            // objectui#11124 — a read-only package takes no status change: the
            // draft save would be refused (`ITEM_LOCKED`).
            disabled={!isEditable || !!saving || readOnly}
            title={
              readOnly
                ? t('engine.studio.pkg.readonlyHint', locale)
                : flowEnabled
                  ? t('engine.studio.auto.disableTitle', locale)
                  : t('engine.studio.auto.enableTitle', locale)
            }
            className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] hover:bg-muted disabled:opacity-50"
          >
            <span className={'relative inline-flex h-3.5 w-6 shrink-0 items-center rounded-full transition-colors ' + (flowEnabled ? 'bg-emerald-500' : 'bg-muted-foreground/40')}>
              <span className={'inline-block h-2.5 w-2.5 rounded-full bg-white transition-transform ' + (flowEnabled ? 'translate-x-3' : 'translate-x-0.5')} />
            </span>
            {flowEnabled ? t('engine.studio.auto.enabled', locale) : t('engine.studio.auto.disabled', locale)}
          </button>
        )}
        {/* objectui#5813 — drafts auto-save; the spinner is the affordance. */}
        {saving === 'draft' && (
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground" data-testid="auto-autosaving">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t('engine.studio.autoSaving', locale)}
          </span>
        )}
      </div>

      <div className="relative flex min-h-0 flex-1">
        {isMobile && railOpen && (
          <div
            className="absolute inset-0 z-10 bg-black/30"
            onClick={() => setRailOpen(false)}
            aria-hidden="true"
          />
        )}
        <nav
          className={cn(
            'flex w-52 shrink-0 flex-col overflow-auto border-r bg-background p-2',
            isMobile && 'absolute inset-y-0 left-0 z-20 shadow-lg transition-transform duration-200',
            isMobile && !railOpen && '-translate-x-full',
          )}
        >
          <div className="flex items-center gap-1 px-2 pb-1 pt-1">
            <p className="flex-1 text-[11px] font-medium text-muted-foreground">{t('engine.studio.auto.heading', locale)}</p>
            {/* objectui#11553 — no "New" in the package-less scope: new
                authoring stays package-first, and this scope reaches flows
                that already exist without a package. */}
            {!readOnly && packageId !== null && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setCreating(true);
                }}
                title={t('engine.studio.auto.newTitle', locale)}
                className="inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[11px] hover:bg-muted"
              >
                <Plus className="h-3 w-3" /> {t('engine.studio.new', locale)}
              </button>
            )}
          </div>
          {flows.length > 0 &&
            flows.map((f) => (
              <button type="button"
                key={f.name}
                onClick={() => {
                  setCurrent(f);
                  if (isMobile) setRailOpen(false);
                }}
                className={
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs ' +
                  (current?.name === f.name ? 'bg-muted font-medium' : 'text-foreground/90 hover:bg-muted/60')
                }
              >
                <Workflow className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 truncate">{f.label}</span>
                <FlowStatusDot state={flowStatus[f.name]} locale={locale} />
              </button>
            ))}
          {flows.length === 0 && !creating && (
            <p className="px-2 py-3 text-[11px] text-muted-foreground">
              {error
                ? t('engine.studio.loadFailed', locale)
                : !listed
                  ? t('engine.studio.loading', locale)
                  : packageId === null
                    ? t('engine.studio.org.none', locale)
                    : t('engine.studio.auto.none', locale)}
            </p>
          )}
        </nav>

        <main className="flex min-w-0 flex-1 flex-col overflow-auto bg-muted/30 p-4">
          <div className="mb-3 flex shrink-0 items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
              <Workflow className="h-3 w-3" />{' '}
              {isEditable
                ? t('engine.studio.auto.canvasHint', locale)
                : t('engine.studio.auto.designersMissing', locale)}
            </span>
            {current && <span className="text-[11px] text-muted-foreground">flow · {current.name}</span>}
          </div>
          {error && (
            <StudioRefusalStrip
              refusal={error}
              locale={locale}
              // objectui#11785 — "Show me" selects the named step, which opens
              // its inspector in the right rail.
              onShow={(target) => setSelection({ kind: target.kind, id: target.id })}
              className="mb-3 shrink-0 px-3 py-2 text-xs"
            />
          )}
          {/* `flex-1 min-h-0` so the canvas fills the pillar's full remaining
            * height instead of shrinking to FlowCanvas's intrinsic content
            * height and leaving a dead band below the bordered frame. */}
          <div className="min-h-0 flex-1 rounded-lg border bg-background p-4">
            {!current ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                {/* objectui#11553 — a deep link that named a flow this rail
                    does not hold says so, instead of opening another. */}
                {missingFlow
                  ? tFormat('engine.studio.auto.deepLinkMissing', locale, { name: missingFlow })
                  : t('engine.studio.auto.pick', locale)}
              </div>
            ) : loading || !flowLoaded ? (
              // objectui#11272 — nothing of another flow's buffer under this
              // one; after a failed load, the error above says why.
              error && !loading ? null : (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t('engine.studio.loading', locale)}
                </div>
              )
            ) : Preview ? (
              // objectui#11779 — the open flow's runtime row, so the flow
              // header and its Problems panel read the run status this rail
              // reads: the row, `null` when the engine has none for this flow,
              // nothing while no runtime answer is in.
              <FlowRuntimeContext.Provider value={flowStatusRead ? (flowStatus[current.name] ?? null) : undefined}>
                {React.createElement(Preview, {
                  type: current.type,
                  name: current.name,
                  draft,
                  editing: true,
                  selection,
                  onSelectionChange: setSelection,
                  // objectui#11124 — a read-only package gets no `onPatch`: per
                  // the preview contract the canvas is then read-only (no add,
                  // insert, drag or delete — each a doomed write), while node and
                  // edge selection still open the inspector read-only below.
                  onPatch: readOnly ? undefined : onPatch,
                  locale,
                })}
              </FlowRuntimeContext.Provider>
            ) : (
              <pre className="overflow-auto text-[11px] text-muted-foreground">
                {JSON.stringify(draft, null, 2)}
              </pre>
            )}
          </div>
        </main>

        <aside className="w-72 shrink-0 overflow-auto border-l">
          <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/95 px-3 py-2 backdrop-blur">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="text-[13px] font-medium">{t('engine.studio.auto.config', locale)}</span>
            {selection && (
              <button
                type="button"
                onClick={() => setSelection(null)}
                className="ml-auto rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={t('engine.studio.deselect', locale)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </header>
          <div className="p-3">
            {selection && inspector && current && flowLoaded ? (
              React.createElement(inspector, {
                type: 'flow',
                name: current.name,
                draft,
                selection,
                onPatch,
                onClearSelection: () => setSelection(null),
                onSelectionChange: setSelection,
                // objectui#11124 — the pillar's real flag, threaded exactly as
                // the Data pillar threads it (objectui#2259).
                readOnly,
                locale,
              })
            ) : designersUnregistered ? (
              <div className="flex flex-col items-center gap-2 px-2 py-10 text-center text-xs text-muted-foreground">
                <Ban className="h-5 w-5" />
                {t('engine.studio.auto.designersMissing', locale)}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 px-2 py-10 text-center text-xs text-muted-foreground">
                <MousePointer2 className="h-5 w-5" />
                {t('engine.studio.auto.emptyLine1', locale)}
                <br />
                {t('engine.studio.auto.emptyLine2', locale)}
              </div>
            )}
          </div>
        </aside>
      </div>

      <CreateItemDialog
        open={creating}
        onOpenChange={setCreating}
        title={t('engine.studio.auto.newTitle', locale)}
        labelFieldLabel={t('engine.studio.auto.nameLabel', locale)}
        labelPlaceholder={t('engine.studio.auto.namePlaceholder', locale)}
        idFieldLabel={t('engine.studio.auto.idLabel', locale)}
        idPlaceholder={t('engine.studio.auto.idPlaceholder', locale)}
        submitLabel={t('engine.studio.createDraft', locale)}
        submittingLabel={t('engine.studio.creating', locale)}
        busy={createBusy}
        error={error?.message ?? null}
        locale={locale}
        onSubmit={({ label, name }) => void doCreateFlow(label, name)}
      />
    </div>
  );
}

/**
 * Access pillar — the permission workbench (builder-ui §7, ADR-0084's fourth
 * content pillar). Left rail: the environment's permission sets / profiles;
 * main: the Salesforce-style PermissionMatrixEditPage (objects × CRUD/VAMA +
 * field-level R/W).
 *
 * Scope note (ADR-0086 P0/P1/P2): the pillar is scoped to the current package.
 * The left rail lists only permission sets this package owns — the metadata API
 * filters `permission` by the record-level `package_id` provenance server-side
 * (P1), so environment-owned platform defaults (`admin_full_access`,
 * `member_default`, …) are excluded by the backend. The object MATRIX lists only
 * the objects this package declares, and Save merges just that slice back,
 * leaving other packages' contributed rows untouched (P0). Save writes a package
 * DRAFT and publishes with the whole package via the top-bar Publish (P2, D6).
 */
// Exported for tests — routed only through StudioDesignSurface in production.
export function AccessPillar({
  packageId,
  publishNonce,
  onDraftSaved,
  readOnly = false,
  onDirtyChange,
}: {
  packageId: string;
  publishNonce?: number;
  onDraftSaved?: () => void;
  /** Courtesy gate: hide/disable permission-authoring affordances. */
  readOnly?: boolean;
  /** objectui#2600 — mirrors the pillar's unsaved-edit state (permission
   * matrix or OWD overview rows) up to the Studio header, whose
   * pillar/Home/package navigation unmounts this whole pillar (SPA nav, so no
   * beforeunload). Reports `false` when the pillar unmounts, same contract as
   * PermissionMatrixEditPage's own onDirtyChange. */
  onDirtyChange?: (dirty: boolean) => void;
}): React.ReactElement {
  const client = useMetadataClient();
  const locale = useMetadataLocale();
  // See DataPillar's rail — same mobile-overlay treatment for the permission-set list.
  const isMobile = useIsMobile();
  const [railOpen, setRailOpen] = React.useState(false);
  // objectui#7255 — same live-pulse subscription as the sibling rails; this
  // one only replaces the permission-set LIST, so no edit-buffer hold.
  const metadataRefreshNonce = useMetadataRefreshNonce();
  const [perms, setPerms] = React.useState<
    Array<{ name: string; label: string; isDefault?: boolean }>
  >([]);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [current, setCurrent] = React.useState<string | null>(null);
  // The Record Sharing Baseline (OWD) overview is a sibling surface to the
  // permission-set matrix (objectui#2505) — same package-author ownership
  // boundary, no principal dimension. `owdOpen` swaps the main panel to it;
  // `owdHighlight` carries the object a permission-matrix badge deep-linked to.
  const [owdOpen, setOwdOpen] = React.useState(false);
  const [owdHighlight, setOwdHighlight] = React.useState<string | null>(null);
  const appliedOwdDeepLink = React.useRef(false);
  // `?surface=permission:<name>` / `?surface=owd:overview` capture + mirror —
  // shared plumbing (see useSurfaceDeepLink). This rail keys `current` by name,
  // so wrap the open surface in the identity the param carries.
  const currentSurface = React.useMemo(
    () =>
      owdOpen
        ? { type: 'owd', name: 'overview' }
        : current
          ? { type: 'permission', name: current }
          : null,
    [owdOpen, current],
  );
  const initialSurface = useSurfaceDeepLink(currentSurface);
  const [query, setQuery] = React.useState('');
  // inline creator (same rail pattern as the Data pillar's object creator)
  const [creating, setCreating] = React.useState(false);
  const [createErr, setCreateErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  // [ADR-0090 D6] "why can this user access?" — right-side explain sheet.
  const [explainOpen, setExplainOpen] = React.useState(false);
  // Both main-panel surfaces hold unsaved edits and unmount on a rail-driven
  // swap: the matrix page is keyed by `current` (and unmounts entirely when
  // the OWD overview swaps in), and the OWD overview batch-editor unmounts
  // when a set swaps back in. Each editor reports its dirty state up
  // (`onDirtyChange` — the two never coexist, so at most one bit is set), and
  // every swap is gated on this confirm — same native prompt as the metadata
  // editor's leave guard. Each editor resets its report on unmount, so a
  // confirmed discard clears its bit by itself.
  const [matrixDirty, setMatrixDirty] = React.useState(false);
  const [owdDirty, setOwdDirty] = React.useState(false);
  const pillarDirty = matrixDirty || owdDirty;
  // The combined bit also gates the Studio header's pillar/Home/package
  // navigation, which unmounts this whole pillar (objectui#2600) — mirror it
  // up alongside the local rail guard. Ref-stabilized like the editors' own
  // reports; the unmount cleanup reports `false` so a discarded pillar clears
  // the surface's guard state.
  const onDirtyChangeRef = React.useRef(onDirtyChange);
  React.useEffect(() => {
    onDirtyChangeRef.current = onDirtyChange;
  });
  React.useEffect(() => {
    onDirtyChangeRef.current?.(pillarDirty);
  }, [pillarDirty]);
  React.useEffect(
    () => () => {
      onDirtyChangeRef.current?.(false);
    },
    [],
  );
  const confirmDiscardEdits = React.useCallback(() => {
    if (!pillarDirty) return true;
    return window.confirm(t('engine.edit.unsavedLeaveConfirm', locale));
  }, [pillarDirty, locale]);

  const load = React.useCallback(async () => {
    try {
      // Scope the rail to this package server-side (ADR-0086 P1): the metadata
      // API filters `permission` by the record-level `package_id` provenance, so
      // it returns only the sets this package owns — environment-owned platform
      // defaults (`admin_full_access`, `member_default`, …) are excluded by the
      // backend, not the client. (The `?package=` list rows don't echo the
      // provenance columns, so a client-side filter can't do this.)
      //
      // ADR-0086 P2 (D6): a package permission set is draft/published metadata,
      // so the rail shows published ∪ pending-draft sets — a set created (or
      // renamed) as a draft but not yet published must still appear, just like
      // the Data/Interfaces pillars merge their drafts. Draft headers are
      // already package-scoped by `listDrafts({ packageId })`.
      const [list, drafts] = await Promise.all([
        client.list('permission', { packageId }) as Promise<Array<Record<string, unknown>>>,
        client.listDrafts({ packageId, type: 'permission' }).catch(() => []),
      ]);
      const byName = new Map<string, { name: string; label: string; isDefault?: boolean }>();
      for (const p of list || []) {
        const name = String(p.name ?? (p as Record<string, unknown>).id ?? '');
        if (!name) continue;
        byName.set(name, {
          name,
          label: String(p.label ?? p.name ?? ''),
          isDefault: !!(p as Record<string, unknown>).isDefault,
        });
      }
      for (const d of (drafts as Array<{ name?: string }>) || []) {
        const name = String(d?.name ?? '');
        if (!name || byName.has(name)) continue;
        byName.set(name, { name, label: name });
      }
      const scoped = [...byName.values()];
      setPerms(scoped);
      // A `?surface=owd:overview` deep-link opens the OWD overview instead of a
      // permission set; `current` still defaults to the first set so switching
      // back to the matrix has a target. Applied once — a later publish re-runs
      // `load`, and we must not yank the user back to OWD then.
      if (!appliedOwdDeepLink.current && initialSurface?.type === 'owd') {
        appliedOwdDeepLink.current = true;
        setOwdOpen(true);
      }
      const deepLinked = resolveSurfaceDeepLink(scoped, initialSurface, 'permission');
      setCurrent((c) => c ?? deepLinked?.name ?? scoped[0]?.name ?? null);
    } catch (e) {
      setError(formatMetadataError(e));
    } finally {
      setLoaded(true);
    }
  }, [client, packageId]);

  React.useEffect(() => {
    void load();
    // Re-read after a package publish so drafts that went live collapse into
    // the published rail (ADR-0086 P2), and on the live-metadata pulse so a
    // copilot turn's permission set appears without a page reload (#7255).
  }, [load, publishNonce, metadataRefreshNonce]);

  const doCreate = React.useCallback(
    async (label: string, name: string) => {
      setBusy(true);
      setCreateErr(null);
      try {
        // Package door → create as a DRAFT stamped with this package (D6/D7),
        // published atomically with the rest of the package.
        await client.save('permission', name, buildPermissionSkeleton(name, label), { mode: 'draft', packageId });
        toast.success(tFormat('engine.studio.access.created', locale, { label }));
        setCreating(false);
        onDraftSaved?.();
        await load();
        // Land on the new set's matrix — also from the OWD overview, whose
        // discard the "+ New" gate already confirmed up front.
        setOwdOpen(false);
        setCurrent(name);
      } catch (e) {
        setCreateErr(formatMetadataError(e));
      } finally {
        setBusy(false);
      }
    },
    [client, load, packageId, onDraftSaved, locale],
  );

  const filtered = perms.filter(
    (p) =>
      !query.trim() ||
      p.label.toLowerCase().includes(query.trim().toLowerCase()) ||
      p.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-1.5">
        <button
          type="button"
          onClick={() => setRailOpen((v) => !v)}
          aria-label={t('engine.studio.toggleRail', locale)}
          className="-ml-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Shield className="h-3.5 w-3.5" />
          <span className="text-[13px] font-medium text-foreground">{t('engine.studio.access.title', locale)}</span>
          <span className="rounded bg-muted px-1.5 py-0.5">{t('engine.studio.access.subtitle', locale)}</span>
        </span>
        <button
          type="button"
          onClick={() => setExplainOpen(true)}
          className="ml-auto flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ShieldQuestion className="h-3.5 w-3.5" />
          {t('engine.studio.access.explain.open', locale)}
        </button>
        <span
          title={t('engine.studio.access.bannerTitle', locale)}
          className="rounded bg-amber-400/15 px-2 py-0.5 text-[11px] text-amber-600 dark:text-amber-300"
        >
          {t('engine.studio.access.banner', locale)}
        </span>
      </div>

      {/* ADR-0090 D5/D9 — this package's pending suggested audience bindings
          (isDefault sets shipped by the package, awaiting the admin's
          confirm). Renders nothing when there are none or for non-admins;
          confirm is enforced server-side by the anchor gates. */}
      {!readOnly && (
        <SuggestedBindingsPanel
          packageId={packageId}
          className="mx-3 mt-2"
          strings={{
            describe: (s) =>
              tFormat(
                s.anchor === 'guest'
                  ? 'engine.studio.access.suggestPromptGuest'
                  : 'engine.studio.access.suggestPromptEveryone',
                locale,
                { set: s.permission_set_name },
              ),
            confirm: t('engine.studio.access.suggestConfirm', locale),
            confirming: t('engine.studio.access.suggestConfirming', locale),
            dismiss: t('engine.studio.access.suggestDismiss', locale),
            confirmedToast: (s) =>
              tFormat('engine.studio.access.suggestConfirmedToast', locale, {
                set: s.permission_set_name,
                anchor: s.anchor,
              }),
            dismissedToast: (s) =>
              tFormat('engine.studio.access.suggestDismissedToast', locale, { set: s.permission_set_name }),
          }}
        />
      )}

      <div className="relative flex min-h-0 flex-1">
        {isMobile && railOpen && (
          <div
            className="absolute inset-0 z-10 bg-black/30"
            onClick={() => setRailOpen(false)}
            aria-hidden="true"
          />
        )}
        <nav
          className={cn(
            'flex w-52 shrink-0 flex-col border-r bg-background',
            isMobile && 'absolute inset-y-0 left-0 z-20 shadow-lg transition-transform duration-200',
            isMobile && !railOpen && '-translate-x-full',
          )}
        >
          {/* Pinned sibling surface: the package-wide Record Sharing Baseline
              (OWD) overview (objectui#2505). Same package-author ownership as
              the sets below, but a distinct surface — not a permission set. */}
          <div className="border-b p-2 pb-2">
            <button
              type="button"
              onClick={() => {
                // Re-clicking the open overview is a no-op — nothing
                // remounts, so no confirm (mirrors the set re-click below).
                if (owdOpen) {
                  setOwdHighlight(null);
                  if (isMobile) setRailOpen(false);
                  return;
                }
                if (!confirmDiscardEdits()) return;
                setOwdOpen(true);
                setOwdHighlight(null);
                if (isMobile) setRailOpen(false);
              }}
              className={
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs ' +
                (owdOpen ? 'bg-muted font-medium' : 'text-foreground/90 hover:bg-muted/60')
              }
            >
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{t('engine.studio.owd.railLabel', locale)}</span>
            </button>
          </div>
          <div className="p-2 pb-0">
            <p className="px-2 pb-1 pt-1 text-[11px] font-medium text-muted-foreground">{t('engine.studio.access.heading', locale)}</p>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('engine.studio.access.search', locale)}
              className="mb-1 h-7 w-full rounded-md border bg-background px-2 text-[11px] outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-2 pt-1">
            {perms.length === 0 && (
              <p className="px-2 py-3 text-[11px] text-muted-foreground">
                {error ? t('engine.studio.loadFailed', locale) : loaded ? t('engine.studio.access.none', locale) : t('engine.studio.loading', locale)}
              </p>
            )}
            {filtered.map((p) => (
              <button type="button"
                key={p.name}
                onClick={() => {
                  // Re-clicking the already-open set is a no-op — nothing
                  // remounts, so no confirm.
                  if (!owdOpen && current === p.name) {
                    if (isMobile) setRailOpen(false);
                    return;
                  }
                  if (!confirmDiscardEdits()) return;
                  setOwdOpen(false);
                  setCurrent(p.name);
                  if (isMobile) setRailOpen(false);
                }}
                className={
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs ' +
                  (!owdOpen && current === p.name ? 'bg-muted font-medium' : 'text-foreground/90 hover:bg-muted/60')
                }
              >
                <Shield className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{p.label}</span>
                {p.isDefault && (
                  <span className="text-[9px] uppercase tracking-wide text-muted-foreground/60">
                    default
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="shrink-0 border-t p-2">
            {readOnly ? (
              <p
                title={t('engine.studio.pkg.readonlyHint', locale)}
                className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-muted-foreground"
              >
                <Lock className="h-3 w-3" /> {t('engine.studio.pkg.readonly', locale)}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => {
                  // Creating a set lands on the new set's matrix — a remount
                  // of the open matrix, or a swap out of the OWD overview —
                  // so gate the flow up front.
                  if (!confirmDiscardEdits()) return;
                  setCreateErr(null);
                  setCreating(true);
                }}
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> {t('engine.studio.access.new', locale)}
              </button>
            )}
          </div>
        </nav>

        <main className="min-w-0 flex-1 overflow-auto">
          {owdOpen ? (
            /* Sibling surface: the package-wide OWD baseline overview
             * (objectui#2505) — object × sharingModel × externalSharingModel,
             * batch-edited as per-object drafts. */
            <PackageOwdOverviewPanel
              client={client}
              packageId={packageId}
              publishNonce={publishNonce}
              onDraftSaved={onDraftSaved}
              readOnly={readOnly}
              locale={locale}
              highlightObject={owdHighlight}
              onDirtyChange={setOwdDirty}
            />
          ) : current ? (
            /* The existing Salesforce-style matrix page, embedded unchanged —
             * objects × CRUD/VAMA/lifecycle up top, per-object field-level R/W
             * below, its own Save + destructive-change guard included. The
             * read-only OWD badge deep-links to the overview above. */
            <PermissionMatrixEditPage
              key={current}
              type="permission"
              name={current}
              packageId={packageId}
              publishNonce={publishNonce}
              onDraftSaved={onDraftSaved}
              readOnly={readOnly}
              onDirtyChange={setMatrixDirty}
              embedded
              onOpenOwd={(objectName) => {
                // The badge deep-link swaps this page out for the OWD
                // overview — same remount, same guard.
                if (!confirmDiscardEdits()) return;
                setOwdHighlight(objectName || null);
                setOwdOpen(true);
              }}
            />
          ) : (
            <div className="py-16 text-center text-sm text-muted-foreground">
              {loaded && perms.length === 0 ? t('engine.studio.access.emptyMain', locale) : t('engine.studio.access.pick', locale)}
            </div>
          )}
        </main>
      </div>

      <AccessExplainPanel open={explainOpen} onOpenChange={setExplainOpen} packageId={packageId} />

      <CreateItemDialog
        open={creating}
        onOpenChange={setCreating}
        title={t('engine.studio.access.new', locale)}
        labelFieldLabel={t('engine.studio.access.nameLabel', locale)}
        labelPlaceholder={t('engine.studio.access.labelPlaceholder', locale)}
        idFieldLabel={t('engine.studio.access.idLabel', locale)}
        idPlaceholder={t('engine.studio.access.idPlaceholder', locale)}
        submitLabel={t('engine.studio.create', locale)}
        submittingLabel={t('engine.studio.creating', locale)}
        busy={busy}
        error={createErr}
        locale={locale}
        onSubmit={({ label, name }) => void doCreate(label, name)}
      />
    </div>
  );
}

export default StudioDesignSurface;
