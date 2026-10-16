// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * PositionPreview — read-only summary of a Position draft (ADR-0090 D3).
 *
 * The Position schema is intentionally minimal — name / label /
 * description — and deliberately FLAT: no parent, no hierarchy. The
 * visibility hierarchy lives on the business-unit tree, not here, so the
 * preview's job is to put those fields into the mental model an operator
 * carries:
 *
 *   • Header card with label and machine name.
 *   • Description block.
 *   • A "permissions are managed separately" note pointing the user to
 *     Permission Sets that grant CRUD-VAMA — this is the most common
 *     confusion when first authoring a position.
 */

import * as React from 'react';
import { ShieldCheck, Users } from 'lucide-react';
import type { MetadataPreviewProps } from '../preview-registry.js';
import { t as tr } from '../i18n.js';
import { PreviewShell, PreviewMessage, PreviewErrorBoundary } from './PreviewShell.js';
import { withNodes } from './row-nodes.js';

export function PositionPreview({ name, draft, locale }: MetadataPreviewProps) {
  const d = draft as Record<string, unknown>;
  const positionName = String(d.name ?? name ?? '');
  const label = String(d.label ?? positionName);
  const description = (d.description as string | undefined) ?? '';

  if (!positionName) {
    return (
      <PreviewShell hint="position">
        <PreviewMessage>{tr('engine.positionPreview.empty', locale)}</PreviewMessage>
      </PreviewShell>
    );
  }

  return (
    <PreviewShell hint="position">
      <PreviewErrorBoundary>
        <div className="p-3 space-y-3">
          {/* Header */}
          <div className="rounded border bg-muted/30 p-3">
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-medium truncate">{label}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{positionName}</span>
                </div>
                {description && (
                  <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
                )}
              </div>
            </div>
          </div>

          {/* Permissions note */}
          <div className="rounded border border-blue-200 bg-blue-50 p-2.5 text-[11px] text-blue-900">
            <div className="flex items-start gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">{tr('engine.positionPreview.noAccess', locale)}</div>
                <div className="opacity-90 mt-0.5">
                  {withNodes(tr('engine.positionPreview.bind', locale), {
                    name: <code className="font-mono">{positionName}</code>,
                    permissionSets: <strong>{tr('engine.positionPreview.permissionSets', locale)}</strong>,
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </PreviewErrorBoundary>
    </PreviewShell>
  );
}
