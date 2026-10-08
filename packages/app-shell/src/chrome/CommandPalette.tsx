/**
 * CommandPalette
 *
 * A ⌘+K (Ctrl+K) command palette for quick navigation across apps, objects,
 * dashboards, pages, reports, and global actions.
 *
 * Uses Shadcn's Command (cmdk) component — keyboard-accessible. The palette
 * matches its navigation entries and built-in commands itself, on word
 * prefixes and contiguous substrings (`matchesPaletteQuery`, objectui#11812),
 * and renders only those that match; record hits come from the server search.
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@object-ui/components';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Moon,
  Sun,
  Monitor,
  Search,
} from 'lucide-react';
import { useRecordSearch } from '@object-ui/react';
import { usePermissions } from '@object-ui/permissions';
import { useTheme } from './ThemeProvider.js';
import { useExpressionContext, evaluateVisibility } from '../providers/ExpressionProvider.js';
import { useObjectTranslation } from '@object-ui/i18n';
import { resolveKeyedI18nLabel, getRecordDisplayName, appRouteSegment } from '../utils/index.js';
import { getIcon } from '../utils/getIcon.js';
import { useRecentItems } from '../context/RecentItemsProvider.js';
import { useRecentItemLabel } from '../hooks/useRecentItemLabel.js';
import { useCommandPalette } from '../context/CommandPaletteProvider.js';
import { resolveHref, resolveNavItemLabel } from '@object-ui/layout';
import type { NavigationItem } from '@object-ui/types';
import { useNavTargetLabel } from '../hooks/useNavTargetLabel.js';
import { useAuth } from '@object-ui/auth';
import { matchesPaletteQuery } from './paletteMatch.js';

interface CommandPaletteProps {
  apps: any[];
  activeApp: any;
  objects: any[];
  onAppChange: (name: string) => void;
  /**
   * Optional data source used to power record search across objects. When
   * omitted, the palette behaves exactly as before — nav items only.
   */
  dataSource?: any;
}

