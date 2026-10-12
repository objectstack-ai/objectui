/**
 * ObjectStack-backed `UserDataAdapter` factory.
 *
 * Persists arbitrary per-user UI state (favorites, recently-accessed items, …)
 * as a single JSON blob per `(user_id, key)` row in the **unified per-user
 * KV store** — the `sys_user_preference` object shipped by every
 * `@objectstack/plugin-auth`-enabled environment.
 *
 * Using the existing `sys_user_preference` table (rather than a parallel
 * `user_app_state` table) keeps things consistent with the platform's
 * "one KV store per scope" pattern:
 *
 *   - `sys_setting`         ← tenant / env scope
 *   - `sys_user_preference` ← per-user scope  ← we live here
 *
 * Callers are encouraged to namespace their keys (e.g. `ui.favorites`,
 * `ui.recent`, `ui.grid.account.state`) so explicit settings (`theme`,
 * `locale`) and machine-written UI traces stay easy to tell apart.
 *
 * ## Schema this adapter expects
 *
 * The canonical `sys_user_preference` schema (from
 * `@objectstack/platform-objects`):
 *
 * ```yaml
 * object: sys_user_preference
 * fields:
 *   user_id:    lookup(sys_user)  # indexed
 *   key:        string            # indexed  (e.g. "ui.favorites")
 *   value:      json              # the serialised list
 *   updated_at: datetime          # auto-managed
 * unique: [user_id, key]
 * ```
 *
 * ## Failure modes
 *
 * The adapter is designed to **degrade silently**. Any error — missing
 * schema, 4xx/5xx, network — is caught:
 *
 * - `load()` returns `[]`, so the hosting provider keeps its localStorage state.
 * - `save()` resolves without throwing, so UI mutations never surface a toast.
 *
 * As soon as the backend supports `sys_user_preference`, persistence
 * "lights up" with no code change.
 *
 * ## One read per load (objectui#12187)
 *
 * The console builds one adapter per slot (favorites, recent items, flow
 * palette recents) over the same data source and user, and their providers
 * call `load()` in the same effects pass. Those loads share ONE request: the
 * first `load()` opens a read for its (data source, resource, user), every
 * `load()` of that scope issued before the next microtask adds its key to it,
 * and the read is then sent once and each adapter takes its own row from the
 * answer. A read that collected one key sends the per-key query this adapter
 * always sent; several keys go as one `key in (...)` query.
 *
 * Nothing is kept past that: the read closes the moment it is sent, so a later
 * `load()` (a new adapter after a language or account switch) asks the server
 * again, and a different user or data source never joins another's read.
 * `save()` does not use it: a write still finds and writes its own row.
 *
 * @module
 */

import type { DataSource, QueryParams } from '@object-ui/types';

export interface ObjectStackUserStateAdapterOptions {
  /** Connected data source (usually the one provided by `<AdapterProvider>`). */
  dataSource: DataSource<any>;
  /** Authenticated user id. */
  userId: string;
  /**
   * Storage key. Should be a dotted, namespaced string so UI traces
   * don't collide with user-facing preferences. Examples:
   * `ui.favorites`, `ui.recent`, `ui.grid.account.state`.
   */
  key: string;
  /** Override the storage object name. Defaults to `"sys_user_preference"`. */
  resource?: string;
  /**
   * Optional console logger for development diagnostics. Defaults to noop so
   * production builds stay quiet.
   */
  onError?: (where: 'load' | 'save', error: unknown) => void;
}

/**
 * Generic persistence adapter for a user-scoped list.
 *
 * Implementations must be safe to call concurrently and should *never*
 * throw — failures should be swallowed so the hosting provider can degrade
 * to localStorage-only mode without crashing the UI.
 *
 * This is the one declaration of the name: `@object-ui/app-shell`'s
 * `UserStateAdaptersProvider` injects adapters of this type and re-exports it
 * (objectui#6349, batch 9).
 */
export interface UserDataAdapter<T> {
  /** Load the persisted list for the current user. Resolve to [] when absent. */
  load(): Promise<T[]>;
  /** Persist the full list (debounced upstream). Errors are silently ignored. */
  save(items: T[]): Promise<void>;
}

