/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import type { DashboardComponentSchema } from '@object-ui/types';

/**
 * The dashboard auto-refresh timer: ONE implementation, two mount points
 * (objectui#8820).
 *
 * `DashboardGridLayout` and `DashboardRenderer` each used to carry their own
 * copy of the same three things: a `refreshing` flag, a `handleRefresh`
 * callback shared by the manual "Refresh All" button and the timer, and an
 * effect that read the authored period and drove `setInterval`. The copies were
 * identical in logic, and two copies of one rule is two places to change and
 * one place to forget: the `refreshInterval` to `refreshIntervalSeconds` rename
 * (objectui#7783) had to be made twice, and a copy that drifted would still
 * pass its own component's tests.
 *
 * This hook is that logic moved here unchanged. Both surfaces call it, so the
 * authored period is read in exactly one place.
 *
 * - The period is `refreshIntervalSeconds`, in seconds, and nothing else. The
 *   retired `refreshInterval` spelling is refused by the spec's
 *   `DashboardSchema`, so no fallback reads it (AGENTS.md #0.1).
 * - The timer runs only when the host wired `onRefresh` AND the period is
 *   greater than zero: an absent period, `0` and a negative value all mean
 *   "off".
 * - The indicator clears itself 600ms after each run, manual or timed.
 *
 * `__tests__/dashboardAutoRefreshTimer.test.tsx` mounts both surfaces and
 * counts `onRefresh` calls under fake timers. It pins the first two points;
 * nothing pins the 600ms indicator.
 */

/** What a dashboard surface needs to drive its refresh affordance. */
export interface DashboardAutoRefresh {
  /** True while a refresh is in flight; drives the spinner and disables the button. */
  refreshing: boolean;
  /** Run a refresh now. Wired to both the manual button and the timer. */
  handleRefresh: () => void;
}

/**
 * Owns the refresh indicator, the manual refresh handler, and the auto-refresh
 * interval for one dashboard surface.
 */
export function useDashboardAutoRefresh(
  schema: DashboardComponentSchema,
  onRefresh?: () => void,
): DashboardAutoRefresh {
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = React.useCallback(() => {
    if (!onRefresh) return;
    setRefreshing(true);
    onRefresh();
    // Reset refreshing indicator after a short delay
    setTimeout(() => setRefreshing(false), 600);
  }, [onRefresh]);

  // The one read of the authored period, for both surfaces. Seconds; the
  // `* 1000` below converts to milliseconds.
  const seconds = schema.refreshIntervalSeconds;

  // ⚠️ `handleRefresh` is a `useCallback` identity in this dependency list,
  // which AGENTS.md #10 bans. It is carried over exactly as both copies had
  // it, because objectui#8820 changes no behaviour; one site now instead of
  // two is where a fix for it would land.
  React.useEffect(() => {
    if (!seconds || seconds <= 0 || !onRefresh) return;
    const interval = setInterval(handleRefresh, seconds * 1000);
    return () => clearInterval(interval);
  }, [seconds, onRefresh, handleRefresh]);

  return { refreshing, handleRefresh };
}