export function CommandPalette({ apps, activeApp, objects, onAppChange, dataSource }: CommandPaletteProps) {
  const { open, setOpen } = useCommandPalette();
  const [inputValue, setInputValue] = useState('');
  const navigate = useNavigate();
  const { appName } = useParams();
  const { setTheme } = useTheme();
  const { evaluator } = useExpressionContext();
  const { t, language } = useObjectTranslation();
  // A nav entry's text, the way the sidebar and `nav:menu` name it: an entry
  // with NO `label` shows its target's current label, else its target's machine
  // name (objectui#9868 — `NavigationSyncEffect` writes such entries). A present
  // label renders as authored — an inline locale map in the viewer's `language`,
  // the locale the sidebar passes (objectui#11299).
  const targetLabel = useNavTargetLabel();
  const navLabel = (item: NavigationItem) =>
    resolveNavItemLabel(item, t, targetLabel, language);

  // The ⌘K / Ctrl+K accelerator and the open-state source of truth now live in
  // CommandPaletteProvider so the keyboard shortcut, the header button, and the
  // ?palette=1 deep-link all drive the SAME idempotent open path (ADR-0054 C1/C3).

  // Reset query when the palette closes so reopening doesn't show stale state.
  useEffect(() => {
    if (!open) setInputValue('');
  }, [open]);

  const baseUrl = `/apps/${appName || appRouteSegment(activeApp)}`;
  const { user, activeOrganization } = useAuth();
  const templateContext = useMemo(
    () => ({ currentUserId: user?.id ?? null, currentOrgId: activeOrganization?.id ?? null }),
    [user?.id, activeOrganization?.id],
  );

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  // Extract navigation items from active app, filtering by visibility expressions
  const navItems = flattenNavigation(activeApp?.navigation || []).filter(
    (item) => evaluateVisibility(item.visible ?? item.visibleOn, evaluator)
  );

  // The entries the palette shows for the query: a navigation entry or app by
  // its label and its machine name, a built-in command by its value. They are
  // matched here, on word prefixes and contiguous substrings, and only the
  // matches are rendered, so cmdk's default subsequence scorer (it found
  // "Field Zoo" for `zzzz`) no longer decides what shows (objectui#11812).
  const matches = (...terms: Array<string | undefined>) => matchesPaletteQuery(inputValue, terms);
  const navOfType = (type: string, nameKey: string) =>
    navItems.filter((item) => item.type === type && matches(navLabel(item), item[nameKey]));
  const objectItems = navOfType('object', 'objectName');
  const dashboardItems = navOfType('dashboard', 'dashboardName');
  const pageItems = navOfType('page', 'pageName');
  const reportItems = navOfType('report', 'reportName');
  const switchableApps = apps.filter((a) => a.active !== false);
  const appItems =
    switchableApps.length > 1
      ? switchableApps.filter((app) => matches(resolveKeyedI18nLabel(app.label, t), app.name))
      : [];
  const themeCommands = THEME_COMMANDS.filter((command) => matches(command.value));
  const themeLabel = {
    light: t('console.commandPalette.lightTheme'),
    dark: t('console.commandPalette.darkTheme'),
    system: t('console.commandPalette.systemTheme'),
  };
  const showFullSearch = matches(FULL_SEARCH_VALUE);

  // Whitelist of object names visible in this app's nav — used as the search
  // scope so we don't fan out to every object in the tenant.
  const searchableObjectNames = useMemo(
    () =>
      navItems
        .filter((i) => i.type === 'object' && typeof i.objectName === 'string')
        .map((i) => i.objectName as string),
    // navItems is rebuilt every render (filtered list); use a stable signature.
    [activeApp?.name, navItems.map((i) => i.objectName || '').join('|')],
  );

  // A hit is labelled from the row as the viewer may read it: the hook removes
  // the fields this policy denies before the resolver reads it (objectui#10500).
  const perms = usePermissions();
  const { results: recordHits, isSearching } = useRecordSearch({
    query: inputValue,
    objects,
    dataSource,
    objectNames: searchableObjectNames,
    enabled: open && Boolean(dataSource),
    getDisplayName: getRecordDisplayName,
    fieldReadPolicy: perms,
  });

  // Cloud-synced (sys_user_preference) recently-visited records,
  // surfaced in the empty state so the palette is useful before the
  // user types anything. Filtered down to record-type entries so we
  // don't double up with the per-app nav above.
  const { recentItems } = useRecentItems();
  // The one way a recent entry is labelled (objectui#11678); for a record it
  // is the title the entry was visited under.
  const recentLabel = useRecentItemLabel();
  const recentRecords = useMemo(
    () => recentItems.filter((it) => it.type === 'record').slice(0, 5),
    [recentItems],
  );
  const showRecentRecords = open && inputValue.trim().length === 0 && recentRecords.length > 0;

  // Index object defs by name so group headings can resolve the object's
  // localized label (labels may be `{ key, defaultValue }` i18n objects, which
  // the hook's plain-string `objectLabel` can't carry).
  const objectsByName = useMemo(() => {
    const map = new Map<string, any>();
    for (const obj of objects || []) {
      if (typeof obj?.name === 'string') map.set(obj.name, obj);
    }
    return map;
  }, [objects]);

  // Group the (server-ranked) record hits by object so the palette lists them
  // under per-object headings — issue objectstack-ai/objectstack#3371 asks for record hits "grouped by
  // object". The object with the top-ranked hit leads (first-seen order), and
  // within each group the server's relevance order is preserved.
  const recordGroups = useMemo(() => {
    const order: string[] = [];
    const byObject = new Map<
      string,
      { objectLabel: string; icon?: string; hits: typeof recordHits }
    >();
    for (const hit of recordHits) {
      let group = byObject.get(hit.objectName);
      if (!group) {
        // Prefer the i18n-resolved object label; fall back to the hit's plain
        // label (already objectName when the def had no string label).
        const objDef = objectsByName.get(hit.objectName);
        const label = resolveKeyedI18nLabel(objDef?.label, t) || hit.objectLabel;
        group = { objectLabel: label, icon: hit.icon, hits: [] };
        byObject.set(hit.objectName, group);
        order.push(hit.objectName);
      }
      group.hits.push(hit);
    }
    return order.map((name) => {
      const group = byObject.get(name)!;
      return { objectName: name, ...group };
    });
  }, [recordHits, objectsByName, t]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      // Accessible name/description (rendered visually-hidden as the required
      // Radix DialogTitle/Description) — gives the dialog a stable ARIA name (C4).
      title={t('console.commandPalette.title', { defaultValue: 'Command palette' })}
      description={t('console.commandPalette.placeholder')}
      contentProps={{
        // Stable locator so the overlay is addressable by an automated driver
        // without relying on i18n-fragile visible text (C4).
        'data-testid': 'overlay:command-palette',
      }}
    >
      <CommandInput
        placeholder={t('console.commandPalette.placeholder')}
        value={inputValue}
        onValueChange={setInputValue}
      />
      <CommandList>
        <CommandEmpty>
          {isSearching ? (
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full bg-primary motion-safe:animate-pulse"
              />
              {t('console.commandPalette.searching', { defaultValue: 'Searching…' })}
            </span>
          ) : (
            t('console.commandPalette.noResults')
          )}
        </CommandEmpty>

        {/* Recently visited records (cloud-synced via sys_user_preference).
            Only renders when the input is empty so search results don't
            compete with this fallback list. */}
        {showRecentRecords && (
          <CommandGroup
            heading={t('console.commandPalette.recentRecords', { defaultValue: 'Recently viewed' })}
          >
            {recentRecords.map((item) => (
              <CommandItem
                key={`recent:${item.id}`}
                value={`recent ${recentLabel(item)} ${item.id}`}
                onSelect={() => runCommand(() => navigate(item.href))}
              >
                <Search className="mr-2 h-4 w-4" />
                <span className="truncate">{recentLabel(item)}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Record search hits from the platform's global search
            (/api/v1/search), grouped by object (issue objectstack-ai/objectstack#3371). The searching
            pulse rides the first group's heading so it stays visible while a
            refined query is in flight over an existing result set. */}
        {recordGroups.map((group, groupIndex) => {
          const Icon = getIcon(group.icon);
          return (
            <CommandGroup
              key={`records:${group.objectName}`}
              heading={
                <span className="inline-flex items-center gap-2">
                  {group.objectLabel}
                  {isSearching && groupIndex === 0 && (
                    <span
                      aria-hidden
                      className="inline-block h-1.5 w-1.5 rounded-full bg-primary motion-safe:animate-pulse"
                    />
                  )}
                </span>
              }
            >
              {group.hits.map((hit) => (
                <CommandItem
                  key={`${hit.objectName}:${hit.recordId}`}
                  // Embed the live query so cmdk's client-side filter doesn't
                  // hide async hits that don't textually match the input.
                  value={`record ${inputValue} ${hit.display} ${hit.objectLabel} ${hit.objectName} ${hit.recordId}`}
                  onSelect={() => runCommand(() => navigate(`${baseUrl}/${hit.objectName}/record/${hit.recordId}`))}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span className="truncate">{hit.display}</span>
                  {hit.subtitle && (
                    <span className="ml-auto max-w-[45%] truncate text-xs text-muted-foreground">
                      {hit.subtitle}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
        {/* Object Navigation */}
        {objectItems.length > 0 && (
          <CommandGroup heading={t('console.commandPalette.objects')}>
            {objectItems
              .map(item => {
                const Icon = getIcon(item.icon);
                return (
                  <CommandItem
                    key={item.id}
                    value={`object ${navLabel(item)} ${item.objectName}`}
                    onSelect={() => runCommand(() => navigate(resolveHref(item, baseUrl, templateContext).href))}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{navLabel(item)}</span>
                  </CommandItem>
                );
              })}
          </CommandGroup>
        )}

        {/* Dashboards */}
        {dashboardItems.length > 0 && (
          <CommandGroup heading={t('console.commandPalette.dashboards')}>
            {dashboardItems
              .map(item => (
                <CommandItem
                  key={item.id}
                  value={`dashboard ${navLabel(item)} ${item.dashboardName}`}
                  onSelect={() => runCommand(() => navigate(resolveHref(item, baseUrl, templateContext).href))}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>{navLabel(item)}</span>
                </CommandItem>
              ))}
          </CommandGroup>
        )}

        {/* Pages */}
        {pageItems.length > 0 && (
          <CommandGroup heading={t('console.commandPalette.pages')}>
            {pageItems
              .map(item => (
                <CommandItem
                  key={item.id}
                  value={`page ${navLabel(item)} ${item.pageName}`}
                  onSelect={() => runCommand(() => navigate(resolveHref(item, baseUrl, templateContext).href))}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span>{navLabel(item)}</span>
                </CommandItem>
              ))}
          </CommandGroup>
        )}

        {/* Reports */}
        {reportItems.length > 0 && (
          <CommandGroup heading={t('console.commandPalette.reports')}>
            {reportItems
              .map(item => (
                <CommandItem
                  key={item.id}
                  value={`report ${navLabel(item)} ${item.reportName}`}
                  onSelect={() => runCommand(() => navigate(resolveHref(item, baseUrl, templateContext).href))}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>{navLabel(item)}</span>
                </CommandItem>
              ))}
          </CommandGroup>
        )}

        {/* App Switching */}
        {appItems.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t('console.commandPalette.switchApp')}>
              {appItems
                .map(app => {
                  const Icon = getIcon(app.icon);
                  return (
                    <CommandItem
                      key={app.name}
                      value={`app ${resolveKeyedI18nLabel(app.label, t)} ${app.name}`}
                      onSelect={() => runCommand(() => onAppChange(appRouteSegment(app) ?? app.name))}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{resolveKeyedI18nLabel(app.label, t)}</span>
                      {app.name === activeApp?.name && (
                        <span className="ml-auto text-xs text-muted-foreground">{t('console.commandPalette.current')}</span>
                      )}
                    </CommandItem>
                  );
                })}
            </CommandGroup>
          </>
        )}

        {/* Theme */}
        {themeCommands.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t('console.commandPalette.preferences')}>
              {themeCommands.map(({ value, theme, Icon }) => (
                <CommandItem key={value} value={value} onSelect={() => runCommand(() => setTheme(theme))}>
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{themeLabel[theme]}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Full Search Page */}
        {showFullSearch && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t('console.commandPalette.actions')}>
              {/* Manual "Create App" deprecated — AI-first builder is the path. */}
              <CommandItem
                value={FULL_SEARCH_VALUE}
                onSelect={() => runCommand(() => navigate(`${baseUrl}/search`))}
              >
                <Search className="mr-2 h-4 w-4" />
                <span>{t('console.commandPalette.openFullSearch')}</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

/** The theme commands, matched by their value (objectui#11812). */
const THEME_COMMANDS = [
  { value: 'theme light', theme: 'light', Icon: Sun },
  { value: 'theme dark', theme: 'dark', Icon: Moon },
  { value: 'theme system', theme: 'system', Icon: Monitor },
] as const;

/** The full-search command's value, which it is matched by (objectui#11812). */
const FULL_SEARCH_VALUE = 'search all results full page';

/** Flatten nested navigation groups into a flat list of leaf items */
function flattenNavigation(items: any[]): any[] {
  const result: any[] = [];
  for (const item of items) {
    if (item.type === 'group' && item.children) {
      result.push(...flattenNavigation(item.children));
    } else {
      result.push(item);
    }
  }
  return result;
}