interface UserPreferenceRecord {
  /**
   * Row id, as `@objectstack/spec` declares every record door: a `string`
   * (objectui#9333). These rows are read back off the protocol and handed to
   * `DataSource.update`, so the union this used to carry was a claim the wire
   * never makes.
   */
  id?: string;
  user_id: string;
  key: string;
  value: unknown;
  updated_at?: string;
}

const DEFAULT_RESOURCE = 'sys_user_preference';

/**
 * The query for the rows of `keys`. A lone key keeps the per-key query this
 * adapter has always sent. Several keys go as one membership query; the
 * object's unique index on `(user_id, key)` (per organization) bounds the
 * answer to one row per key, so a `$top` of the key count drops none of them.
 */
function preferenceQuery(userId: string, keys: readonly string[]): QueryParams {
  if (keys.length === 1) {
    return { $filter: { user_id: userId, key: keys[0] }, $top: 1 };
  }
  return { $filter: { user_id: userId, key: { $in: [...keys] } }, $top: keys.length };
}

/** One request for the rows of several adapters' keys. */
interface SharedRead {
  /** The keys asked for. Grows until the request is sent, then fixed. */
  readonly keys: Set<string>;
  /** The rows the one request answers with. */
  readonly rows: Promise<UserPreferenceRecord[]>;
}

/**
 * The reads still collecting keys: per data source, then per (resource, user).
 * An entry lives only until its request is sent, one microtask after it opens.
 */
const openReads = new WeakMap<object, Map<string, SharedRead>>();

/**
 * Join the open read for this (data source, resource, user), or open one.
 * See "One read per load" in the module header.
 */
function joinSharedRead(
  dataSource: ObjectStackUserStateAdapterOptions['dataSource'],
  resource: string,
  userId: string,
  key: string,
): SharedRead {
  let scopes = openReads.get(dataSource);
  if (!scopes) {
    scopes = new Map();
    openReads.set(dataSource, scopes);
  }
  const scope = JSON.stringify([resource, userId]);
  const open = scopes.get(scope);
  if (open) {
    open.keys.add(key);
    return open;
  }

  const keys = new Set<string>([key]);
  const opened = scopes;
  const read: SharedRead = {
    keys,
    rows: Promise.resolve().then(async () => {
      // Closed before the request goes out: a load after this point opens the
      // next read instead of waiting on, or being served by, this one.
      if (opened.get(scope) === read) opened.delete(scope);
      const result = await dataSource.find(resource, preferenceQuery(userId, [...keys]));
      return (result?.data ?? []) as UserPreferenceRecord[];
    }),
  };
  scopes.set(scope, read);
  return read;
}

/**
 * Build a `UserDataAdapter<T>` backed by ObjectStack.
 *
 * Each adapter instance is bound to a single `(user, key)` pair; create
 * one per slot you want to persist.
 */
