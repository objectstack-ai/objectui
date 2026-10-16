// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * `marketplace:installed-list` — the SDUI widget the install-local plugin's
 * Installed Apps page renders (cloud ADR-0009 P2a; objectstack's
 * `MarketplaceInstalledPage` in `@objectstack/cloud-connection`).
 *
 * Setup → Packages is now the one list of what is installed (objectui#12675,
 * ruling B on objectstack#23892): every package carries its Source, and the
 * rows whose Source is `marketplace` carry the actions this list used to
 * (Details, Uninstall — `MarketplaceRowActions`). So this widget no longer
 * draws a second list: it opens Packages filtered to Source = marketplace,
 * `/apps/APP/component/developer/packages?source=marketplace`.
 *
 * It stays registered only so the published `marketplace_installed` page keeps
 * landing somewhere until objectstack#23933 retargets the plugin's Installed
 * Apps entry at that URL; the registration, this file, the legacy
 * `system/marketplace/installed` routes and the `MarketplaceInstalledPage`
 * export retire in the follow-up after that lands.
 */

import { Navigate, useParams } from 'react-router-dom';
import { ComponentRegistry } from '@object-ui/core';
import { packagesHref } from '../../views/metadata-admin/packageSource.js';

export function InstalledList() {
  const { appName } = useParams<{ appName?: string }>();
  // Packages is a Setup page; outside an app route there is no app segment to
  // keep, so the Setup app's own (`/apps/setup`, the spelling the console's
  // no-app empty state uses) is where it lives.
  const basePath = appName ? `/apps/${appName}` : '/apps/setup';
  return <Navigate to={packagesHref(basePath, 'marketplace')} replace />;
}

// SDUI registration — the metadata page shipped by the install-local plugin
// references this widget by type.
ComponentRegistry.register('marketplace:installed-list', () => <InstalledList />, {
  namespace: 'app-shell',
  label: 'Installed Marketplace Packages',
  category: 'plugin',
  inputs: [],
});
