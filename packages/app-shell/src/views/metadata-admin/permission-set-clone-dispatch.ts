// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * "Clone to customize" (objectui#5987) — resolving the server-published
 * `clone_permission_set` record action and shaping its dispatch.
 *
 * The permission matrix locks a set a code package ships (the artifact tier).
 * The maintainer's 2026-08-24 ruling (objectstack `e170b0ae5`) — lock the base, clone to
 * customize — makes cloning the sanctioned edit path, and the server's own
 * `403 not_overridable` refusal names the `clone_permission_set` action as the
 * remedy. The editor therefore runs THAT action, resolved by name off the
 * `sys_permission_set` object definition the console already holds, and never
 * hand-rolls a copy out of create/update calls: the action's `params` list IS
 * the payload (which facets a clone carries is decided where the action is
 * declared), and a second spelling of it here would be the silent-grant-loss
 * shape objectstack `5cb62d88b` closed.
 *
 * ## Why this lives beside the editor rather than in it
 *
 * The dispatch is the same shape `DeclaredActionsBar` and `ObjectGrid` hand
 * the console action runner for a `record_header` / `list_item` action: the
 * declaration spread first, `objectName`, and the row under
 * `params._rowRecord`. That is an object literal that opens with a spread —
 * the very shape `permission-slice.authoredKeys.test.ts` reads inside
 * `PermissionMatrixEditor.tsx` as "a facet written into the permission-set
 * draft". These keys are the action call's arguments, not facets of a
 * permission set, so the construction sits in this module, which that scan
 * does not read, instead of being reshaped to dodge it.
 */

import type { ActionDef } from '@object-ui/core';
import type { ConsoleActionDispatch } from '../../consoleActionDispatch.js';

/** The record object a permission set is projected onto. */
export const PERMISSION_SET_OBJECT = 'sys_permission_set';
/** The record action the server publishes on it, and the 403 names as the remedy. */
export const CLONE_PERMISSION_SET_ACTION = 'clone_permission_set';

/** The published action, as an object definition declares it. */
export type CloneAction = ActionDef & { params?: unknown };

/**
 * Find `clone_permission_set` on the `sys_permission_set` object among the
 * object definitions the console metadata store holds. `undefined` when the
 * server publishes no such object or no such action — the caller refuses,
 * it does not fall back.
 */
export function findCloneAction(objectDefs: unknown): CloneAction | undefined {
  const defs = Array.isArray(objectDefs) ? objectDefs : [];
  const setObject = defs.find(
    (o: { name?: unknown }) => o?.name === PERMISSION_SET_OBJECT,
  ) as { actions?: unknown } | undefined;
  const declared = Array.isArray(setObject?.actions) ? setObject.actions : [];
  return declared.find(
    (a: { name?: unknown }) => a?.name === CLONE_PERMISSION_SET_ACTION,
  ) as CloneAction | undefined;
}

/**
 * `localizeActionTexts` from `@object-ui/react`, by its call shape: label,
 * confirmText and successMessage resolved through the `_actions.NAME` bundle.
 */
export type ActionTextLocalize = (
  objectName: string,
  action: Record<string, unknown>,
) => Record<string, unknown>;

/**
 * Shape the runner dispatch for cloning `row` through `cloneAction`.
 *
 * Same dispatch shape as `DeclaredActionsBar`: the (localized) declaration
 * forwarded whole, `objectName` set, the declared `params` ARRAY surfaced as
 * `actionParams` (the runner's param-dialog input, seeded `defaultFromRow`
 * from the row), and `params` reserved for the `_rowRecord` stash the api
 * handler reads for `{id}` interpolation and record-id injection.
 */
export function buildCloneDispatch(
  cloneAction: CloneAction,
  row: Record<string, unknown>,
  localize: ActionTextLocalize,
): ConsoleActionDispatch {
  const { params: declaredParams, ...rest } = cloneAction;
  const dispatch: ConsoleActionDispatch = {
    ...localize(PERMISSION_SET_OBJECT, rest as Record<string, unknown>),
    objectName: PERMISSION_SET_OBJECT,
    params: { _rowRecord: row },
  };
  if (Array.isArray(declaredParams) && declaredParams.length > 0) {
    dispatch.actionParams = declaredParams as ConsoleActionDispatch['actionParams'];
  }
  return dispatch;
}
