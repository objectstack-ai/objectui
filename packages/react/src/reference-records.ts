/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * reference-records — the one client-side reader of REFERENCED records.
 *
 * A stored reference is a key (usually a record id) of another object. Every
 * surface that has to NAME one — a lookup cell, a user cell, a pointer-pair
 * cell, a related list's label map, a lookup picker's chip, the recipient and
 * approver directories — reads the referenced record through this module, so
 * the platform has exactly one answer to "what does this key resolve to" and
 * one cost model for asking it.
 *
 * ## Cost: one read per object per tick, never one per row
 *
 * A list draws a page of cells and each cell asks for its own key. Every key
 * asked in the same tick is queued under its `(object, keyField)` and ONE
 * `find` per pair then asks for all of them with a `$in` filter (chunked at
 * {@link MAX_KEYS_PER_READ}). A key already answered costs nothing, a key in
 * flight is never asked twice, and the store is shared by every surface on the
 * data source — so a related list resolving its sort labels and the cells
 * drawing the same names share one read. A per-cell `findOne` turned a 25-row
 * page into 25 requests per reference column; this is what replaces it.
 *
 * The flush is a macrotask (`setTimeout(0)`), not a microtask: every cell of a
 * page commits its effect before the read goes out, so the page shares it.
 *
 * ## What a key answers
 *
 *   - `pending`  — asked, not answered yet;
 *   - `readable` — the read returned a row for the key;
 *   - `absent`   — the read SETTLED without a row for the key. A deleted record
 *     and a record outside the viewer's row set are one answer on purpose: the
 *     platform answers both identically (existence non-disclosure), so no
 *     reader can tell them apart, and none may try;
 *   - `failed`   — the read rejected (no list access to the object, a network
 *     error) or the source cannot `find`. Nothing is known about the key.
 *
 * The row is cached, never a label: a label is a display value each caller
 * builds per render, with the fields the viewer may not read removed, so a
 * permission policy that loads after the row arrived relabels the surface.
 *
 * ## Freshness
 *
 * Answers live for the data source's lifetime and are keyed by the data source
 * object, so two hosts (and two tests) never share an answer. A write reported
 * on the data-invalidation bus ({@link notifyDataChanged}) stales what it names
 * — one record, every record of an object, or everything — and a mounted
 * reader re-asks the stale keys in place, still drawing the old row until the
 * new one lands. An object's definition ({@link useReferenceObjectDef}) is
 * metadata and is read once per data source.
 */

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { extractRecords } from '@object-ui/core';
import { subscribeDataChanges, type DataChange } from './data-invalidation.js';

/** The two reads this module makes. Structural, so every adapter fits. */
export interface ReferenceRecordSource {
  find?: (objectName: string, params?: any) => Promise<unknown>;
  getObjectSchema?: (objectName: string) => Promise<unknown>;
}

/** What one referenced key resolved to. See the module doc. */
export type ReferenceRecordAnswer =
  | { readonly state: 'pending' }
  | { readonly state: 'readable'; readonly record: Readonly<Record<string, unknown>> }
  | { readonly state: 'absent' }
  | { readonly state: 'failed' };

/** What a referenced object's definition resolved to. */
export type ReferenceObjectDefAnswer =
  | { readonly state: 'pending' }
  | { readonly state: 'ok'; readonly def: Readonly<Record<string, unknown>> }
  | { readonly state: 'unavailable' };

/** One batch of keys of one object, read by one key field. */
export interface ReferenceRecordRequest {
  objectName: string | null | undefined;
  values: readonly unknown[];
  /** The column the keys are stored in; `'id'` when omitted. */
  keyField?: string;
}

/**
 * The most keys one `find` asks for: the lookup picker's page size, the `$top`
 * a server is known to accept. The request carries `$top` equal to its key
 * count, so a server's default page size never truncates the answer.
 */
export const MAX_KEYS_PER_READ = 50;

