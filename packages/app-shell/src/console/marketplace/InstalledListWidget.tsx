// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Installed-packages list — registered as the SDUI widget
 * `marketplace:installed-list` (cloud ADR-0009 P2a).
 *
 * The Installed Apps page ships as METADATA with
 * `@objectstack/cloud-connection`'s install-local plugin; this widget is
 * the interactive body: load (control-plane list when cloud-connected,
 * local install-local cache otherwise), refresh, uninstall. The legacy
 * React route (`MarketplaceInstalledPage`) renders the SAME component
 * during the ADR-0009 migration window — single implementation, two
 * entries.
 */

import { useEffect, useId, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@object-ui/components';
import { RefreshCcw, Trash2, AlertCircle, ExternalLink } from 'lucide-react';
import { useWorkspaceAdminStatus } from '@object-ui/auth';
import { useDisplayLocale, useObjectTranslation } from '@object-ui/i18n';
import { ComponentRegistry } from '@object-ui/core';
import {
  listLocalInstalls,
  listInstalledPackages,
  uninstallLocal,
  type LocalInstallEntry,
  type LocalInstallNotLoaded,
} from './marketplaceApi.js';
import { MarketplaceAccessDenied } from './MarketplaceAccessDenied.js';

export function InstalledList() {
  const navigate = useNavigate();
  const { appName } = useParams<{ appName?: string }>();
  const { isAdmin } = useWorkspaceAdminStatus();
  const { t } = useObjectTranslation();
  // The install date reads the DISPLAY locale, never the UI language: a
  // regional locale (`de-CH` under an English UI) must reach it, and an empty
  // language must not fall through to the machine's locale (objectui#10331).
  const displayLocale = useDisplayLocale();
  const basePath = appName ? `/apps/${appName}` : '';
  // One description node serves every loaded row's Uninstall: the kernel note
  // is the same sentence for each of them (objectui#12610).
  const kernelNoteId = useId();

  const [items, setItems] = useState<LocalInstallEntry[]>([]);
  // 'cloud' = list comes from the control plane (CLI/marketplace/REST installs,
  // ADR-0007 step ①); 'local' = self-hosted install-local cache.
  const [source, setSource] = useState<'cloud' | 'local'>('local');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      // Cloud-connected env → authoritative installed list is the control
      // plane's. Self-hosted (not bound) → fall back to the local cache.
      const cloud = await listInstalledPackages();
      if (cloud.connected) {
        setSource('cloud');
        setItems(cloud.items);
      } else {
        setSource('local');
        setItems(await listLocalInstalls());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  // objectui#11645 — the reason a `notLoaded` entry was refused, in plain words.
  // A code the console has no sentence for still reads as not loaded, naming
  // the code, rather than hiding the row the operator needs to uninstall.
  const notLoadedReason = (marker: LocalInstallNotLoaded): string =>
    marker.code === 'OS_PROTOCOL_INCOMPATIBLE'
      ? t('marketplace.notLoaded.protocolIncompatible', { requiredRange: marker.requiredRange })
      : t('marketplace.notLoaded.otherReason', { code: marker.code });

  const doUninstall = async (entry: LocalInstallEntry) => {
    // A package the runtime did not load leaves nothing in the running kernel,
    // so its confirm and its result drop the "stays loaded until restart"
    // caveat that a loaded package's texts carry, which would contradict the
    // row's own "Not loaded" (objectui#11645).
    const question = entry.notLoaded
      ? t('marketplace.uninstall.confirmNotLoaded', { manifestId: entry.manifestId, version: entry.version })
      : t('marketplace.uninstall.confirm', { manifestId: entry.manifestId, version: entry.version });
    if (!confirm(question)) {
      return;
    }
    setWorking(entry.manifestId);
    setResult(null);
    try {
      await uninstallLocal(entry.manifestId);
      setResult({
        ok: true,
        message: entry.notLoaded
          ? t('marketplace.uninstall.successNotLoaded', { manifestId: entry.manifestId })
          : t('marketplace.uninstall.successInList', { manifestId: entry.manifestId }),
      });
      await load();
    } catch (e: any) {
      setResult({ ok: false, message: e?.message ?? String(e) });
    } finally {
      setWorking(null);
    }
  };

  // The kernel note is about a LOADED package: the running kernel keeps it
  // registered until restart. It rides the Uninstall it qualifies, as a
  // tooltip, instead of a paragraph under the list (objectui#12610). A
  // not-loaded entry left nothing in the kernel (objectui#11645), so its
  // Uninstall carries no note.
  const uninstallAction = (entry: LocalInstallEntry) => {
    const button = (
      <Button
        variant="outline"
        size="sm"
        onClick={() => void doUninstall(entry)}
        disabled={working === entry.manifestId}
        aria-describedby={entry.notLoaded ? undefined : kernelNoteId}
      >
        <Trash2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
        {working === entry.manifestId ? t('marketplace.action.uninstalling') : t('marketplace.action.uninstall')}
      </Button>
    );
    if (entry.notLoaded) return button;
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>{t('marketplace.installedAdditiveNote')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (!isAdmin) return <MarketplaceAccessDenied />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCcw className="h-4 w-4 mr-1.5" aria-hidden="true" />
          {t('marketplace.refresh')}
        </Button>
      </div>

      {result && (
        <div className={`rounded-md border p-3 text-sm ${result.ok ? 'border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400' : 'border-destructive/30 bg-destructive/5 text-destructive'}`}>
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
            <div>{result.message}</div>
          </div>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground border rounded-md">
          <p>{t('marketplace.installedEmpty')}</p>
          <Button
            variant="link"
            className="mt-2"
            onClick={() => navigate(`${basePath}/system/marketplace`)}
          >
            {t('marketplace.browseLink')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((entry) => (
            <Card key={entry.manifestId}>
              <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                <div className="min-w-0">
                  <CardTitle className="text-base truncate flex items-center gap-2">
                    {entry.manifestId}
                    <Badge variant="outline">{t('marketplace.versionBadge', { version: entry.version })}</Badge>
                    {entry.notLoaded && (
                      <Badge variant="destructive">{t('marketplace.notLoaded.badge')}</Badge>
                    )}
                  </CardTitle>
                  <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    <span>{t('marketplace.installedAt', { when: new Date(entry.installedAt).toLocaleString(displayLocale) })}</span>
                    {entry.installedBy && <span>{t('marketplace.installedBy', { user: entry.installedBy })}</span>}
                    <span>{t('marketplace.installedPackageId')} <code className="font-mono">{entry.packageId}</code></span>
                  </div>
                  {entry.notLoaded && (
                    <p className="text-xs text-destructive mt-1.5 flex items-start gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 mt-px shrink-0" aria-hidden="true" />
                      <span>{notLoadedReason(entry.notLoaded)}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`${basePath}/system/marketplace/${entry.packageId}`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    {t('marketplace.action.details')}
                  </Button>
                  {source === 'local' && uninstallAction(entry)}
                </div>
              </CardHeader>
              {source === 'local' && (
                <CardContent
                  className="pt-0 text-xs text-muted-foreground"
                  dangerouslySetInnerHTML={{
                    __html: t('marketplace.cachedAs', {
                      path: `.objectstack/installed-packages/${entry.manifestId.replace(/[^a-zA-Z0-9._-]/g, '_')}.json`,
                    }),
                  }}
                />
              )}
            </Card>
          ))}
        </div>
      )}

      {/* The Uninstall tooltip only shows on hover or focus; this is what a
          screen reader announces as the button's description. */}
      {source === 'local' && items.some((entry) => !entry.notLoaded) && (
        <span id={kernelNoteId} className="sr-only">{t('marketplace.installedAdditiveNote')}</span>
      )}
    </div>
  );
}

// SDUI registration — the metadata page shipped by the install-local plugin
// references this widget by type.
ComponentRegistry.register('marketplace:installed-list', () => <InstalledList />, {
  namespace: 'app-shell',
  label: 'Installed Marketplace Packages',
  category: 'plugin',
  inputs: [],
});
