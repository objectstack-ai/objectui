// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Whether an app serves the caller nothing to navigate to (objectui#12079).
 *
 * Kept apart from `AppNoAccessEmptyState.tsx` so that file exports only a
 * component; the app index route in `AppContent.tsx` asks this question first
 * and renders the empty state on a yes.
 */

import { hasVisibleNavigationItems } from '@object-ui/layout';
import type { NavigationItem } from '@object-ui/types';

/** The two trees an app's sidebar draws from: the top level and every area. */
interface AppNavigationLike {
  navigation?: NavigationItem[] | null;
  areas?: Array<{ navigation?: NavigationItem[] | null } | null> | null;
}

/**
 * Whether the app serves this caller nothing to navigate to: no item in its
 * top-level `navigation` and none in any `areas[].navigation`.
 *
 * The question is structural. It reuses the sidebar's own predicate,
 * `hasVisibleNavigationItems`, with no guards, so a `separator` and a `group`
 * with no children count as nothing, exactly as the sidebar draws them. The
 * sidebar wires an action dispatcher, so an `action` item counts as content.
 *
 * ⛔ This is NOT "no landing route". The landing resolver walks the top-level
 * `navigation` only and lands on an `object`, `page`, `dashboard`, `report` or
 * `component` entry, so an app can serve entries and still have no landing:
 * one whose entries are all `url`, `action` or `doc` links, or one that serves
 * them only under `areas`. Such an app is not one the caller has no access in,
 * and this answers no for it. The Studio app is not that case: its navigation
 * is all `component` entries, and its root lands on the first one
 * (objectui#12113).
 */
export function appServesNoNavigation(app: AppNavigationLike | null | undefined): boolean {
  const options = { hasActionHandler: true };
  if (hasVisibleNavigationItems(app?.navigation ?? [], options)) return false;
  return !(app?.areas ?? []).some((area) => hasVisibleNavigationItems(area?.navigation ?? [], options));
}