const PENDING: ReferenceRecordAnswer = Object.freeze({ state: 'pending' });
const ABSENT: ReferenceRecordAnswer = Object.freeze({ state: 'absent' });
const FAILED: ReferenceRecordAnswer = Object.freeze({ state: 'failed' });
const DEF_PENDING: ReferenceObjectDefAnswer = Object.freeze({ state: 'pending' });
const DEF_UNAVAILABLE: ReferenceObjectDefAnswer = Object.freeze({ state: 'unavailable' });

interface Entry {
  answer: ReferenceRecordAnswer;
  /** The invalidation stamp in force when the key was last asked. */
  askedAt: number;
  /** True while a read for this key is queued or in flight. */
  inFlight: boolean;
}

interface Store {
  readonly entries: Map<string, Entry>;
  readonly defs: Map<string, ReferenceObjectDefAnswer>;
  /** `(object, keyField)` → stored-key string → the key as the caller gave it. */
  readonly queued: Map<string, Map<string, unknown>>;
  flushScheduled: boolean;
  readonly listeners: Set<() => void>;
  /** Bumped on every settled answer; what `useSyncExternalStore` compares. */
  version: number;
  /** Promise waiters keyed by entry key, released when the entry settles. */
  readonly waiters: Map<string, Array<() => void>>;
}

const stores = new WeakMap<object, Store>();

function storeFor(source: object): Store {
  let store = stores.get(source);
  if (!store) {
    store = {
      entries: new Map(),
      defs: new Map(),
      queued: new Map(),
      flushScheduled: false,
      listeners: new Set(),
      version: 0,
      waiters: new Map(),
    };
    stores.set(source, store);
  }
  return store;
}

const SEP = '\u0000';
const keyOf = (objectName: string, keyField: string, value: string): string =>
  `${objectName}${SEP}${keyField}${SEP}${value}`;
const batchOf = (objectName: string, keyField: string): string => `${objectName}${SEP}${keyField}`;

/** A key a reference can be read by: a non-empty string or a finite number. */
function isKey(value: unknown): value is string | number {
  return (typeof value === 'string' && value !== '') || (typeof value === 'number' && Number.isFinite(value));
}

// ── Invalidation ──────────────────────────────────────────────────────────
//
// One bus subscription for the whole module, not one per store: stores are
// held weakly by their data source and a per-store listener would pin them.
// A change records the stamp it happened at against what it names; an entry
// asked BEFORE a stamp that covers it is stale.

let clock = 0;
let everythingStaleAt = 0;
const objectStaleAt = new Map<string, number>();
const recordStaleAt = new Map<string, number>();
const staleListeners = new Set<() => void>();
let staleVersion = 0;
let busSubscribed = false;

function onDataChange(change: DataChange): void {
  clock += 1;
  if (change.objectName === '*') everythingStaleAt = clock;
  else if (change.recordId === undefined) objectStaleAt.set(change.objectName, clock);
  else recordStaleAt.set(`${change.objectName}${SEP}${change.recordId}`, clock);
  staleVersion += 1;
  for (const listener of Array.from(staleListeners)) listener();
}

function ensureBusSubscription(): void {
  if (busSubscribed) return;
  busSubscribed = true;
  subscribeDataChanges(onDataChange);
}

function isStale(entry: Entry, objectName: string, keyField: string, value: string): boolean {
  const at = entry.askedAt;
  if (everythingStaleAt > at) return true;
  if ((objectStaleAt.get(objectName) ?? 0) > at) return true;
  // A record-scoped change names a record id: the key itself when the
  // reference is stored by id, otherwise the id of the row it resolved to.
  const id =
    keyField === 'id'
      ? value
      : entry.answer.state === 'readable'
        ? String(entry.answer.record.id ?? '')
        : '';
  return id !== '' && (recordStaleAt.get(`${objectName}${SEP}${id}`) ?? 0) > at;
}

// ── Reads ─────────────────────────────────────────────────────────────────

