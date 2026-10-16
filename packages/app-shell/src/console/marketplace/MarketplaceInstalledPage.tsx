/**
 * Marketplace Installed Apps Page (legacy React route,
 * `system/marketplace/installed`).
 *
 * Setup → Packages is the one installed list now (objectui#12675): this route
 * opens it filtered to Source = marketplace, through the same
 * `marketplace:installed-list` body the plugin-carried page renders, so the
 * marketplace page's "Installed (N)" button and the plugin's entry land on the
 * same view. The route and this export retire in the follow-up after
 * objectstack#23933 retargets the plugin's entry.
 */

import { InstalledList } from './InstalledListWidget.js';

export function MarketplaceInstalledPage() {
  return <InstalledList />;
}
