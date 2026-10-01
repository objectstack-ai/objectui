/**
 * Page View Component
 *
 * Renders a custom page based on the pageName parameter. Page *authoring*
 * happens in the metadata studio (canvas + inspector), not here — runtime is
 * pure rendering. For parity with the view/report/dashboard runtime editors,
 * admins get a lightweight "Edit in studio" affordance that deep-links to the
 * page's studio editor (`/apps/:app/metadata/page/:name`) rather than
 * embedding the heavyweight page canvas in the runtime.
 */

import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  SchemaRenderer,
  notifyDataChanged,
  useAdapter,
  RelatedRecordActionsProvider,
} from '@object-ui/react';
import { Empty, EmptyTitle, EmptyDescription, Spinner } from '@object-ui/components';
import { FileText, Pencil } from 'lucide-react';
import { useObjectTranslation } from '@object-ui/i18n';
import { useWorkspaceAdminStatus } from '@object-ui/auth';
import { MetadataPanel, useMetadataInspector } from './MetadataInspector.js';
import { useMetadata } from '../providers/MetadataProvider.js';
import { useExpressionContext } from '../providers/ExpressionProvider.js';
import { preferLocal } from '../utils/preferLocal.js';
import { ConsoleActionRuntimeProvider } from '../hooks/useConsoleActionRuntime.js';
import { useCanAuthorMetadata } from '../hooks/useCanAuthorMetadata.js';
import { InterfaceListPage } from './InterfaceListPage.js';
import { pageRecordActionsValue } from './pageRecordActions.js';

/**
 * After a successful page-level action, declare the change on the
 * data-invalidation bus so every embedded block that reads it refetches IN
 * PLACE (AGENTS.md #8's corollary: refresh data, don't rebuild UI). A page
 * binds no object and the runtime's refresh carries none, so the scope is the
 * bus's documented unknown-scope value.
 *
 * This host used to bump a counter into the `key` of both render branches
 * below, which remounted the whole page on every page action: scroll, collapsed
 * sections and in-progress edits in every block went with it, and every block
 * refetched from scratch (objectui#10519). Both branches are now keyed on
 * identity; `no-refresh-key-remount.ratchet` holds this file in scope.
 * Module-level so its identity is stable across renders (the runtime names it
 * in dependency lists).
 */
function declarePageDataChanged(): void {
  notifyDataChanged({ objectName: '*' });
}

