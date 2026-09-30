/**
 * useObjectActions Hook
 *
 * Provides action handlers for CRUD operations on an object, backed by
 * the ActionRunner from @object-ui/core via the useActionRunner hook.
 *
 * Supports:
 * - create: Open create dialog
 * - delete: Delete a record with confirmation
 * - navigate: Route to a specific view or record
 * - refresh: Trigger a data refresh
 */

import { useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useActionRunner } from '@object-ui/react';
import { useObjectTranslation } from '@object-ui/i18n';
import { toast } from 'sonner';
import { recordDelete, type ActionDef, type ActionResult } from '@object-ui/core';

interface ObjectActionConfig {
  objectName: string;
  objectLabel?: string;
  dataSource: any;
  onEdit?: (record: any) => void;
  onRefresh?: () => void;
  /** Optional shadcn-style confirm handler — falls back to window.confirm */
  onConfirm?: (message: string, options?: { title?: string; confirmText?: string; cancelText?: string }) => Promise<boolean>;
  /** Optional toast handler — falls back to sonner */
  onToast?: (message: string, options?: { type?: string }) => void;
}

interface ObjectActions {
  /** Run an action by schema or type string */
  execute: (action: ActionDef) => Promise<ActionResult>;
  /** Create new record — opens the create dialog */
  create: () => void;
  /**
   * Delete a record by id. Pass the row (`record`) when available so a
   * package-owned permission set can be recognised as a RESET rather than a
   * delete (ADR-0094) without an extra fetch.
   */
  deleteRecord: (recordId: string, record?: Record<string, unknown>) => Promise<ActionResult>;
  /** Navigate to a view */
  navigateToView: (viewId: string) => void;
  /** Navigate to a record detail */
  navigateToRecord: (recordId: string) => void;
  /** Whether an action is currently executing */
  loading: boolean;
  /** Last error message */
  error: string | null;
}

export function useObjectActions({
  objectName,
  objectLabel,
  dataSource,
  onEdit,
  onRefresh,
  onConfirm,
  onToast,
}: ObjectActionConfig): ObjectActions {
  const navigate = useNavigate();
  const { appName } = useParams();
  const { t } = useObjectTranslation();
  const baseUrl = `/apps/${appName}`;

  const { execute, loading, error, runner } = useActionRunner({
    context: {
      objectName,
      objectLabel: objectLabel || objectName,
      baseUrl,
    },
    onConfirm,
    onToast,
  });

  // Register custom handlers
  useEffect(() => {
    // Handler: create
    runner.registerHandler('create', async () => {
      onEdit?.(null);
      return { success: true };
    });

    // Handler: delete — the shared record-delete core (objectui#10383), the
    // same one `plugin-view`'s grid Delete binds to. Its param shapes:
    //   { params: { recordId } }       — toolbar / programmatic deletes
    //   { params: { record } }         — ObjectGrid row dropdown
    //   { params: { records: [...] } } — bulk delete (multi-row)
    //   { recordId } (legacy)          — pre-params shape
    // It owns the toasts and returns without `error` (and `silent` on
    // success), so the runner's post-execution hook adds no second toast; the
    // ADR-0094 package-owned permission-set reset copy lives there too.
    runner.registerHandler('delete', (action: any) =>
      recordDelete.run(
        { objectName, label: objectLabel || objectName, dataSource, t, toast, onRefresh },
        action,
      ),
    );

    // Handler: navigate
    runner.registerHandler('navigate', async (action: any) => {
      const url = action.params?.url || action.url;
      if (url) {
        navigate(url.startsWith('/') ? url : `${baseUrl}/${url}`);
      }
      return { success: true };
    });

    // Handler: refresh
    runner.registerHandler('refresh', async () => {
      onRefresh?.();
      return { success: true, reload: true };
    });
  }, [runner, objectName, dataSource, onEdit, onRefresh, navigate, baseUrl, t, objectLabel]);

  const create = useCallback(() => {
    onEdit?.(null);
  }, [onEdit]);

  const deleteRecord = useCallback(
    async (recordId: string, record?: Record<string, unknown>) => {
      // The question comes from the shared record-delete core (objectui#10383):
      // for a package-owned permission set it is the honest RESET question
      // (ADR-0094), not a promise of an irreversible delete the user can see
      // doesn't happen (the row stays).
      return execute({
        type: 'delete',
        confirmText: recordDelete.confirmText({ objectName, t }, record),
        params: record ? { recordId, record } : { recordId },
      });
    },
    [execute, t, objectName],
  );

  const navigateToView = useCallback(
    (viewId: string) => {
      navigate(`${baseUrl}/${objectName}/view/${viewId}`);
    },
    [navigate, baseUrl, objectName],
  );

  const navigateToRecord = useCallback(
    (recordId: string) => {
      navigate(`${baseUrl}/${objectName}/record/${encodeURIComponent(recordId)}`);
    },
    [navigate, baseUrl, objectName],
  );

  return {
    execute,
    create,
    deleteRecord,
    navigateToView,
    navigateToRecord,
    loading,
    error,
  };
}
