/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The compact posture of a list block (objectui#12703): what `ListView` draws
 * in place of its toolbar, its grid and its record-count bar when the page
 * region it sits in is narrower than half the page.
 *
 * A short list, not a small grid: a header with the list's title and its
 * record count, then one row per record whose first line is the view's first
 * visible column and whose muted second line is its second. No toolbar, no
 * view tabs, no row-number column, no pager — those belong to the object
 * list, and a rail beside `main` has no room for them.
 *
 * Values render through the shared cell renderers (`getCellRenderer`), so a
 * date, a picklist label or a related record reads the way the grid and the
 * gallery draw it. ⛔ No second formatter lives here.
 */

import * as React from 'react';
import { cn } from '@object-ui/components';
import { getRecordDisplayName, isEmptyValue, columnIdentity } from '@object-ui/core';
import { getCellRenderer, resolveCellRendererType } from '@object-ui/fields';
import { useSafeFieldLabel } from '@object-ui/i18n';

/** The two columns a compact row draws: the view's first two visible ones. */
export function compactRowColumns(fields: readonly unknown[]): { primary?: string; secondary?: string } {
  const names = fields
    .map((f) => columnIdentity(f))
    .filter((n): n is string => typeof n === 'string' && n.length > 0);
  return { primary: names[0], secondary: names[1] };
}

export interface ListViewCompactHeaderProps {
  title?: string;
  /** The record count to show, or `null` while it is not known. */
  count: number | null;
  /** The count as a sentence, the badge's accessible name (`list.recordCount`). */
  countLabel?: string;
}

/** The compact list's header: its title and its record count. */
export function ListViewCompactHeader({ title, count, countLabel }: ListViewCompactHeaderProps) {
  if (!title && count == null) return null;
  return (
    <div
      className="flex items-center justify-between gap-2 border-b px-3 py-2 shrink-0"
      data-testid="list-compact-header"
    >
      <span className="min-w-0 truncate text-sm font-medium text-foreground" data-testid="list-compact-title">
        {title}
      </span>
      {count != null && (
        <span
          className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground"
          data-testid="list-compact-count"
          aria-label={countLabel}
          title={countLabel}
        >
          {count}
        </span>
      )}
    </div>
  );
}

export interface ListViewCompactRowsProps {
  rows: readonly Record<string, unknown>[];
  /** The view's visible columns, in order (`ListView`'s `effectiveFields`). */
  fields: readonly unknown[];
  objectName?: string;
  /** The object's metadata, for the field types the cells format by. */
  objectDef?: { fields?: Record<string, Record<string, unknown>> } | null;
  onRowClick?: (record: Record<string, unknown>) => void;
}

/** The compact list's rows: the first visible column over the second, muted. */
export function ListViewCompactRows({ rows, fields, objectName, objectDef, onRowClick }: ListViewCompactRowsProps) {
  const { fieldLabel, fieldOptionLabel } = useSafeFieldLabel();
  const { primary, secondary } = compactRowColumns(fields);

  // The field as the shared cell renderers take it: the object's definition,
  // its label and option labels through the i18n dictionary.
  const fieldFor = (name: string): Record<string, unknown> => {
    const def = objectDef?.fields?.[name] ?? {};
    const field: Record<string, unknown> = { ...def, name };
    if (objectName) {
      field.label = fieldLabel(objectName, name, String(def.label ?? name));
      if (Array.isArray(def.options)) {
        field.options = (def.options as unknown[]).map((opt) => {
          const o = (opt && typeof opt === 'object' ? opt : { value: opt }) as Record<string, unknown>;
          const value = String(o.value ?? '');
          return { ...o, value, label: fieldOptionLabel(objectName, name, value, String(o.label ?? value)) };
        });
      }
    }
    return field;
  };

  const cell = (record: Record<string, unknown>, name: string): React.ReactNode => {
    const value = record[name];
    if (isEmptyValue(value)) return null;
    const field = fieldFor(name);
    const Cell = getCellRenderer(resolveCellRendererType(field as never));
    return <Cell value={value} field={field as never} />;
  };

  return (
    <ul className="divide-y" data-testid="list-compact-rows">
      {rows.map((record, i) => {
        const id = (record.id ?? record._id ?? i) as string | number;
        // No columns declared: the record's display name, as the gallery's
        // card heading reads it, and no second line.
        const first = primary ? cell(record, primary) : null;
        const firstContent = first ?? getRecordDisplayName(objectDef, record);
        const second = secondary ? cell(record, secondary) : null;
        return (
          <li key={String(id)} data-testid="list-compact-row">
            <button
              type="button"
              className={cn(
                'flex w-full min-w-0 flex-col items-start gap-0.5 px-3 py-2 text-left',
                'hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none',
              )}
              onClick={(e) => {
                // A link inside a cell (an email, a URL) is its own click.
                if ((e.target as HTMLElement).closest('a')) return;
                onRowClick?.(record);
              }}
            >
              <span className="w-full min-w-0 truncate text-sm text-foreground" data-testid="list-compact-primary">
                {firstContent}
              </span>
              {second != null && (
                <span
                  className="w-full min-w-0 truncate text-xs text-muted-foreground [&_*]:!text-xs"
                  data-testid="list-compact-secondary"
                >
                  {second}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