function settle(store: Store, keys: readonly string[]): void {
  store.version += 1;
  for (const key of keys) {
    const waiting = store.waiters.get(key);
    if (!waiting) continue;
    store.waiters.delete(key);
    for (const release of waiting) release();
  }
  for (const listener of Array.from(store.listeners)) listener();
}

function flush(source: ReferenceRecordSource, store: Store): void {
  store.flushScheduled = false;
  const queued = Array.from(store.queued.entries());
  store.queued.clear();
  for (const [batch, byKey] of queued) {
    const [objectName, keyField] = batch.split(SEP) as [string, string];
    const all = Array.from(byKey.entries());
    for (let start = 0; start < all.length; start += MAX_KEYS_PER_READ) {
      const chunk = all.slice(start, start + MAX_KEYS_PER_READ);
      const entryKeys = chunk.map(([value]) => keyOf(objectName, keyField, value));
      const answerAll = (answerFor: (value: string) => ReferenceRecordAnswer) => {
        chunk.forEach(([value], i) => {
          const entry = store.entries.get(entryKeys[i]);
          if (!entry) return;
          entry.answer = answerFor(value);
          entry.inFlight = false;
        });
        settle(store, entryKeys);
      };
      if (typeof source.find !== 'function') {
        answerAll(() => FAILED);
        continue;
      }
      const keys = chunk.map(([, original]) => original);
      // The executor runs synchronously, so a source that THROWS lands in the
      // same branch as one that rejects.
      new Promise<unknown>((resolve) =>
        resolve(source.find!(objectName, { $filter: { [keyField]: { $in: keys } }, $top: keys.length })),
      ).then(
        (result) => {
          const byStoredKey = new Map<string, Readonly<Record<string, unknown>>>();
          for (const row of extractRecords(result) as Array<Record<string, unknown> | null>) {
            if (!row || typeof row !== 'object') continue;
            const stored = keyField === 'id' ? row.id ?? row._id : row[keyField];
            if (isKey(stored)) byStoredKey.set(String(stored), row);
          }
          answerAll((value) => {
            const record = byStoredKey.get(value);
            return record ? Object.freeze({ state: 'readable', record }) : ABSENT;
          });
        },
        () => answerAll(() => FAILED),
      );
    }
  }
}

/** Queue every key of `request` that is unknown or stale; returns their entry keys. */
function enqueue(source: ReferenceRecordSource, store: Store, request: ReferenceRecordRequest): void {
  const { objectName } = request;
  if (!objectName) return;
  const keyField = request.keyField || 'id';
  for (const raw of request.values) {
    if (!isKey(raw)) continue;
    const value = String(raw);
    const key = keyOf(objectName, keyField, value);
    const entry = store.entries.get(key);
    if (entry && (entry.inFlight || !isStale(entry, objectName, keyField, value))) continue;
    if (entry) {
      entry.inFlight = true;
      entry.askedAt = clock;
    } else {
      store.entries.set(key, { answer: PENDING, askedAt: clock, inFlight: true });
    }
    const batch = batchOf(objectName, keyField);
    let byKey = store.queued.get(batch);
    if (!byKey) {
      byKey = new Map();
      store.queued.set(batch, byKey);
    }
    byKey.set(value, raw);
    if (!store.flushScheduled) {
      store.flushScheduled = true;
      setTimeout(() => flush(source, store), 0);
    }
  }
}

/** Ask for the given keys in the next batched read. Known, fresh keys cost nothing. */
export function requestReferenceRecords(
  source: ReferenceRecordSource | null | undefined,
  requests: ReferenceRecordRequest | readonly ReferenceRecordRequest[],
): void {
  if (!source) return;
  ensureBusSubscription();
  const store = storeFor(source);
  for (const request of Array.isArray(requests) ? requests : [requests as ReferenceRecordRequest]) {
    enqueue(source, store, request);
  }
}

