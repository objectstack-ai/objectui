/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * ExportProgressDialog — UI for the async export job lifecycle.
 *
 * Pair with `useExportJob` to render a progress bar (determinate when the
 * server reports `percentComplete`, indeterminate otherwise), a Cancel button
 * while the job is in flight, and a Download button when it completes.
 *
 * The dialog is fully controlled by the `job` returned from `useExportJob`;
 * pass `open`/`onOpenChange` to control its visibility (typically opened by
 * the same handler that calls `job.start(...)`).
 */

import * as React from 'react';
import { Download, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useDisplayLocale } from '@object-ui/i18n';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { cn } from '../lib/utils';
import type { UseExportJobReturn } from '../hooks/use-export-job';

export interface ExportProgressDialogProps {
  /** Visibility, controlled. */
  open: boolean;
  /** Visibility setter. */
  onOpenChange: (open: boolean) => void;
  /** Job state object returned from `useExportJob`. */
  job: UseExportJobReturn;
  /** Optional title override (defaults to 'Exporting…'). */
  title?: string;
  /** Optional description override. */
  description?: string;
  /** Default download filename. */
  filename?: string;
  /** Show the Close button while the job is running. Default true. */
  allowCloseWhileRunning?: boolean;
  /** Optional className passthrough for the dialog content. */
  className?: string;
  /** Called after the user clicks Download (after the click resolves). */
  onAfterDownload?: () => void;
  /** Auto-close the dialog this many ms after a successful download. */
  closeAfterDownloadMs?: number;
}

function formatBytes(bytes?: number): string {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function ExportProgressDialog({
  open,
  onOpenChange,
  job,
  title,
  description,
  filename,
  allowCloseWhileRunning = true,
  className,
  onAfterDownload,
  closeAfterDownloadMs,
}: ExportProgressDialogProps) {
  const { progress, error, isRunning, cancel, download, reset } = job;
  // The record counts are a number face the user reads while the export runs,
  // so they group in the display locale — a bare `toLocaleString()` handed
  // `Intl` the MACHINE's locale (objectui#9909).
  const displayLocale = useDisplayLocale();
  const status = progress?.status;
  const percent = typeof progress?.percentComplete === 'number'
    ? Math.max(0, Math.min(100, progress!.percentComplete!))
    : undefined;
  const isComplete = status === 'completed';
  const isFailed = status === 'failed' || status === 'expired';
  const isCancelled = status === 'cancelled';

  const handleDownload = React.useCallback(async () => {
    const ok = await download(filename);
    if (ok) {
      onAfterDownload?.();
      if (closeAfterDownloadMs && closeAfterDownloadMs > 0) {
        setTimeout(() => onOpenChange(false), closeAfterDownloadMs);
      }
    }
  }, [download, filename, onAfterDownload, closeAfterDownloadMs, onOpenChange]);

  const handleClose = React.useCallback(
    (next: boolean) => {
      if (!next && isRunning && !allowCloseWhileRunning) return;
      onOpenChange(next);
      if (!next && !isRunning) {
        // Reset state once the dialog actually closes after the job finishes.
        setTimeout(reset, 0);
      }
    },
    [isRunning, allowCloseWhileRunning, onOpenChange, reset],
  );

  const resolvedTitle = title ?? (isComplete ? 'Export ready' : isFailed ? 'Export failed' : isCancelled ? 'Export cancelled' : 'Exporting…');
  const resolvedDescription =
    description ??
    (isComplete
      ? 'Your export is ready to download.'
      : isFailed
      ? 'The export job did not complete.'
      : isCancelled
      ? 'The export was cancelled.'
      : 'Your export is being prepared on the server. You can close this window — the job will continue in the background.');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        data-testid="export-progress-dialog"
        className={cn('sm:max-w-md', className)}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden="true" />
            ) : isFailed ? (
              <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
            ) : (
              <Loader2 className={cn('h-5 w-5 text-muted-foreground', isRunning && 'animate-spin')} aria-hidden="true" />
            )}
            {resolvedTitle}
          </DialogTitle>
          <DialogDescription>{resolvedDescription}</DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-3">
          {(isRunning || isComplete) && (
            <div data-testid="export-progress-bar">
              {percent !== undefined ? (
                <Progress value={percent} aria-label="Export progress" />
              ) : (
                <Progress value={undefined as unknown as number} aria-label="Export progress (indeterminate)" />
              )}
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span data-testid="export-progress-counts">
              {progress?.processedRecords != null
                ? `${progress.processedRecords.toLocaleString(displayLocale)}${
                    progress.totalRecords != null ? ` / ${progress.totalRecords.toLocaleString(displayLocale)}` : ''
                  } records`
                : isRunning
                ? 'Starting…'
                : ''}
            </span>
            <span data-testid="export-progress-percent">
              {percent !== undefined ? `${percent.toFixed(0)}%` : ''}
            </span>
          </div>
          {progress?.fileSize ? (
            <div className="text-xs text-muted-foreground">{formatBytes(progress.fileSize)}</div>
          ) : null}
          {(error || progress?.error) && (
            <div
              data-testid="export-progress-error"
              className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-2 py-1"
            >
              {error?.message || progress?.error?.message}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {isRunning && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => cancel()}
              data-testid="export-progress-cancel"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="ml-1">Cancel</span>
            </Button>
          )}
          {isComplete && (
            <Button
              type="button"
              variant="default"
              onClick={handleDownload}
              data-testid="export-progress-download"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span className="ml-1">Download</span>
            </Button>
          )}
          {!isRunning && (
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              data-testid="export-progress-close"
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
