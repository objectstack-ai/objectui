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
import { SchemaRendererContext } from '@object-ui/react';
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
 */
const verdictCache = new Map<string, boolean>();

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
      ? JSON.stringify([principal, objectName, recordId, operation])
      : '';
  const [allowed, setAllowed] = React.useState<boolean>(() =>
    key && verdictCache.has(key) ? verdictCache.get(key)! : true,
  );
  // Read the context directly (not `useSchemaContext`, which throws when no
  // provider is mounted): a standalone `detail:view` embed has no host fetch
  // and must still degrade to the global one rather than crash the render.
  const apiFetch = React.useContext(SchemaRendererContext)?.apiFetch;

  React.useEffect(() => {
    retainForPrincipal(principal);
    if (!enabled || !key) {
      setAllowed(true);
      return;
    }
    if (verdictCache.has(key)) {
      setAllowed(verdictCache.get(key)!);
      return;
    }
    // No answer for THIS key yet. Whatever is on screen was computed for a
    // different key — another record, another operation, or (objectui#10107)
    // another principal — and holding it across the round trip is the same
    // reuse the cache key now forbids, just without the map. An unanswered
    // question fails open, as every other uncertainty in this hook does.
    setAllowed(true);
    let cancelled = false;
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
        verdictCache.set(key, verdict);
        if (!cancelled) setAllowed(verdict);
      } catch {
        /* network/parse failure → fail open */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, principal, objectName, recordId, operation, enabled, apiFetch]);

  return allowed;
}

/** Test seam — drops the memoised verdicts AND the principal they were for. */
export function __clearRecordEditableCache(): void {
  verdictCache.clear();
  cachedPrincipal = undefined;
}
