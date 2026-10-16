/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * AssignedUsersSection — "Manage Assignments" for a permission set.
 *
 * The admin's mental model is "who holds this role / AI seat" — so this is a
 * people-first list (name + email + remove), not a raw junction table. It reads
 * `sys_user_permission_set` for the set, resolves each `user_id` to a real
 * person, and uses the reusable `RecordPickerDialog` to assign more. Server-side
 * rules on the junction insert (e.g. the AI-seat cap) are caught and shown as a
 * friendly, localized inline message — not a raw developer error.
 *
 * ## By name, against the registry (objectui#7611, ADR-0131 D3/D4/D10)
 *
 * The set is addressed by its machine NAME throughout, and no
 * `sys_permission_set` row is read or written:
 *
 *  - direct grants are the `sys_user_permission_set` rows whose `permission_set`
 *    column names the set — the by-name column the platform's grant readers
 *    key on (a grant with no name grants nothing through them);
 *  - ADD writes a grant by name alone, `{ user_id, permission_set }`. The set is
 *    the security catalog's definition of that name, so a set with no catalog
 *    row is granted like any other. The grant's legacy `permission_set_id`
 *    column is never written: no writer fills it and the server derives
 *    nothing from it (objectstack ADR-0131 D10, stage 6b-2-pre). A name the
 *    catalog does not hold is refused by the server (`400 VALIDATION_FAILED`,
 *    `reference_not_found` at `permission_set`), and the refusal is shown in
 *    the server's own words;
 *  - REMOVE deletes the direct grant's own row, by its id;
 *  - the positions that distribute the set are the registry's `position`
 *    definitions whose `permissionSets` list names it (ADR-0131 D4 — the
 *    binding is part of the position's definition), read through the console's
 *    metadata store, never `sys_position_permission_set` / `sys_position` rows.
 *
 * Permission-set-agnostic: every role gets the same UI, and the AI seat
 * (`ai_seat`) is just one of them. The generic add-by-picker engine (spec
 * RecordRelatedListProps.add) powers the capability; this is the polished
 * surface for the high-value case.
 *
 * ## Who may change the holders (objectui#12082)
 *
 * ADD and REMOVE are offered only where the caller holds the grant the server
 * asks of them, on the grant object itself — see {@link GRANT_OBJECT} and the
 * gate in the component. Listing the holders asks only to read, so a caller
 * who may read but not write the grants sees the list with no Add and no
 * Remove, and an empty list that does not tell them to click Add.
 */

import * as React from 'react';
import { Button } from '@object-ui/components';
import { resolveAffordance, type SchemaLike } from '@object-ui/core';
import { RecordPickerDialog } from '@object-ui/fields';
import { usePermissions } from '@object-ui/permissions';
import { useAdapter, useMetadata } from '@object-ui/react';
import { Plus, X, Users, Loader2, AlertCircle } from 'lucide-react';
import { useMetadataLocale } from './i18n.js';

/** The object a permission set's direct grants are rows of: ADD creates one, REMOVE deletes one. */
const GRANT_OBJECT = 'sys_user_permission_set';

export interface AssignedUsersSectionProps {
  /** The permission set's machine name (e.g. `ai_seat`, `admin_full_access`). */
  permissionSetName: string;
}

interface AssignedRow {
  /** Junction row id for DIRECT grants; position-held rows are not removable here. */
  grantId: string | null;
  userId: string;
  name: string;
  email: string;
  /** How the user holds the set: a direct grant, or via one or more positions. */
  via: Array<{ kind: 'direct' } | { kind: 'position'; position: string }>;
}

/**
 * Minimal locale-aware copy (zh vs everything-else) — keeps the surface in the user's language.
 *
 * The empty state is two sentences: `empty` says nobody holds the set, and
 * `emptyAddHint` tells the reader to click Add, so it is said only where the
 * Add button is offered (`canAdd`, in the component). `sentenceGap` joins
 * them: a space in English, none after a CJK full stop.
 */
function useCopy() {
  const zh = useMetadataLocale() === 'zh-CN';
  return React.useMemo(
    () =>
      zh
        ? {
            title: '已分配用户',
            add: '添加用户',
            remove: '移除',
            empty: '还没有分配任何用户。',
            emptyAddHint: '点击「添加用户」来分配。',
            sentenceGap: '',
            loading: '加载中…',
            pickTitle: '选择要分配的用户',
            seatFull: (n: number) =>
              'AI 席位已用完(' + n + '/' + n + ')。请先移除一个用户,或在许可证中提升席位上限,再分配新用户。',
            addFailed: '分配失败,请重试。',
            countOf: (n: number) => n + ' 人',
            direct: '直授',
            viaPosition: (p: string) => '经岗位 ' + p,
            everyoneNote: '已绑定到 everyone 锚点 — 所有登录成员都持有此权限集。',
            positionHeldHint: '经岗位持有 — 在岗位的指派中移除。',
          }
        : {
            title: 'Assigned Users',
            add: 'Add user',
            remove: 'Remove',
            empty: 'No users assigned yet.',
            emptyAddHint: 'Click "Add user" to assign.',
            sentenceGap: ' ',
            loading: 'Loading…',
            pickTitle: 'Select users to assign',
            seatFull: (n: number) =>
              'All ' + n + ' AI seat(s) are in use. Remove a user or raise the license cap before assigning another.',
            addFailed: 'Failed to assign. Please try again.',
            countOf: (n: number) => String(n),
            direct: 'direct',
            viaPosition: (p: string) => 'via position ' + p,
            everyoneNote: 'Bound to the everyone anchor — every signed-in member holds this set.',
            positionHeldHint: 'Held via a position — remove it on the position’s assignments.',
          },
    [zh],
  );
}

/**
 * The rows of a `find()` answer, read as `QueryResult` declares them.
 *
 * `QueryResult` (`@object-ui/types`) declares exactly one rows member: `data`.
 * This reader used to try `records` and `items` FIRST and only then `data`
 * (objectui#5945) — two spellings the contract does not define, tried ahead of
 * the one it does. Measured across this repo, nothing produces either at this
 * seam: `ObjectStackAdapter.normalizeQueryResult` maps the server's `records`
 * envelope to `data` before returning, and `items` has no producer at all.
 * Accepting them anyway is AGENTS.md #0.1 — a tolerant reader that would let a
 * non-conforming producer (a raw SDK client handed in where a `DataSource`
 * belongs) keep working, so the wrong shape is never rejected anywhere and
 * becomes a second de-facto contract. Do not add spellings back: fix the
 * producer.
 *
 * The bare-array arm stays because it is LIVE — fakes at this seam answer with
 * a plain array (see `AssignedUsersSection.test.tsx`).
 */
const asArray = (res: any): any[] =>
  Array.isArray(res) ? res : res?.data ?? [];

const personLabel = (u: any): string =>
  u?.full_name || u?.name || u?.display_name || u?.email || String(u?.id ?? '');

/** The audience anchors: implicit memberships, noted rather than enumerated. */
const ANCHOR_POSITIONS = new Set(['everyone', 'guest']);

/**
 * The positions whose DEFINITION distributes `setName` — its `permissionSets`
 * list names the set (ADR-0131 D4; `PositionSchema.permissionSets`).
 */
export function positionsDistributing(positions: readonly unknown[], setName: string): string[] {
  const out: string[] = [];
  for (const raw of positions) {
    const p = raw as { name?: unknown; permissionSets?: unknown } | null;
    if (typeof p?.name !== 'string' || !p.name) continue;
    if (Array.isArray(p.permissionSets) && p.permissionSets.includes(setName)) out.push(p.name);
  }
  return out;
}

export function AssignedUsersSection({ permissionSetName }: AssignedUsersSectionProps) {
  const adapter = useAdapter() as any;
  const c = useCopy();

  const metadataStore = useMetadata();
  // Read through a ref: the store's context value is rebuilt whenever any
  // cached type settles, and AGENTS.md #10 forbids keying `load` on it.
  const metadataStoreRef = React.useRef(metadataStore);
  metadataStoreRef.current = metadataStore;
  const [rows, setRows] = React.useState<AssignedRow[]>([]);
  const [everyoneBound, setEveryoneBound] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  /**
   * May the caller add or remove a holder? Each is a write of a
   * {@link GRANT_OBJECT} row, so each reads its row of the affordance-to-grant
   * map (`resolveAffordance` in `@object-ui/core`), asked of that object with
   * its schema as the registry serves it: ADD creates a junction row under the
   * set, the `relatedNew` row a related list's Add existing reads; REMOVE
   * deletes one, the `relatedRowDelete` row a related list row's Delete reads.
   *
   * Setup's own gate is not this one. The Setup app asks `setup.access`, and
   * a caller can hold it while the server refuses their write of a grant row
   * at its object CRUD step — objectstack's shipped organization administrator
   * set is such a caller (that repo's pin `organization_admin is read-only on
   * global RBAC tables to prevent privilege escalation`). So a closed row
   * withholds its affordance: the Add button and the picker it opens, each
   * row's Remove. With no permission provider every grant reads open, as
   * before.
   */
  const perms = usePermissions();
  const grantSource = {
    objectSchema: ((metadataStore.objects ?? []).find((o) => (o as { name?: unknown } | null)?.name === GRANT_OBJECT) ??
      null) as SchemaLike | null,
    objectName: GRANT_OBJECT,
    perms,
  };
  const canAdd = resolveAffordance('relatedNew', grantSource).allowed;
  const canRemove = resolveAffordance('relatedRowDelete', grantSource).allowed;

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      // Direct grants, by the set's NAME.
      const grants = asArray(
        await adapter.find(GRANT_OBJECT, { $filter: { permission_set: permissionSetName }, $top: 500 }),
      );

      // Effective holders = direct grants ∪ holders of every position that
      // distributes the set (objectui#2382). In the ADR-0090 model positions
      // are THE distribution channel — a direct-grants-only list told the
      // admin "0 users" for any normally-administered set.
      let positionNames: string[] = [];
      let boundEveryone = false;
      try {
        const positions = await metadataStoreRef.current.ensureType('position');
        const names = positionsDistributing(positions, permissionSetName);
        // The audience anchors are implicit memberships — `everyone` is every
        // signed-in member; enumerating them as rows would be noise. Surface
        // a note instead and expand only the explicit positions.
        boundEveryone = names.includes('everyone');
        positionNames = names.filter((n) => !ANCHOR_POSITIONS.has(n));
      } catch {
        /* position expansion is additive — direct grants still render */
      }

      const assignments = positionNames.length
        ? asArray(
            await adapter.find('sys_user_position', { $filter: { position: { $in: positionNames } }, $top: 1000 }),
          )
        : [];

      const viaByUser = new Map<string, AssignedRow['via']>();
      const grantIdByUser = new Map<string, string>();
      for (const g of grants) {
        if (!g?.user_id) continue;
        const uid = String(g.user_id);
        grantIdByUser.set(uid, String(g.id));
        viaByUser.set(uid, [...(viaByUser.get(uid) ?? []), { kind: 'direct' as const }]);
      }
      for (const a of assignments) {
        if (!a?.user_id || !a?.position) continue;
        const uid = String(a.user_id);
        viaByUser.set(uid, [...(viaByUser.get(uid) ?? []), { kind: 'position' as const, position: String(a.position) }]);
      }

      const userIds = [...viaByUser.keys()];
      const users = userIds.length
        ? asArray(await adapter.find('sys_user', { $filter: { id: { $in: userIds } }, $top: 1000 }))
        : [];
      const byId = new Map(users.map((u: any) => [String(u.id), u]));
      setRows(
        userIds.map((uid) => {
          const u = byId.get(uid);
          return {
            grantId: grantIdByUser.get(uid) ?? null,
            userId: uid,
            name: u ? personLabel(u) : uid,
            email: u?.email ?? '',
            via: viaByUser.get(uid) ?? [],
          };
        }),
      );
      setEveryoneBound(boundEveryone);
    } catch {
      setRows([]);
      setEveryoneBound(false);
    } finally {
      setLoading(false);
    }
  }, [adapter, permissionSetName]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const assignedIds = React.useMemo(() => new Set(rows.map((r) => r.userId)), [rows]);

  const addUsers = React.useCallback(
    async (records: any[]) => {
      setBusy(true);
      setError(null);
      try {
        for (const u of records || []) {
          const uid = u?.id != null ? String(u.id) : null;
          if (!uid || assignedIds.has(uid)) continue;
          // By name alone: no catalog row is read and no legacy
          // `permission_set_id` is written (module doc).
          await adapter.create(GRANT_OBJECT, {
            user_id: uid,
            permission_set: permissionSetName,
          });
        }
        await load();
      } catch (err: any) {
        const raw = String(err?.body?.error ?? err?.error ?? err?.message ?? '');
        const capMatch = raw.match(/(\d+)\s*of\s*(\d+)\s*seat/i);
        if (/cap reached|seat cap|ai[-_ ]?seat/i.test(raw)) {
          setError(c.seatFull(capMatch ? Number(capMatch[2]) : rows.length));
        } else {
          const cleaned = raw.replace(/^\s*\[[^\]]*\]\s*/, '').trim();
          setError(cleaned || c.addFailed);
        }
      } finally {
        setBusy(false);
        setPickerOpen(false);
      }
    },
    [adapter, permissionSetName, assignedIds, load, rows.length, c],
  );

  const removeUser = React.useCallback(
    async (grantId: string) => {
      setError(null);
      try {
        await adapter.delete(GRANT_OBJECT, grantId);
        await load();
      } catch {
        /* keep the row; a failed delete is non-destructive */
      }
    },
    [adapter, load],
  );

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{c.title}</span>
          {!loading && (
            <span className="text-xs text-muted-foreground font-normal">{c.countOf(rows.length)}</span>
          )}
        </div>
        {canAdd && (
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => {
              setError(null);
              setPickerOpen(true);
            }}
            className="gap-1 h-8 text-xs"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {c.add}
          </Button>
        )}
      </div>

      {error && (
        <div
          className="mb-3 flex items-start gap-2 rounded-md border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-200"
          role="alert"
        >
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {everyoneBound && (
        <div className="mb-3 flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{c.everyoneNote}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {c.loading}
        </div>
      ) : rows.length === 0 ? (
        !everyoneBound && (
          <div className="text-xs text-muted-foreground italic py-3">
            {/* The click-Add sentence names a button only `canAdd` renders. */}
            {canAdd ? c.empty + c.sentenceGap + c.emptyAddHint : c.empty}
          </div>
        )
      ) : (
        <ul className="divide-y rounded-md border">
          {rows.map((r) => (
            <li key={r.userId} className="flex items-center gap-3 px-3 py-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                {(r.name || '?').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm truncate">{r.name}</span>
                  {r.via.map((v, i) => (
                    <span
                      key={i}
                      className="shrink-0 rounded border bg-muted/40 px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground"
                    >
                      {v.kind === 'direct' ? c.direct : c.viaPosition(v.position)}
                    </span>
                  ))}
                </div>
                {r.email && r.email !== r.name && (
                  <div className="text-xs text-muted-foreground truncate">{r.email}</div>
                )}
              </div>
              {r.grantId ? (
                // A direct grant: removable only where the delete grant on
                // the grant object is held (`canRemove`, above).
                canRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void removeUser(r.grantId!)}
                    aria-label={c.remove}
                    title={c.remove}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )
              ) : (
                <span className="shrink-0 text-[10px] text-muted-foreground/70" title={c.positionHeldHint}>
                  —
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {canAdd && (
        <RecordPickerDialog
          open={pickerOpen}
          onOpenChange={(o: boolean) => setPickerOpen(o)}
          multiple
          dataSource={adapter}
          objectName="sys_user"
          title={c.pickTitle}
          onSelect={() => {}}
          onSelectRecords={(records: any[]) => void addUsers(records)}
        />
      )}
    </div>
  );
}

export default AssignedUsersSection;
