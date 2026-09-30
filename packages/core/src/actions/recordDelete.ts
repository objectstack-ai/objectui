/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The ONE record-delete core — the confirm question and the delete itself —
 * that every host's list Delete binds to (objectui#10383).
 *
 * ## Why this lives here, and why there is only one
 *
 * The console's object list deleted through `useObjectActions` (`app-shell`):
 * the confirm question, the single delete with its ADR-0094 detection, the bulk
 * delete and their toasts were written inline in that hook. The registered
 * `object-view` renderer (`plugin-view`) had no delete at all — its grid
 * handlers only refreshed — and the first repair COPIED those steps into a
 * second flow. The copy already diverged on consent: it asked every row the
 * plain "delete this record?" question, while the console asks a package-owned
 * permission set the honest reset question. One operation with two
 * implementations drifts on exactly the part that matters, so the rule is: the
 * side with the governance keeps it, the other side re-binds to it, and there
 * is one copy. This module is that copy, and both hosts call it.
 *
 * `@object-ui/core` is the lowest package both hosts already depend on. The
 * host-specific pieces are INJECTED — the translator, the toast sink, the data
 * source and the refresh — so this package gains no i18n or toast dependency.
 * The host keeps its own confirm UI (`app-shell` runs the question through the
 * action runner's confirm handler; `plugin-view` renders it in its own
 * AlertDialog); the QUESTION comes from {@link recordDelete}.confirmText.
 *
 * ## ADR-0094 — a package-owned permission set is RESET, not deleted
 *
 * "Deleting" a `sys_permission_set` row whose `managed_by` is `'package'` does
 * not remove it: the backend drops the environment overlay and resets the set
 * to its shipped baseline. So the confirm asks the reset question and the
 * success toast says "reset" — a promise of an irreversible delete the user can
 * then see did not happen would be the dishonest copy. The row passed in is
 * read first; when the caller has only an id (an SDUI header delete), the row
 * is looked up with `findOne`, best-effort — a failed lookup falls back to the
 * generic copy rather than blocking the delete.
 *
 * ## The result shape is the action runner's, on purpose
 *
 * `run` returns what a registered `delete` handler returns, because the console
 * registers it as exactly that. The toasts here are the AUTHORITATIVE feedback,
 * so every path returns WITHOUT an `error` key (and success returns `silent`) —
 * otherwise the runner's post-execution hook, which has its own toast handler,
 * would toast the same outcome a second time. The single exception is a
 * request with no record id at all, which toasts nothing here and returns the
 * `error` for the runner to report.
 *
 * Record ids are forwarded exactly as the caller supplied them; nothing here
 * converts them.
 */

import type { ActionResult } from './ActionRunner.js';

type Row = Record<string, unknown>;

/** Translate a key — the host's `t`, injected so core takes no i18n dependency. */
type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Everything `run` needs from its host. `confirmText` needs only the first two. */
interface RecordDeleteDeps {
  objectName: string;
  t: Translate;
  /** The object's display label, used by the toasts. */
  label: string;
  dataSource: {
    delete(resource: string, id: string): Promise<unknown>;
    findOne(resource: string, id: string): Promise<unknown>;
  };
  /** The host's toast sink (sonner's `toast` in both hosts today). */
  toast: {
    success(message: string): unknown;
    error(message: string, data?: { description?: string }): unknown;
  };
  /** Re-read the list after a delete. */
  onRefresh?: () => void;
}

/**
 * The request, in the action runner's `delete` shape — the console registers
 * `run` as its `delete` handler, so the runner's action arrives here verbatim:
 * `params.records` (several), `params.recordId` + optional `params.record`
 * (one), and the legacy top-level `recordId`.
 */
interface RecordDeleteRequest {
  params?: { records?: unknown; recordId?: unknown; record?: Row | null };
  recordId?: unknown;
}

const PERMISSION_SET_OBJECT = 'sys_permission_set';

/** ADR-0094: is this permission-set row owned by an installed package? */
function isPackageOwned(row: unknown): boolean {
  return (row as Row | null | undefined)?.managed_by === 'package';
}

