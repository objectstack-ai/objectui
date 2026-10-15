/**
 * AppSwitcher
 *
 * The app pill that starts the top bar inside an app: [app glyph] [App Name]
 * [ChevronDown]. The glyph is the app's one identity asset, `branding.logo`,
 * or its `icon` on a tile (`AppMark`, objectui#12201). The dropdown lists every
 * app with its glyph, then two exits: 「All apps」 back to Home, and — for the
 * viewers the top bar offers its Studio button to — 「Edit APP in Studio」.
 * @module
 */

import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@object-ui/components';
import { ChevronDown, Check, LayoutGrid, Pencil } from 'lucide-react';
import { useMetadata } from '../providers/MetadataProvider.js';
import { resolveKeyedI18nLabel, matchAppBySegment, appRouteSegment } from '../utils/index.js';
import { useObjectTranslation, useObjectLabel } from '@object-ui/i18n';
import { useHomePath } from '../hooks/useHomePath.js';
import { AppMark } from './AppMark.js';

export interface AppSwitcherProps {
  activeAppName: string;
  onAppChange: (name: string) => void;
  /**
   * The app → Studio bridge target the top bar computed for its own Studio
   * button (`AppHeader`'s `studioDesignPath`, ADR-0080). When set, the dropdown
   * ends with an 「Edit APP in Studio」 row to the same place; `null` or absent
   * (a viewer the bridge is not offered to, or an app no package owns) draws
   * no row. Passed in rather than re-derived so the row and the button cannot
   * disagree about who may cross or where it lands.
   */
  designInStudioPath?: string | null;
}

export function AppSwitcher({ activeAppName, onAppChange, designInStudioPath }: AppSwitcherProps) {
  const { apps: metadataApps } = useMetadata();
  const { t } = useObjectTranslation();
  const { appLabel } = useObjectLabel();
  // objectui#7256 — 「All apps」 goes to the DECLARED home, like every other
  // Home affordance in the chrome.
  const homePath = useHomePath();

  const apps = metadataApps || [];
  // Hidden apps (App.hidden === true) live in the avatar dropdown
  // (personal-settings-style surfaces like the Account app), not the
  // top-level App Switcher.
  //
  // ⛔ Do NOT add `_unpublished` here (objectstack#6955 / objectstack-ai/objectstack#4829 A1). That key is
  // the ADR-0045 publish gate and is enforced server-side — the REST metadata
  // gate withholds unpublished apps from non-builders, so anything that reaches
  // this list is already permitted. Filtering it here would hide a builder's own
  // in-progress app from the builder. Pinned by
  // `__tests__/AppSwitcher.publishState.test.tsx`.
  const activeApps = apps.filter((a: any) => a.active !== false && a.hidden !== true);
  // ADR-0048 (A) — route segment may be a package id; match by it (name fallback).
  const activeApp = matchAppBySegment(activeApps, activeAppName) || matchAppBySegment(apps.filter((a: any) => a.active !== false), activeAppName) || activeApps[0];

  if (!activeApp) return null;

  const appLabelText = appLabel({ name: activeApp.name, label: resolveKeyedI18nLabel(activeApp.label, t) });

  // `min-w-0` lets the pill shrink inside the bar's left zone, so a long app
  // name truncates instead of spilling over the search (objectui#12472).
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid="app-switcher-trigger"
          className="flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-medium text-foreground/80 hover:bg-accent hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring max-w-[40vw] sm:max-w-none"
        >
          <AppMark app={activeApp} size="sm" />
          <span className="truncate whitespace-nowrap">{appLabelText}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          {t('layout.appSwitcher.switchApplication', { defaultValue: 'Switch Application' })}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {activeApps.map((app: any) => {
          const label = appLabel({ name: app.name, label: resolveKeyedI18nLabel(app.label, t) });
          const isActive = activeApp.name === app.name;
          return (
            <DropdownMenuItem
              key={app.name}
              onClick={() => onAppChange(appRouteSegment(app) ?? app.name)}
              className="flex items-center gap-2.5 py-2"
              data-testid={`app-switcher-row-${app.name}`}
            >
              <AppMark app={app} size="sm" />
              <span className="flex-1 truncate">{label}</span>
              {isActive && <Check className="size-3.5 text-primary shrink-0" />}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="flex items-center gap-2.5 py-2">
          <Link to={homePath} data-testid="app-switcher-all-apps">
            <span className="flex size-[22px] shrink-0 items-center justify-center text-muted-foreground" aria-hidden>
              <LayoutGrid className="size-4" />
            </span>
            <span className="flex-1 truncate">
              {t('layout.appSwitcher.allApps', { defaultValue: 'All apps' })}
            </span>
          </Link>
        </DropdownMenuItem>
        {designInStudioPath ? (
          <DropdownMenuItem asChild className="flex items-center gap-2.5 py-2">
            <Link to={designInStudioPath} data-testid="app-switcher-edit-in-studio">
              <span className="flex size-[22px] shrink-0 items-center justify-center text-muted-foreground" aria-hidden>
                <Pencil className="size-4" />
              </span>
              <span className="flex-1 truncate">
                {t('layout.appSwitcher.editAppInStudio', {
                  defaultValue: 'Edit {{app}} in Studio',
                  app: appLabelText,
                })}
              </span>
            </Link>
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