/** The current answer for one key, without asking for it. */
export function readReferenceRecord(
  source: ReferenceRecordSource | null | undefined,
  objectName: string | null | undefined,
  value: unknown,
  keyField = 'id',
): ReferenceRecordAnswer {
  if (!source || !objectName || !isKey(value)) return FAILED;
  return storeFor(source).entries.get(keyOf(objectName, keyField, String(value)))?.answer ?? PENDING;
}

/**
 * Ask for `values` and wait for every answer. For callers outside a render —
 * a hydration effect, a directory slate — that still want the shared batch and
 * cache. Resolves to a map from the stored-key string to its answer.
 */
export function fetchReferenceRecords(
  source: ReferenceRecordSource | null | undefined,
  objectName: string,
  values: readonly unknown[],
  keyField = 'id',
): Promise<Map<string, ReferenceRecordAnswer>> {
  const keys = Array.from(new Set(values.filter(isKey).map(String)));
  if (!source || keys.length === 0) {
    return Promise.resolve(new Map(keys.map((k) => [k, FAILED] as const)));
  }
  requestReferenceRecords(source, { objectName, values, keyField });
  const store = storeFor(source);
  const collect = () => new Map(keys.map((k) => [k, readReferenceRecord(source, objectName, k, keyField)] as const));
  const waiting = keys
    .map((k) => keyOf(objectName, keyField, k))
    .filter((key) => store.entries.get(key)?.inFlight)
    .map(
      (key) =>
        new Promise<void>((release) => {
          const list = store.waiters.get(key) ?? [];
          list.push(release);
          store.waiters.set(key, list);
        }),
    );
  return Promise.all(waiting).then(collect);
}

/** Drop every answer one data source has given. Tests only. */
export function clearReferenceRecords(source: ReferenceRecordSource | null | undefined): void {
  if (source) stores.delete(source);
}

// ── Object definitions ───────────────────────────────────────────────────

function askDef(source: ReferenceRecordSource, store: Store, objectName: string): void {
  if (store.defs.has(objectName)) return;
  if (typeof source.getObjectSchema !== 'function') {
    store.defs.set(objectName, DEF_UNAVAILABLE);
    return;
  }
  store.defs.set(objectName, DEF_PENDING);
  new Promise<unknown>((resolve) => resolve(source.getObjectSchema!(objectName))).then(
    (def) => {
      store.defs.set(
        objectName,
        def && typeof def === 'object'
          ? Object.freeze({ state: 'ok', def: def as Record<string, unknown> })
          : DEF_UNAVAILABLE,
      );
      settle(store, []);
    },
    () => {
      store.defs.set(objectName, DEF_UNAVAILABLE);
      settle(store, []);
    },
  );
}

/** The current answer for an object's definition, without asking for it. */
export function readReferenceObjectDef(
  source: ReferenceRecordSource | null | undefined,
  objectName: string | null | undefined,
): ReferenceObjectDefAnswer {
  if (!source || !objectName) return DEF_UNAVAILABLE;
  return storeFor(source).defs.get(objectName) ?? DEF_PENDING;
}

/** Ask for an object's definition and wait for it; `undefined` when unavailable. */
export function fetchReferenceObjectDef(
  source: ReferenceRecordSource | null | undefined,
  objectName: string,
): Promise<Readonly<Record<string, unknown>> | undefined> {
  if (!source) return Promise.resolve(undefined);
  const store = storeFor(source);
  askDef(source, store, objectName);
  const read = () => {
    const answer = store.defs.get(objectName);
    return answer?.state === 'ok' ? answer.def : undefined;
  };
  if (store.defs.get(objectName)?.state !== 'pending') return Promise.resolve(read());
  return new Promise((resolve) => {
    const listener = () => {
      if (store.defs.get(objectName)?.state === 'pending') return;
      store.listeners.delete(listener);
      resolve(read());
    };
    store.listeners.add(listener);
  });
}

// ── Hooks ────────────────────────────────────────────────────────────────

