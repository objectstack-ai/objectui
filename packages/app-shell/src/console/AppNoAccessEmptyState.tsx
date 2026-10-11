// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * The app root's answer when the app serves this caller NO navigation
 * (objectui#12079).
 *
 * The server filters an app's navigation per caller before it reaches the
 * console (`requiredPermissions`, `requiresService` and the doc audience, with
 * emptied groups dropped). An app whose every group is capability-gated
 * therefore arrives as `navigation: []` for a caller who holds none of those
 * capabilities. The sidebar is empty, and the app index route has no landing
 * to resolve. Until objectui#12079 that route fell back to `StudioHomePage`,
 * the Studio app's own overview, so the caller saw metadata counters and
 * "New Object" quick actions inside an app that had nothing to do with Studio,
 * and nothing told them what to do next.
 *
 * This is an app-level empty state instead. It names the app and says the
 * caller has no access in it yet. A caller who can grant access gets a link to
 * Setup; everyone else is told to ask an administrator.
 */

import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
// The three primitives `RouteNotFound` and the app-verdict screens in
// `AppContent.tsx` already compose, so this screen looks like its siblings and
// adds nothing to the eager `ui-components` chunk.
import { Button, Empty, EmptyDescription, EmptyTitle } from '@object-ui/components';
import { useObjectLabel, useObjectTranslation } from '@object-ui/i18n';
import { resolveKeyedI18nLabel } from '../utils/index.js';

export interface AppNoAccessEmptyStateProps {
  /** The active app, as the console's metadata list carries it. */
  app: { name: string; label?: string | { key: string; defaultValue?: string } };
  /**
   * Where Setup lives, for a caller who can grant access. `null` for everyone
   * else, which hides the link and asks them to contact an administrator.
   */
  setupPath: string | null;
}

export function AppNoAccessEmptyState({ app, setupPath }: AppNoAccessEmptyStateProps) {
  const { t } = useObjectTranslation();
  const { appLabel } = useObjectLabel();
  // The same label the header's app switcher shows for this app.
  const label = appLabel({ name: app.name, label: resolveKeyedI18nLabel(app.label, t) });

  return (
    <div className="flex h-full w-full items-center justify-center p-8" data-testid="app-no-access-empty-state">
      <Empty>
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground" aria-hidden="true">
          <Lock className="size-5" />
        </div>
        <EmptyTitle>
          {t('empty.appNothingAvailable', {
            app: label,
            defaultValue: 'Nothing in {{app}} is available to you yet',
          })}
        </EmptyTitle>
        <EmptyDescription>
          {setupPath
            ? t('empty.appNothingAvailableGrantDescription', {
                defaultValue: 'This app has no pages your account can open. You can grant access in Setup.',
              })
            : t('empty.appNothingAvailableDescription', {
                defaultValue: 'This app has no pages your account can open. Ask an administrator to grant you access.',
              })}
        </EmptyDescription>
        {setupPath && (
          <Button asChild variant="outline">
            <Link to={setupPath} data-testid="app-no-access-open-setup">
              {t('empty.openSetup', { defaultValue: 'Open Setup' })}
            </Link>
          </Button>
        )}
      </Empty>
    </div>
  );
}
