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
  const { evaluator } = useExpressionContext();
  const evalVis = useCallback(
    (expr: string | boolean | undefined) => evaluateNavigationVisibility(expr, evaluator),
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
  const { objects: metadataObjects } = useMetadata();
  const registeredObjectNames = useMemo(
    () => new Set<string>((metadataObjects || []).map((o: any) => o?.name).filter(Boolean)),
    [metadataObjects],
  );
  const checkCap = useCallback(
    (kind: 'object' | 'service', name: string): boolean => {
      if (kind === 'object') {
        if (registeredObjectNames.size === 0) return true;
        return registeredObjectNames.has(name);
      }
      return true;
    },
    [registeredObjectNames],
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
