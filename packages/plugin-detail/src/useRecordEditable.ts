/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Is THIS record editable by the current user? (objectstack#3821)
 *
 * Object-level permissions can't answer that. A record shared read-only via a
 * sharing rule sits inside an object the user may otherwise create and edit
 * freely — so the header offered a primary "Edit" CTA that opened the form, let
 * the user retype a field, and only then bounced with a 403. The server is the
 * authority (the framework's ADR-0124 D1 — server enforces, client is
 * courtesy) and stays so; this is the courtesy check that stops the UI from
 * inviting a write it knows will fail.
 *
 * The answer comes from the explain engine's record-grained verdict
 * (`POST /api/v1/security/explain` with a `recordId`, ADR-0090 D6 / ADR-0095
 * C2) — the same pipeline the enforcement middleware runs, so the button and
 * the server can't disagree. Explaining ONESELF needs no special permission;
 * only explaining another principal does.
 *
 * **Fail-open on every uncertainty** — no answer yet, a non-OK response, a
 * deployment without `@objectstack/plugin-security` (501), a split SPA origin
 * where the cookie doesn't reach the API: the button stays enabled and the
 * server does its job. A permission hint must never be the reason a permitted
 * user cannot act.
 *
 * The probe rides the host's AUTHENTICATED fetch (`SchemaRendererProvider`'s
 * `apiFetch`, the same channel `provider: 'api'` view sources use), not the bare
 * global one. A bearer-token session carries its credential in the
 * `Authorization` header, not a cookie, so `credentials: 'include'` alone made
 * every probe 401 on a perfectly valid admin session — the verdict then always
 * failed open and this hook was dead weight in exactly the deployments it was
 * written for (framework#3923 ②). Cookies stay on for cookie-session hosts.
 */
import * as React from 'react';
import {
  SchemaRendererContext,
  dataChangeMatches,
  subscribeDataChanges,
  useDataInvalidation,
  type DataChange,
} from '@object-ui/react';
import { usePermissions } from '@object-ui/permissions';

/**
 * Cache keyed by `[principal, object, recordId, operation]` so revisiting a
 * record is free — and so a verdict is only ever reused for the principal it
 * was computed FOR (objectui#10107).
 *
 * The principal used to be absent from the key, and this map lives at module
 * scope, so it outlives every unmount for the life of the tab. Signing out does
 * not end that life: `AuthProvider.signOut` never reloads the page (it purges
 * the per-tab storage caches by hand precisely because it does not), and this
 * map was not among what it purged. So the next principal to sign in in the
 * same tab was answered from the previous principal's verdicts — and answered
 * SYNCHRONOUSLY, as the initial state below, so no probe was sent and no later
 * answer could correct it.
 *
 * Both fail directions were reachable, and the second is the worse one:
 *
 *  - a `false` computed for someone else hid Edit from a user who holds a
 *    record-level `edit` share, for the rest of the tab's life, while `PATCH`
 *    on that record succeeded;
 *  - a `true` computed for a privileged principal offered Edit to one holding
 *    no grant — the UI inviting a write the server refuses.
 *
 * The key is an array rather than a delimited string so that no user id can
 * spell another key by containing the delimiter, and so "principal unknown"
 * (`null`) is a value of its own rather than a reserved word a user id could
 * collide with.
 *
 * A verdict is also only reused until the record it answers CHANGES
 * (objectui#10184) — see {@link forgetChangedRecords}.
 */
const verdictCache = new Map<string, boolean>();

/** What a {@link verdictCache} key spells, in order. */
type VerdictKey = [principal: string | null, object: string, recordId: string, operation: RecordOperation];

/**
 * A probe on its way to the explain engine, and the records a data change has
 * staled since it left. An answer computed before the change answers a
 * question this hook is no longer asking, so it is neither cached nor shown.
 * Without this, a probe in flight when its record changed would write the
 * pre-change verdict back into the map right after the change cleared it.
 */
interface InFlightProbe {
  readonly object: string;
  readonly recordIds: readonly string[];
  readonly staled: Set<string>;
}

const inFlight = new Set<InFlightProbe>();

/**
 * Drop every verdict a data change has made stale (objectui#10184).
 *
 * The verdict is a fact about the record as well as about the principal:
 * moving `owner_id`, or any write the server's sharing rules read, can turn a
 * `false` into a `true` or the reverse for the SAME principal. Keyed on the
 * principal alone, the map kept answering from before the change — the
 * record's own owner re-opening the page in the same tab after taking
 * ownership was still told no, and a principal who had just given a record
 * away was still offered Edit on it.
 *
 * So the map listens to the data-invalidation bus the writers already
 * announce on, and forgets exactly what a change stales, by the bus's OWN
 * matching rule (`dataChangeMatches`): a record-scoped change drops that
 * record's entries, every operation; an object-scoped change drops the
 * object's; `'*'` drops everything. A mounted hook then asks again through
 * {@link useDataInvalidation} — a refetch in place, never a remount
 * (AGENTS.md #8). The map only ever holds the current principal's entries
 * (see {@link retainForPrincipal}), so this clears the affected record for
 * that principal and for no one else.
 *
 * ⚠️ What this does NOT make fresh. Both are limits of the channel, not
 * oversights, and neither is papered over with a lifetime constant:
 *
 *  - The bus carries writes THIS tab announces: every write through the
 *    host's `DataSource` (via `useMutationInvalidationBridge`), plus the
 *    manual `notifyDataChanged` calls of writes that bypass it. A grant or a
 *    revocation made in another tab, by another user, or by the server on its
 *    own is never announced here, so it lands on the next page load. (Accepted
 *    when this route was ruled, objectui#10107 ACCEPT.)
 *  - A change is named by the object that was WRITTEN. A grant stored as a
 *    row of a different object — a record-share row, a permission-set
 *    assignment — is announced, when it is announced at all, against THAT
 *    object and not against the record it grants, so it does not match this
 *    record's entries either, and it too lands on the next page load.
 *
 * Module scope on purpose, like the map it guards: an entry must be dropped
 * even while no hook is mounted to hear the change, or the next mount would
 * adopt it synchronously as its initial state.
 */
function forgetChangedRecords(change: DataChange): void {
  for (const key of Array.from(verdictCache.keys())) {
    const [, object, recordId] = JSON.parse(key) as VerdictKey;
    if (dataChangeMatches(change, object, recordId)) verdictCache.delete(key);
  }
  for (const probe of inFlight) {
    for (const id of probe.recordIds) {
      if (dataChangeMatches(change, probe.object, id)) probe.staled.add(id);
    }
  }
}

subscribeDataChanges(forgetChangedRecords);

/**
 * The principal every live entry in {@link verdictCache} was computed for.
 *
 * The key alone already makes another principal's entry unreachable. This adds
 * the half a key cannot express: entries written while the client did not yet
 * know who it was (a provider mounted but `/me/permissions` still in flight
 * publishes `userId: null`) are keyed `null`, and a LATER unknown window — the
 * one between a sign-out and the next sign-in in the same tab — would key to
 * that same `null`. Dropping the map whenever the client's notion of the
 * principal changes means no entry can ever span such a change, which is the
 * property `purgeSignedOutClientCaches` gives the storage-backed caches.
 *
 * `undefined` is "nothing observed yet" and is distinct from a `null`
 * principal, so the first observation does not count as a change.
 */
let cachedPrincipal: string | null | undefined;

/** Drop everything if the acting principal is not the one the map was built for. */
function retainForPrincipal(principal: string | null): void {
  if (cachedPrincipal !== undefined && cachedPrincipal !== principal) verdictCache.clear();
  cachedPrincipal = principal;
}

export type RecordOperation = 'update' | 'delete';

export function useRecordEditable(
  objectName: string | undefined,
  recordId: string | undefined,
  operation: RecordOperation = 'update',
  enabled = true,
): boolean {
  // [objectui#5683] The acting user, or `null` when the client has no answer —
  // a standalone embed with no provider, an anonymous session, or a load still
  // in flight. `usePermissions()` degrades to the no-provider value rather than
  // throwing, so this stays safe on the standalone `detail:view` embed the
  // context read below is written for. This is NOT a second permission source:
  // the verdict still comes from the explain engine alone. It is the identity
  // that verdict belongs to.
  const principal = usePermissions().userId;
  const key =
    objectName && recordId
      ? JSON.stringify([principal, objectName, recordId, operation] satisfies VerdictKey)
      : '';
  // [objectui#10184] Bumps when a change announced on the bus stales THIS
  // record (the same match `forgetChangedRecords` drops its entries by), so a
  // mounted header asks again in place.
  const invalidationNonce = useDataInvalidation(objectName, recordId);
  const [allowed, setAllowed] = React.useState<boolean>(() =>
    key && verdictCache.has(key) ? verdictCache.get(key)! : true,
  );
  // Read the context directly (not `useSchemaContext`, which throws when no
  // provider is mounted): a standalone `detail:view` embed has no host fetch
  // and must still degrade to the global one rather than crash the render.
  const apiFetch = React.useContext(SchemaRendererContext)?.apiFetch;

  React.useEffect(() => {
    retainForPrincipal(principal);
    if (!enabled || !objectName || !recordId) {
      setAllowed(true);
      return;
    }
    if (verdictCache.has(key)) {
      setAllowed(verdictCache.get(key)!);
      return;
    }
    // No answer for THIS key yet. Whatever is on screen was computed for a
    // different key — another record, another operation, or (objectui#10107)
    // another principal — or for this key before the record changed
    // (objectui#10184), and holding it across the round trip is the same
    // reuse the cache now forbids, just without the map. An unanswered
    // question fails open, as every other uncertainty in this hook does.
    setAllowed(true);
    let cancelled = false;
    const probe: InFlightProbe = { object: objectName, recordIds: [recordId], staled: new Set() };
    inFlight.add(probe);
    (async () => {
      try {
        const doFetch = apiFetch ?? fetch;
        const res = await doFetch('/api/v1/security/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ object: objectName, operation, recordId }),
        });
        if (!res.ok) return; // 401 / 403 / 501 → fail open
        const decision = await res.json();
        const verdict = decision?.record?.visible;
        if (typeof verdict !== 'boolean') return; // no record verdict → fail open
        if (probe.staled.size > 0) return; // asked before the record changed → not an answer
        verdictCache.set(key, verdict);
        if (!cancelled) setAllowed(verdict);
      } catch {
        /* network/parse failure → fail open */
      } finally {
        inFlight.delete(probe);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, principal, objectName, recordId, operation, enabled, apiFetch, invalidationNonce]);

  return allowed;
}

/** Test seam — drops the memoised verdicts AND the principal they were for. */
export function __clearRecordEditableCache(): void {
  verdictCache.clear();
  cachedPrincipal = undefined;
}