/**
 * The record-delete core: `confirmText` is the question to ask before deleting
 * one record, `run` performs the delete (one record, or several settled
 * together) and reports it. See the module docblock for objectui#10383 and
 * ADR-0094.
 */
export const recordDelete = Object.freeze({
  /**
   * The question to ask before deleting ONE record: the reset question for a
   * package-owned permission set (ADR-0094), the plain delete question
   * otherwise. Reads only the row it is handed — no lookup.
   */
  confirmText(deps: Pick<RecordDeleteDeps, 'objectName' | 't'>, record?: Row | null): string {
    const { objectName, t } = deps;
    return objectName === PERMISSION_SET_OBJECT && isPackageOwned(record)
      ? t('objectActions.resetPackageSetConfirm', {
          defaultValue:
            'This permission set ships with an installed package and cannot be removed. ' +
            'Deleting resets it to the shipped baseline and discards your environment customization. Continue?',
        })
      : t('objectActions.deleteConfirm');
  },

  /**
   * Delete, refresh and report. Several records (`params.records`, more than
   * one with an `id`) are deleted one call each and settled together, then the
   * list refreshes and ONE summary toast reports the batch. Otherwise one
   * record is deleted; on success the list refreshes and a success toast shows
   * (the reset copy for a package-owned permission set), on failure an error
   * toast carries the error message and the list is left as it is.
   */
  async run(deps: RecordDeleteDeps, request: RecordDeleteRequest): Promise<ActionResult> {
    const { objectName, t, label, dataSource, toast, onRefresh } = deps;
    const params = request.params;
    const records = Array.isArray(params?.records)
      ? (params.records as Row[]).filter((r) => r?.id != null)
      : null;

    // Bulk path — delete every record in parallel and report a summary.
    if (records && records.length > 1) {
      const results = await Promise.allSettled(
        records.map((r) => dataSource.delete(objectName, r.id as string)),
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      const succeeded = results.length - failed;
      onRefresh?.();
      if (failed === 0) {
        toast.success(
          t('objectActions.bulkDeleteSuccess', {
            count: succeeded,
            label,
            defaultValue: `Deleted ${succeeded} ${label} records`,
          }),
        );
        // `silent`: the summary above is the feedback — without it the runner's
        // post-execution hook adds a second, generic success toast.
        return { success: true, reload: true, silent: true };
      }
      toast.error(
        t('objectActions.bulkDeletePartial', {
          succeeded,
          failed,
          defaultValue: `${succeeded} deleted, ${failed} failed`,
        }),
      );
      // The summary above is authoritative; returning WITHOUT `error` keeps the
      // runner from toasting the failure a second time.
      return { success: false };
    }

    const recordId =
      params?.recordId ?? params?.record?.id ?? records?.[0]?.id ?? request.recordId;
    if (!recordId) return { success: false, error: t('objectActions.noRecordId') };

    // [ADR-0094] Detect the reset BEFORE the delete (the row still exists), so
    // the success toast tells the truth. A caller that passed the row spares
    // the lookup.
    let packagedSetReset = false;
    if (objectName === PERMISSION_SET_OBJECT) {
      try {
        const row =
          params?.record?.managed_by !== undefined
            ? params.record
            : await dataSource.findOne(objectName, recordId as string);
        packagedSetReset = isPackageOwned(row);
      } catch { /* best-effort — fall back to the generic delete copy */ }
    }

    try {
      await dataSource.delete(objectName, recordId as string);
      onRefresh?.();
      toast.success(
        packagedSetReset
          // No `label` argument, unlike `deleteSuccess` below: this sentence
          // names the permission set by kind rather than by label, so none of
          // the ten packs has a `{{label}}` hole and i18next would drop the
          // argument in silence (objectui#3845).
          ? t('objectActions.resetPackageSetSuccess', {
              defaultValue: 'Permission set reset to its shipped baseline',
            })
          : t('objectActions.deleteSuccess', { label }),
      );
      return { success: true, reload: true, silent: true };
    } catch (err) {
      toast.error(t('objectActions.deleteFailed', { label }), {
        description: (err as Error).message,
      });
      // The toast above (label + error message) is the feedback; returning
      // WITHOUT `error` keeps the runner from toasting the raw message again.
      return { success: false };
    }
  },
});