const NO_STORE_VERSION = '0:0';
const noSubscription = (): (() => void) => () => {};

/** Re-render on every settled answer of `source` and every invalidation. */
function useStoreVersion(source: ReferenceRecordSource | null | undefined): string {
  const store = source ? storeFor(source) : null;
  // Keyed on the store (a stable object per data source), so a re-render does
  // not resubscribe. Correctness never rests on this identity: a fresh
  // function would only cost a resubscribe (AGENTS.md #10).
  const subscribe = useCallback(
    (listener: () => void) => {
      if (!store) return noSubscription();
      store.listeners.add(listener);
      staleListeners.add(listener);
      return () => {
        store.listeners.delete(listener);
        staleListeners.delete(listener);
      };
    },
    [store],
  );
  const snapshot = useCallback(
    () => (store ? `${store.version}:${staleVersion}` : NO_STORE_VERSION),
    [store],
  );
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/**
 * The answers for every key of every request, asked in this render's commit
 * and re-asked when a write stales them. The result is keyed by
 * `referenceRecordKey(objectName, value, keyField)`; read it with
 * {@link pickReferenceRecord}.
 *
 * The effect keys on the request CONTENT (a string), never on the array the
 * caller built this render (AGENTS.md #10).
 */
export function useReferenceRecordSets(
  source: ReferenceRecordSource | null | undefined,
  requests: readonly ReferenceRecordRequest[],
): ReadonlyMap<string, ReferenceRecordAnswer> {
  const version = useStoreVersion(source);
  const content = JSON.stringify(
    requests
      .filter((r) => r.objectName)
      .map((r) => [r.objectName, r.keyField || 'id', r.values.filter(isKey).map(String)]),
  );
  useEffect(() => {
    if (!source) return;
    const parsed = JSON.parse(content) as Array<[string, string, string[]]>;
    requestReferenceRecords(
      source,
      parsed.map(([objectName, keyField, values]) => ({ objectName, keyField, values })),
    );
  }, [source, content, version]);
  const out = new Map<string, ReferenceRecordAnswer>();
  for (const request of requests) {
    if (!request.objectName) continue;
    const keyField = request.keyField || 'id';
    for (const value of request.values) {
      if (!isKey(value)) continue;
      out.set(
        referenceRecordKey(request.objectName, value, keyField),
        readReferenceRecord(source, request.objectName, value, keyField),
      );
    }
  }
  return out;
}

/** The key {@link useReferenceRecordSets} files one answer under. */
export function referenceRecordKey(objectName: string, value: unknown, keyField = 'id'): string {
  return keyOf(objectName, keyField, String(value));
}

/** One answer out of a {@link useReferenceRecordSets} result. */
export function pickReferenceRecord(
  answers: ReadonlyMap<string, ReferenceRecordAnswer>,
  objectName: string | null | undefined,
  value: unknown,
  keyField = 'id',
): ReferenceRecordAnswer | undefined {
  if (!objectName || !isKey(value)) return undefined;
  return answers.get(keyOf(objectName, keyField, String(value)));
}

/** The answers for some keys of one object. See {@link useReferenceRecordSets}. */
export function useReferenceRecords(
  source: ReferenceRecordSource | null | undefined,
  objectName: string | null | undefined,
  values: readonly unknown[],
  keyField = 'id',
): ReadonlyMap<string, ReferenceRecordAnswer> {
  return useReferenceRecordSets(source, [{ objectName, values, keyField }]);
}

/** An object's definition, read once per data source and shared by every reader. */
export function useReferenceObjectDef(
  source: ReferenceRecordSource | null | undefined,
  objectName: string | null | undefined,
): ReferenceObjectDefAnswer {
  const version = useStoreVersion(source);
  useEffect(() => {
    if (!source || !objectName) return;
    askDef(source, storeFor(source), objectName);
  }, [source, objectName, version]);
  return readReferenceObjectDef(source, objectName);
}
