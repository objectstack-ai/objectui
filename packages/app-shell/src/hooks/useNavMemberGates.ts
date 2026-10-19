/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The member gates the console's sidebar draws its navigation through, in ONE
 * place, so that every console consumer of an app's navigation tree reads the
 * same answer (objectui#12426).
 *
 * ## What a member is shown
 *
 * An entry is shown to a member when it survives both halves the sidebar
 * applies:
 *
 *  - the object-read prune (`withoutUnreadableObjectEntries`, objectui#12109):
 *    a `type: 'object'` entry whose object the member may not read is dropped,
 *    with its subtree;
 *  - `@object-ui/layout`'s item guard, asked per node through
 *    `hasVisibleNavigationItems([item], …)`: the `visible` expression or
 *    boolean, `requiredPermissions`, and the `requiresObject` /
 *    `requiresService` runtime-capability gates. A `group` survives only
 *    through a child that does.
 *
 * The callbacks that guard is handed (`evaluateVisibility`, `checkPermission`,
 * `checkCapability`) are built here and nowhere else: `UnifiedSidebar` draws
 * with them, and the app root's landing (`AppContent`) picks its first entry
 * with them. Before this, the sidebar built them inline and the landing applied
 * none, so a member was sent to the first SERVED entry even when the sidebar
 * hid it from them (objectui#12426), the same family as the mobile tab bar
 * (objectui#11362).
 *
 * ## Readiness
 *
 * Nothing here waits on its own. The console mounts `MePermissionsProvider`
 * above the whole app shell, and it renders its loading fallback, not its
 * children, until it holds an answer; so a consumer of this hook never runs on
 * an unchecked member. With no permission provider mounted, `can` answers
 * `true`, exactly as it does for the sidebar.
 *
 * The `visible` evaluation is the exception to that "unknown reads as yes", and
 * deliberately (objectui#12700): it goes through `evaluateNavigationVisibility`,
 * so a predicate the evaluator cannot answer — `current_user.can(...)` where no
 * permissions payload is bound, as on a frame with no permission provider —
 * withholds its entry and reports once, instead of drawing it for everyone.
 *
 * Internal module: not re-exported by the package entry.
 */

import { useCallback, useMemo } from 'react';
import { hasVisibleNavigationItems, type NavigationVisibilityOptions } from '@object-ui/layout';
import type { NavigationItem } from '@object-ui/types';
import { usePermissions } from '@object-ui/permissions';
import { useMetadata } from '../providers/MetadataProvider.js';
import { useExpressionContext, evaluateNavigationVisibility } from '../providers/ExpressionProvider.js';
import { withoutUnreadableObjectEntries, type ObjectReadCheck } from '../utils/navObjectReadGate.js';
import { filterActiveApps } from '../utils/appRoute.js';
import { navigationNames } from '../console/appObjectScope.js';

const NO_MISSING: readonly string[] = [];

/** No app requires an object: nothing is gated, and nothing is asked. */
const NO_REQUIRED_OBJECTS = Object.freeze({ objects: [] as readonly unknown[], missing: NO_MISSING });

/**
 * Every `requiresObject` name the app list carries (objectui#12980): in the
 * `navigation` and every `areas[].navigation` of each active app, and of the
 * app being rendered (a hidden one is not in the active list). These are all
 * the names any consumer of the gate asks it about. Sorted, so the same list
 * reads the same names in the same order.
 */
function requiredObjectUnion(apps: unknown, current: Record<string, unknown> | undefined): string[] {
  const out = new Set<string>();
  const pick = (item: Record<string, unknown>) => item.requiresObject;
  const listed = filterActiveApps(Array.isArray(apps) ? (apps as Array<Record<string, unknown>>) : []);
  for (const app of current ? [...listed, current] : listed) {
    for (const name of navigationNames(app?.navigation, pick)) out.add(name);
    const areas: unknown[] = Array.isArray(app?.areas) ? app.areas : [];
    for (const area of areas) {
      const tree = area && typeof area === 'object' ? (area as { navigation?: unknown }).navigation : undefined;
      for (const name of navigationNames(tree, pick)) out.add(name);
    }
  }
  return [...out].sort();
}

/** The member's gates, as the sidebar applies them. */
export interface NavMemberGates {
  /** The `visible` evaluator handed to `@object-ui/layout`'s item guard. */
  evaluateVisibility: NonNullable<NavigationVisibilityOptions['evaluateVisibility']>;
  /** The `requiredPermissions` checker handed to the same guard. */
  checkPermission: NonNullable<NavigationVisibilityOptions['checkPermission']>;
  /** The runtime-capability checker handed to the same guard. */
  checkCapability: NonNullable<NavigationVisibilityOptions['checkCapability']>;
  /** The object-read verdict the tree is pruned by (objectui#12109). */
  can: ObjectReadCheck;
}

/**
 * The member's gates, built from the providers the console mounts: the
 * expression evaluator, `usePermissions()`, and the registered object list.
 */
export function useNavMemberGates(): NavMemberGates {
  const { evaluator, app } = useExpressionContext();
  const evalVis = useCallback(
    (expr: NavigationItem['visible']) => evaluateNavigationVisibility(expr, evaluator),
    [evaluator],
  );

  // Permission check for nav `requiredPermissions` entries.
  //
  // Two authored forms:
  //  - `object:action` → object CRUD gate.
  //  - bare name → an ADR-0066 system capability, checked against the union of
  //    the user's permission-set `systemPermissions` (from /me/permissions) —
  //    the SAME subset rule the server applies to `AppSchema.requiredPermissions`.
  //    This used to be misread as `can(<name>, 'read')` only, so a nav item
  //    requiring a capability was hidden even from users whose permission set
  //    granted it (admins included) — `requiredPermissions` degenerated into a
  //    "hide from everyone" switch. The object-read fallback stays for nav
  //    items that gate on a plain object name.
  const { can, hasCapabilities } = usePermissions();
  const checkPerm = useCallback(
    (permissions: string[]) => permissions.every((perm: string) => {
      const parts = perm.split(':');
      if (parts.length >= 2) {
        return can(parts[0], parts[1] as any);
      }
      return hasCapabilities([perm]) || can(perm, 'read');
    }),
    [can, hasCapabilities],
  );

  // Runtime capability gate: hide nav items targeting objects/services
  // not registered in this runtime (e.g. cloud-only `sys_app`).
  //
  // objectui#12811 — inside an app whose served item names its package, and
  // while nothing has asked for the whole registry, the gate reads that app's
  // object scope (`readObjectScope`): an object the scope holds is registered,
  // one the server answered without a definition is not, and any other reads
  // as registered, as every object did while the whole list loaded. The gate
  // asks for nothing itself: `AppContent` names the objects the app's own
  // entries require, so the sidebar's answer is exact, while the bell's
  // cross-app roster does not ask another app's objects one by one. Outside an
  // app (the home page's feeds) there is no package, and the gate reads the
  // whole registry, as it does once anything has loaded it.
  //
  // objectui#12980 — inside an app whose served item names NO package (an app
  // created in the console), on the same condition, the gate reads the
  // names-only scope over every `requiresObject` the app list carries, in each
  // app's `navigation` and `areas[].navigation`. That is every name any
  // consumer gates (the sidebar, the landing, the bell's cross-app roster), so
  // each is asked by name and answered exactly as the whole registry answers
  // it. A name not answered yet, or whose read failed (objectui#13009: left
  // unanswered), shows, as every entry does while the whole list loads or
  // after it fails.
  const metadata = useMetadata();
  const packageId = typeof app?._packageId === 'string' && app._packageId ? app._packageId : undefined;
  const packageless = !packageId && typeof app?.name === 'string' && app.name !== '';
  const readObjectScope =
    (packageId || packageless) && metadata.getTypeStatus?.('object') === 'idle' ? metadata.readObjectScope : undefined;
  const unionNames = readObjectScope && !packageId ? requiredObjectUnion(metadata.apps, app) : NO_MISSING;
  const scope: { objects: readonly unknown[]; missing: readonly string[] } | null = !readObjectScope
    ? null
    : packageId
      ? readObjectScope({ packageId })
      : unionNames.length > 0
        ? readObjectScope({ names: unionNames })
        : NO_REQUIRED_OBJECTS;
  const metadataObjects = scope ? scope.objects : metadata.objects;
  const missingObjects = scope ? scope.missing : NO_MISSING;
  const registeredObjectNames = useMemo(
    () => new Set<string>((metadataObjects || []).map((o: any) => o?.name).filter(Boolean)),
    [metadataObjects],
  );
  const missingObjectNames = useMemo(() => new Set<string>(missingObjects), [missingObjects]);
  const checkCap = useCallback(
    (kind: 'object' | 'service', name: string): boolean => {
      if (kind === 'object') {
        if (!readObjectScope) {
          if (registeredObjectNames.size === 0) return true;
          return registeredObjectNames.has(name);
        }
        return registeredObjectNames.has(name) || !missingObjectNames.has(name);
      }
      return true;
    },
    [registeredObjectNames, missingObjectNames, readObjectScope],
  );

  return { evaluateVisibility: evalVis, checkPermission: checkPerm, checkCapability: checkCap, can };
}

/**
 * `items` as this member is shown them: the object-read prune, then every node
 * that `@object-ui/layout`'s item guard refuses dropped, at every group depth.
 *
 * A `separator` is dropped (it is no entry), and an `action` entry is kept: the
 * console's sidebar always wires an action dispatcher, so it draws one. A `doc`
 * entry is kept as served: the sidebar's doc-readability answer is defence in
 * depth behind the server, which already drops an unreadable one
 * (objectstack#19790), and no consumer of this function lands on a `doc`.
 */
export function navEntriesShownToMember(items: NavigationItem[], gates: NavMemberGates): NavigationItem[] {
  const guards: NavigationVisibilityOptions = {
    evaluateVisibility: gates.evaluateVisibility,
    checkPermission: gates.checkPermission,
    checkCapability: gates.checkCapability,
    hasActionHandler: true,
  };
  const shown = (list: NavigationItem[]): NavigationItem[] =>
    list
      .filter((item) => hasVisibleNavigationItems([item], guards))
      .map((item) =>
        item.type === 'group' && Array.isArray(item.children)
          ? ({ ...item, children: shown(item.children) } as NavigationItem)
          : item,
      );
  return shown(withoutUnreadableObjectEntries(items, gates.can));
}
