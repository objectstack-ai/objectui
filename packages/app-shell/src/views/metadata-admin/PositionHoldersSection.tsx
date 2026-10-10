/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * PositionHoldersSection — who holds a position, on the Setup catalog's
 * position page (objectui#7611, ADR-0131 D3/D4).
 *
 * The position's DEFINITION is the registry's and is edited above this section
 * by whoever may author it. Holding a position is something else: an
 * assignment, a `sys_user_position` row of the caller's own organization,
 * which names the position BY NAME (`position` stores the machine name). So
 * this section is an ordinary data page over that object — the same reads and
 * writes the generic assignment page makes — and the server decides who may
 * add or remove a holder, under every posture (under a wall a tenant
 * administrator assigns what the operator defined).
 *
 * The shape follows `AssignedUsersSection` (a permission set's holders):
 * people first, add through `RecordPickerDialog`, remove per row. A refusal is
 * shown in the server's own words — notably the one a position still answers
 * when it has a definition but no catalog row (measured on objectstack
 * `main`: the assignment door looks the name up in `sys_position`), which this
 * page must not paper over.
 */

import * as React from 'react';
import { Button } from '@object-ui/components';
import { RecordPickerDialog } from '@object-ui/fields';
import { useAdapter } from '@object-ui/react';
import { AlertCircle, Loader2, Plus, UserCheck, X } from 'lucide-react';
import { useMetadataLocale } from './i18n.js';

export interface PositionHoldersSectionProps {
  /** The position's machine name. */
  name: string;
}

interface HolderRow {
  /** The `sys_user_position` row — the assignment this page removes. */
  assignmentId: string;
  userId: string;
  label: string;
  email: string;
}

/** The assignment object, and the column that names the position. */
const USER_POSITION_OBJECT = 'sys_user_position';
const USER_POSITION_NAME_FIELD = 'position';

/** Rows of a `find()` answer, read as `QueryResult` declares them (`data`). */
const asArray = (res: any): any[] => (Array.isArray(res) ? res : res?.data ?? []);

const personLabel = (u: any): string =>
  u?.full_name || u?.name || u?.display_name || u?.email || String(u?.id ?? '');

/** The server's own sentence out of a refused write, else the fallback. */
function refusalText(err: any, fallback: string): string {
  const raw = String(err?.body?.error ?? err?.error ?? err?.message ?? '').trim();
  return raw || fallback;
}

function useCopy() {
  const zh = useMetadataLocale() === 'zh-CN';
  return React.useMemo(
    () =>
      zh
        ? {
            title: '岗位持有人',
            add: '添加持有人',
            remove: '移除',
            empty: '还没有人持有此岗位。',
            loading: '加载中…',
            pickTitle: '选择要分配此岗位的用户',
            addFailed: '分配失败，请重试。',
            removeFailed: '移除失败，请重试。',
            loadFailed: '无法读取岗位持有人。',
          }
        : {
            title: 'Position holders',
            add: 'Add holder',
            remove: 'Remove',
            empty: 'Nobody holds this position yet.',
            loading: 'Loading…',
            pickTitle: 'Select users to assign this position to',
            addFailed: 'Failed to assign. Please try again.',
            removeFailed: 'Failed to remove. Please try again.',
            loadFailed: 'Could not read the holders of this position.',
          },
    [zh],
  );
}

export function PositionHoldersSection({ name }: PositionHoldersSectionProps): React.ReactElement {
  const adapter = useAdapter() as any;
  const c = useCopy();
  const [rows, setRows] = React.useState<HolderRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!adapter) return;
    setLoading(true);
    try {
      const assignments = asArray(
        await adapter.find(USER_POSITION_OBJECT, {
          $filter: { [USER_POSITION_NAME_FIELD]: name },
          $top: 1000,
        }),
      );
      const userIds = [...new Set(assignments.map((a: any) => a?.user_id).filter(Boolean).map(String))];
      const users = userIds.length
        ? asArray(await adapter.find('sys_user', { $filter: { id: { $in: userIds } }, $top: 1000 }))
        : [];
      const byId = new Map(users.map((u: any) => [String(u.id), u]));
      setRows(
        assignments
          .filter((a: any) => a?.id != null && a?.user_id != null)
          .map((a: any) => {
            const u = byId.get(String(a.user_id));
            return {
              assignmentId: String(a.id),
              userId: String(a.user_id),
              label: u ? personLabel(u) : String(a.user_id),
              email: u?.email ?? '',
            };
          }),
      );
    } catch (err: any) {
      setRows([]);
      setError(refusalText(err, c.loadFailed));
    } finally {
      setLoading(false);
    }
  }, [adapter, name, c]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const held = React.useMemo(() => new Set(rows.map((r) => r.userId)), [rows]);

  const addHolders = React.useCallback(
    async (records: any[]) => {
      setBusy(true);
      setError(null);
      try {
        for (const u of records || []) {
          const uid = u?.id != null ? String(u.id) : null;
          if (!uid || held.has(uid)) continue;
          // By NAME: the assignment names the catalog item (ADR-0131 D4).
          await adapter.create(USER_POSITION_OBJECT, { user_id: uid, [USER_POSITION_NAME_FIELD]: name });
        }
        await load();
      } catch (err: any) {
        setError(refusalText(err, c.addFailed));
      } finally {
        setBusy(false);
        setPickerOpen(false);
      }
    },
    [adapter, name, held, load, c],
  );

  const removeHolder = React.useCallback(
    async (assignmentId: string) => {
      setError(null);
      try {
        await adapter.delete(USER_POSITION_OBJECT, assignmentId);
        await load();
      } catch (err: any) {
        setError(refusalText(err, c.removeFailed));
      }
    },
    [adapter, load, c],
  );

  return (
    <div className="mt-6 rounded-md border" data-testid="position-holders">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2 text-sm font-medium">
          <UserCheck className="h-4 w-4 text-muted-foreground" />
          <span>{c.title}</span>
          {!loading && <span className="text-xs text-muted-foreground font-normal">{rows.length}</span>}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={busy || !adapter}
          onClick={() => {
            setError(null);
            setPickerOpen(true);
          }}
          className="gap-1 h-8 text-xs"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          {c.add}
        </Button>
      </div>
      <div className="px-4 py-3">
        {error && (
          <div
            className="mb-3 flex items-start gap-2 rounded-md border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-200"
            role="alert"
          >
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {c.loading}
          </div>
        ) : rows.length === 0 ? (
          <div className="text-xs text-muted-foreground italic py-2">{c.empty}</div>
        ) : (
          <ul className="divide-y rounded-md border">
            {rows.map((r) => (
              <li key={r.assignmentId} className="flex items-center gap-3 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate">{r.label}</div>
                  {r.email && r.email !== r.label && (
                    <div className="text-xs text-muted-foreground truncate">{r.email}</div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void removeHolder(r.assignmentId)}
                  aria-label={c.remove}
                  title={c.remove}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {adapter && (
        <RecordPickerDialog
          open={pickerOpen}
          onOpenChange={(o: boolean) => setPickerOpen(o)}
          multiple
          dataSource={adapter}
          objectName="sys_user"
          title={c.pickTitle}
          onSelect={() => {}}
          onSelectRecords={(records: any[]) => void addHolders(records)}
        />
      )}
    </div>
  );
}

export default PositionHoldersSection;