export function createObjectStackUserStateAdapter<T = unknown>(
  options: ObjectStackUserStateAdapterOptions,
): UserDataAdapter<T> {
  const {
    dataSource,
    userId,
    key,
    resource = DEFAULT_RESOURCE,
    onError = () => {},
  } = options;

  // Cache the row id between load() and save() so we can update in place
  // without re-querying. Reset on every successful load.
  let cachedRowId: string | null = null;

  // Serializes overlapping save() calls. A fresh adapter is created whenever
  // the data source / user changes (see UserStateBridge), so its cachedRowId
  // starts null; rapid navigations then fire debounced flushes that can race —
  // two saves each findExisting()→null→create() and the second trips the
  // UNIQUE(user_id, key) constraint. Chaining writes means the second save
  // sees the cachedRowId the first one set and updates instead of inserting.
  let saveChain: Promise<void> = Promise.resolve();

  // Defensive: if the backend ignored our predicate and returned mixed
  // rows, only accept ones tagged for this (user, key) pair. Rows that
  // omit those metadata fields entirely are trusted (covers mocks and
  // backends that strip metadata from the projection).
  const matchRow = (rows: UserPreferenceRecord[]): UserPreferenceRecord | null => {
    const match = rows.find(r => {
      if (!r) return false;
      const userMismatch = r.user_id !== undefined && r.user_id !== userId;
      const keyMismatch = r.key !== undefined && r.key !== key;
      return !userMismatch && !keyMismatch;
    });
    return match ?? null;
  };

  // The per-key read, used by writes. Loads go through the shared read below.
  const findExisting = async (): Promise<UserPreferenceRecord | null> => {
    // NOTE: `QueryParams` uses OData-style `$`-prefixed keys. Using the bare
    // names (`filter`, `limit`) silently drops the predicate at the
    // `convertQueryParams` layer, which then returns *any* row in the
    // `sys_user_preference` table — that caused the Favorites adapter to load
    // the Recents row (and vice-versa), so clicked items leaked into Starred.
    const result = await dataSource.find(resource, preferenceQuery(userId, [key]));
    return matchRow((result?.data ?? []) as UserPreferenceRecord[]);
  };

  // A load's read: this key's row out of the one request every adapter of
  // this (data source, resource, user) shares for the load (objectui#12187).
  const loadExisting = async (): Promise<UserPreferenceRecord | null> => {
    const read = joinSharedRead(dataSource, resource, userId, key);
    const rows = await read.rows;
    // The read asked for this key alone: the per-key answer, read as above.
    if (read.keys.size === 1) return matchRow(rows);
    // An answer for several keys: a row is this key's only when it names it.
    const own = rows.find(
      r => r && r.key === key && (r.user_id === undefined || r.user_id === userId),
    );
    if (own) return own;
    // A row that names no key cannot be told apart in an answer for several
    // keys; this key's own read, as before the share, answers instead.
    if (rows.some(r => r && r.key === undefined)) return findExisting();
    return null;
  };

  const decodeValue = (value: unknown): T[] => {
    // The server may return the JSON column already parsed, or as a string.
    if (Array.isArray(value)) return value as T[];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? (parsed as T[]) : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Upsert by (user_id, key): update in place when the row is known/found,
  // otherwise insert — and if the insert loses a UNIQUE(user_id, key) race
  // (a concurrent writer created the row, or the backend dropped our find
  // predicate), recover by re-finding and updating rather than surfacing the
  // failed insert.
  //
  // Deliberately does NOT stamp `updated_at`: the column is server-managed, and
  // a non-system caller's write to it is stripped (objectstack-ai/objectstack#2948) and reported
  // back as a dropped field — which the console surfaces as a "Some fields were
  // not saved" toast (objectstack-ai/objectstack#3431). Sending it made every recents/favorites write pop
  // a scary warning about a field the user never touched, drowning the real
  // signal the toast exists for (objectstack-ai/objectstack#3794). The server stamps it either way.
  const upsert = async (items: T[]): Promise<void> => {
    // Fast path: we already know the row id from a previous load/save.
    if (cachedRowId !== null) {
      try {
        await dataSource.update(resource, cachedRowId, { value: items });
        return;
      } catch (updateError) {
        // Row may have been deleted server-side — fall through to find/insert.
        cachedRowId = null;
        onError('save', updateError);
      }
    }

    const existing = await findExisting();
    if (existing && existing.id !== undefined && existing.id !== null) {
      cachedRowId = existing.id;
      await dataSource.update(resource, existing.id, { value: items });
      return;
    }

    try {
      const created = await dataSource.create(resource, {
        user_id: userId,
        key,
        value: items,
      });
      const newId = (created as UserPreferenceRecord | undefined)?.id;
      if (newId !== undefined && newId !== null) cachedRowId = newId;
    } catch (createError) {
      // The row already exists (UNIQUE(user_id, key) violation) — re-find and
      // update in place. This turns the insert into a real upsert.
      const recovered = await findExisting();
      if (recovered && recovered.id !== undefined && recovered.id !== null) {
        cachedRowId = recovered.id;
        await dataSource.update(resource, recovered.id, { value: items });
        return;
      }
      throw createError;
    }
  };

  return {
    async load(): Promise<T[]> {
      try {
        const row = await loadExisting();
        if (!row) {
          cachedRowId = null;
          return [];
        }
        if (row.id !== undefined && row.id !== null) cachedRowId = row.id;
        return decodeValue(row.value);
      } catch (error) {
        onError('load', error);
        return [];
      }
    },

    async save(items: T[]): Promise<void> {
      // Chain onto any in-flight save so concurrent flushes upsert serially
      // rather than racing into two inserts (see `saveChain` above). Each link
      // catches its own errors so one failure never poisons the chain.
      const run = saveChain.then(() => upsert(items)).catch(error => {
        onError('save', error);
        // Swallow — provider falls back to localStorage as source of truth.
      });
      saveChain = run;
      return run;
    },
  };
}