export function PageView() {
  const { t } = useObjectTranslation();
  const { pageName } = useParams<{ pageName: string }>();
  const [searchParams] = useSearchParams();
  const { showDebug } = useMetadataInspector();
  const navigate = useNavigate();
  const location = useLocation();
  // Editing a page mutates the shared metadata definition, so the entry point
  // is admin-only (mirrors the view/report/dashboard runtime editors) — AND
  // requires the metadata-authoring capability the SERVER reports
  // (`manage_metadata`, ADR-0066). The role alone is not that answer: an
  // organization owner is a workspace admin while `organization_admin`
  // deliberately withholds `manage_metadata`, so on the cloud control plane a
  // signed-up customer was offered the platform's own page editor
  // (objectui#10899). Same doctrine as HomePage's builder CTAs.
  const { isAdmin } = useWorkspaceAdminStatus();
  const canAuthorMetadata = useCanAuthorMetadata();

  const { pages, objects, getTypeStatus } = useMetadata();
  // ADR-0048 Phase 2 — prefer the page owned by the current app's package so
  // two packages shipping `page/<same-name>` each resolve within their own
  // container instead of by load order.
  const { app: activeApp } = useExpressionContext();
  const dataSource = useAdapter();
  const page = preferLocal(pages as any[], pageName, (activeApp as any)?._packageId);

  if (!page) {
    // `page` metadata is lazy-loaded: on the very first access `pages` is an
    // empty array while the fetch is in flight, which would flash a false
    // "page not found" (or a blank body) — exactly the post-signup landing
    // race where the app's home page is the first thing rendered. Show a
    // loading state until the `page` type is actually resolved, then trust the
    // not-found. (getTypeStatus absent = hand-rolled context = always ready.)
    const pageStatus = getTypeStatus?.('page');
    if (pageStatus === 'idle' || pageStatus === 'loading') {
      return (
        <div className="h-full flex items-center justify-center p-8" data-testid="page-loading">
          <Spinner className="h-5 w-5 text-muted-foreground" />
        </div>
      );
    }
    return (
      <div className="h-full flex items-center justify-center p-8">
        <Empty>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <EmptyTitle>{t('empty.pageNotFound')}</EmptyTitle>
          <EmptyDescription>
            {t('empty.pageNotFoundDescription', { name: pageName })}
          </EmptyDescription>
        </Empty>
      </div>
    );
  }

  const params = Object.fromEntries(searchParams.entries());

  // Resolve the app slug from the path (`/apps/:app/page/:name`) so the deep
  // link survives whatever Router basename the host mounts under.
  const appName = location.pathname.match(/\/apps\/([^/]+)/)?.[1];
  const canEditInStudio = isAdmin && canAuthorMetadata && !!appName && !!pageName;
  const openInStudio = () => {
    if (!canEditInStudio) return;
    navigate(`/apps/${appName}/metadata/page/${encodeURIComponent(pageName!)}`);
  };
  // The record navigator the page's blocks open a record through
  // (objectui#11293). Not memoised: the schema below is rebuilt on every
  // render too, and nothing may rest on this object's identity (AGENTS.md #10).
  const pageRecordActions = pageRecordActionsValue(appName, (objects ?? []) as unknown[], navigate);

  return (
    // Mount the shared console action runtime so page-level `action:button`s can
    // collect params, call authenticated APIs, show confirm/result dialogs, run
    // screen flows, navigate the SPA, and refresh embedded data — the same
    // runtime ObjectView uses (#1605). Pages run global / action-scoped actions,
    // so no `objectName` is bound.
    <ConsoleActionRuntimeProvider
      dataSource={dataSource}
      objects={objects}
      onRefresh={declarePageDataChanged}
    >
      <div className="flex flex-row h-full w-full overflow-hidden relative">
        <div className="flex-1 overflow-auto h-full relative">
          {canEditInStudio && (
            <button
              type="button"
              onClick={openInStudio}
              className="absolute right-3 top-3 z-30 inline-flex h-7 w-7 items-center justify-center rounded-md border border-input bg-background/90 text-muted-foreground shadow-sm backdrop-blur hover:bg-accent hover:text-accent-foreground"
              data-testid="page-edit-in-studio-button"
              title={t('common.editInStudio', { defaultValue: 'Edit in studio' })}
              aria-label={t('common.editInStudio', { defaultValue: 'Edit in studio' })}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {(page as any).interfaceConfig?.source ? (
            // ADR-0047 interface mode: the page binds a source view into a
            // curated list surface — rendered directly, not via regions.
            <InterfaceListPage page={page} reserveEditAffordance={canEditInStudio} />
          ) : (
            <RelatedRecordActionsProvider value={pageRecordActions}>
              <SchemaRenderer
                schema={{
                  ...page,
                  // `type` stays the SchemaNode discriminator ComponentRegistry
                  // dispatches on. The spec's page KIND (`record|home|app|utility|
                  // list`) rides `pageType`, which PageRenderer reads — without
                  // this mapping every page fell back to `pageType: 'record'`,
                  // so non-record pages got the record max-width, a wrong
                  // `data-page-type` and a suppressed header (framework#1878 §3
                  // naming-drift recheck).
                  //
                  // ⭐ This is the WRITING end of the page-kind to node-type
                  // channel, and a comment here was not enough: two cards audited
                  // the READING end and concluded the registrations it feeds were
                  // undeclared (objectui#9263, re-ruled letter E "⛔ not a
                  // defect", and objectui#9576). The channel is now declared at
                  // both reading ends — `@object-ui/types`' `SchemaRegistry` map
                  // at its `'page'` entry, and the `PageRenderer` registrations in
                  // `@object-ui/components`. Each END is pinned by a DIFFERENT
                  // file, because no one package can import both.
                  //
                  // ⛔ Change this mapping and `page-kind-writing-end-9718`, in
                  // this package's `views/__tests__`, goes red by design and names
                  // the kind that stopped being written (objectui#9718): it is the
                  // declaration, not an incidental assertion.
                  //
                  // ⚠️ The reading end's pin — `page-kind-node-type-channel-9642`
                  // (objectui#9642) — does NOT answer for this line. It lives in
                  // `@object-ui/components`, which does not depend on this
                  // package, so its module graph cannot reach this file: gutting
                  // this mapping leaves it green, and deleting a registration
                  // turns it red. Both directions were measured on objectui#9718.
                  type: (page as any).type || 'page',
                  pageType: (page as any).type,
                  // `context` is built here, never read off the page: `PageSchema`
                  // refuses a page-level `context` key, so no parsed page can
                  // carry one (objectui#9673). Written after `...page`, it also
                  // overrides whatever an unparsed document smuggled in.
                  context: { params },
                }}
              />
            </RelatedRecordActionsProvider>
          )}
        </div>
        <MetadataPanel
          open={showDebug}
          sections={[{ title: 'Page Configuration', data: page }]}
        />
      </div>
    </ConsoleActionRuntimeProvider>
  );
}
