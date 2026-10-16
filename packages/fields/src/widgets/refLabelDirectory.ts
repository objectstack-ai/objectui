/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The read cells' label directory for the two widget-hinted reference fields
 * (objectui#12613): `object-ref` (a stored object name) and `recipient-picker`
 * (a stored recipient id or name, whose kind a sibling `recipient_type` names).
 *
 * ## Same reads as the edit widgets, batched across rows
 *
 * The cells name a stored value from exactly what the edit widget lists:
 *
 *   - `object-ref` → the registered-object catalog, `loadObjectCatalog`
 *     (`./objectCatalog.ts`), the read `ObjectRefField` makes;
 *   - a record kind (`user`, `team`, `business_unit`, `unit_and_subordinates`)
 *     → the kind's directory object and label fields from `TYPE_TO_OBJECT`
 *     (`./recipientKinds.ts`), the table `RecipientPickerField` lists from;
 *   - a registry kind (`position`) → the console's metadata store,
 *     `ensureType(<type>)`, the reader `RecipientPickerField` lists it with;
 *   - the `field` kind → the shared object's schema through
 *     `deriveUserFields`, the picker's own column derivation.
 *
 * A list draws one cell per row, so nothing here is read per cell. A catalog
 * (the object list, a registry type, one object's user columns) is read once
 * per data source; record kinds are collected for one microtask and read with
 * one `$in` query per directory object. A grid page of fifty rules costs one
 * catalog read and at most one query per directory object, not fifty.
 *
 * ## The four answers a cell gets
 *
 *   - `unasked` — nothing can be asked: no data source, no sibling kind, a
 *     kind the picker does not know. The cell draws the stored text exactly as
 *     the text cell did before it existed, so a call site that cannot supply
 *     what the cell needs changes nothing.
 *   - `pending` — asked, not answered yet. Drawn the same as `unasked`.
 *   - `resolved` — the label.
 *   - `unresolved` — asked and not found (a deleted record, a renamed
 *     object), or the read failed (no read access). The cell draws the raw
 *     stored value, muted, never a blank.
 *
 * ## Cache lifetime
 *
 * Answers live for the data source's lifetime, which is the page session: a
 * display label, not a decision input, so an item renamed mid-session reading
 * its old label until reload is the right trade (the same one the approver
 * directory in `@object-ui/app-shell` makes). Keyed by the data source object,
 * so two hosts, and two tests, never share an answer.
 */

import React from 'react';
import { MetadataCtx, SchemaRendererContext } from '@object-ui/react';
import { extractRecords } from '@object-ui/core';
import type { DataSource } from '@object-ui/types';
import { canLoadObjectCatalog, loadObjectCatalog } from './objectCatalog.js';
import {
  FIELD_RECIPIENT_TYPE,
  TYPE_TO_OBJECT,
  TYPE_TO_REGISTRY,
  recipientCandidateLabel,
} from './recipientKinds.js';
import { deriveUserFields } from './RecipientPickerField.js';

/** What a read cell knows about one stored reference. See the module doc. */
export type RefLabel =
  | { readonly state: 'unasked' }
  | { readonly state: 'pending' }
  | { readonly state: 'resolved'; readonly label: string }
  | { readonly state: 'unresolved' };

const UNASKED: RefLabel = Object.freeze({ state: 'unasked' });
const PENDING: RefLabel = Object.freeze({ state: 'pending' });
const UNRESOLVED: RefLabel = Object.freeze({ state: 'unresolved' });

const resolved = (label: string): RefLabel => Object.freeze({ state: 'resolved', label });

/** At most this many ids go into one `$in` query. */
const RECORD_QUERY_CHUNK = 100;

/** A name → label list read once, answering every name asked of it. */
interface Catalog {
  map: ReadonlyMap<string, string> | null;
  failed: boolean;
  /** Entry key → the name it asks, for the asks that arrived while loading. */
  waiting: Map<string, string>;
}

/** Every answer one data source has given, and the reads still in flight. */
class LabelBook {
  private readonly entries = new Map<string, RefLabel>();
  private readonly listeners = new Set<() => void>();
  private readonly catalogs = new Map<string, Catalog>();
  /** Record kind → id → entry key, waiting for the next flush. */
  private recordQueue = new Map<string, Map<string, string>>();
  private flushScheduled = false;
  private publishScheduled = false;

  constructor(private readonly dataSource: DataSource) {}

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  read(key: string): RefLabel | undefined {
    return this.entries.get(key);
  }

  private publish(): void {
    for (const listener of [...this.listeners]) listener();
  }

  /**
   * An answer written while a subscriber was registering is not seen by
   * React's store hook until a listener fires, so it is published on the
   * next microtask, once for every answer written in the same turn.
   */
  private publishSoon(): void {
    if (this.publishScheduled) return;
    this.publishScheduled = true;
    queueMicrotask(() => {
      this.publishScheduled = false;
      this.publish();
    });
  }

  /** Ask a catalog for `name`; it is loaded by `load` the first time. */
  askCatalog(
    catalogId: string,
    name: string,
    key: string,
    load: () => Promise<ReadonlyMap<string, string>>,
  ): void {
    if (this.entries.has(key)) return;
    const known = this.catalogs.get(catalogId);
    if (known && (known.map || known.failed)) {
      this.entries.set(key, settleFromCatalog(known, name));
      this.publishSoon();
      return;
    }
    this.entries.set(key, PENDING);
    if (known) {
      known.waiting.set(key, name);
      return;
    }
    const catalog: Catalog = { map: null, failed: false, waiting: new Map([[key, name]]) };
    this.catalogs.set(catalogId, catalog);
    let loading: Promise<ReadonlyMap<string, string>>;
    try {
      loading = load();
    } catch (err) {
      loading = Promise.reject(err);
    }
    loading
      .then(
        (map) => {
          catalog.map = map;
        },
        () => {
          catalog.failed = true;
        },
      )
      .then(() => {
        for (const [waitingKey, waitingName] of catalog.waiting) {
          this.entries.set(waitingKey, settleFromCatalog(catalog, waitingName));
        }
        catalog.waiting.clear();
        this.publish();
      });
  }

  /** Ask for one record of a record kind; asks are batched per object. */
  askRecord(kind: string, id: string, key: string): void {
    if (this.entries.has(key)) return;
    this.entries.set(key, PENDING);
    let ids = this.recordQueue.get(kind);
    if (!ids) {
      ids = new Map();
      this.recordQueue.set(kind, ids);
    }
    ids.set(id, key);
    if (this.flushScheduled) return;
    this.flushScheduled = true;
    queueMicrotask(() => {
      this.flushScheduled = false;
      void this.flushRecords();
    });
  }

  private async flushRecords(): Promise<void> {
    const queue = this.recordQueue;
    this.recordQueue = new Map();
    // One query per directory OBJECT: `business_unit` and
    // `unit_and_subordinates` share `sys_business_unit`, so their ids go out
    // together.
    const byObject = new Map<string, { storeField: string; asks: Array<{ kind: string; id: string; key: string }> }>();
    for (const [kind, ids] of queue) {
      const mapping = TYPE_TO_OBJECT[kind];
      if (!mapping) continue;
      let group = byObject.get(mapping.object);
      if (!group) {
        group = { storeField: mapping.storeField, asks: [] };
        byObject.set(mapping.object, group);
      }
      for (const [id, key] of ids) group.asks.push({ kind, id, key });
    }
    await Promise.all(
      [...byObject].map(async ([object, group]) => {
        const rowsById = new Map<string, unknown>();
        let failed = false;
        try {
          const ids = [...new Set(group.asks.map((a) => a.id))];
          for (let i = 0; i < ids.length; i += RECORD_QUERY_CHUNK) {
            const chunk = ids.slice(i, i + RECORD_QUERY_CHUNK);
            const res = await this.dataSource.find(object, {
              $filter: { [group.storeField]: { $in: chunk } },
              $top: chunk.length,
            });
            for (const row of extractRecords(res)) {
              const stored = (row as Record<string, unknown> | null)?.[group.storeField];
              if (stored != null) rowsById.set(String(stored), row);
            }
          }
        } catch {
          failed = true;
        }
        for (const ask of group.asks) {
          const row = failed ? undefined : rowsById.get(ask.id);
          this.entries.set(
            ask.key,
            row === undefined
              ? UNRESOLVED
              : resolved(recipientCandidateLabel(TYPE_TO_OBJECT[ask.kind]?.labelFields, row)),
          );
        }
        this.publish();
      }),
    );
  }
}

function settleFromCatalog(catalog: Catalog, name: string): RefLabel {
  if (catalog.failed || !catalog.map) return UNRESOLVED;
  const label = catalog.map.get(name);
  return label === undefined ? UNRESOLVED : resolved(label);
}

const books = new WeakMap<object, LabelBook>();

function bookFor(dataSource: DataSource): LabelBook {
  let book = books.get(dataSource);
  if (!book) {
    book = new LabelBook(dataSource);
    books.set(dataSource, book);
  }
  return book;
}

const keyOf = (...parts: string[]): string => JSON.stringify(parts);

const noSubscription = (): (() => void) => () => {};
const readUnasked = (): RefLabel => UNASKED;

/** The registered object a stored `object-ref` value names. */
export function useObjectRefLabel(value: unknown): RefLabel {
  const ctx = React.useContext(SchemaRendererContext);
  const dataSource: DataSource | null = ctx?.dataSource ?? null;
  const name = typeof value === 'string' ? value : '';
  const book = name && dataSource && canLoadObjectCatalog(dataSource) ? bookFor(dataSource) : null;
  const key = keyOf('object', name);

  const subscribe = React.useCallback(
    (listener: () => void) => {
      if (!book) return noSubscription();
      const off = book.subscribe(listener);
      book.askCatalog('object', name, key, async () => {
        const rows = await loadObjectCatalog(dataSource);
        return new Map(rows.map((row) => [row.name, row.label ?? '']));
      });
      return off;
    },
    [book, dataSource, name, key],
  );
  const getSnapshot = React.useCallback(() => (book ? book.read(key) ?? PENDING : UNASKED), [book, key]);
  return React.useSyncExternalStore(book ? subscribe : noSubscription, book ? getSnapshot : readUnasked, book ? getSnapshot : readUnasked);
}

/** One ask a stored recipient turns into, or `null` when nothing can be asked. */
type RecipientAsk =
  | { kind: 'record'; recipientType: string; id: string; key: string }
  | { kind: 'registry'; recipientType: string; name: string; key: string }
  | { kind: 'field'; objectName: string; name: string; key: string };

function recipientAskOf(
  value: unknown,
  dependentValues: Readonly<Record<string, unknown>> | undefined,
  dataSource: DataSource | null,
  hasMetadataStore: boolean,
): RecipientAsk | null {
  if (!dependentValues || typeof value !== 'string' || value === '') return null;
  // The same sibling reads the edit widget makes: `recipient_type` picks the
  // kind, and in `field` mode `object_name` names the object whose columns
  // are offered — both declared in the field's own `dependsOn`.
  const recipientType = String(dependentValues.recipient_type ?? '');
  const record = TYPE_TO_OBJECT[recipientType];
  if (record) {
    if (!dataSource || typeof dataSource.find !== 'function') return null;
    return { kind: 'record', recipientType, id: value, key: keyOf('record', recipientType, value) };
  }
  const registry = TYPE_TO_REGISTRY[recipientType];
  if (registry) {
    // Outside a metadata store the picker degrades to a text input, and the
    // cell to the text it drew before.
    if (!hasMetadataStore) return null;
    return { kind: 'registry', recipientType, name: value, key: keyOf('registry', registry.type, value) };
  }
  if (recipientType === FIELD_RECIPIENT_TYPE) {
    const objectName = String(dependentValues.object_name ?? '');
    if (!objectName || !dataSource || typeof dataSource.getObjectSchema !== 'function') return null;
    return { kind: 'field', objectName, name: value, key: keyOf('field', objectName, value) };
  }
  return null;
}

/**
 * The recipient a stored `recipient-picker` value names. `dependentValues` is
 * the row's sibling values, as the edit widget gets them; without them the kind
 * is unknown and nothing is asked.
 */
export function useRecipientLabel(
  value: unknown,
  dependentValues: Readonly<Record<string, unknown>> | undefined,
): RefLabel {
  const ctx = React.useContext(SchemaRendererContext);
  const dataSource: DataSource | null = ctx?.dataSource ?? null;
  // Read raw, as the picker reads it: an absent store and an empty registry
  // are different facts. Through a ref, because the store's context value is
  // rebuilt whenever any type it caches settles (AGENTS.md #10).
  const metadataStore = React.useContext(MetadataCtx);
  const metadataStoreRef = React.useRef(metadataStore);
  // Kept current from an effect, which runs before the store subscription's
  // own effect below, so an ask always reads the store of the latest commit.
  React.useEffect(() => {
    metadataStoreRef.current = metadataStore;
  });

  const ask = recipientAskOf(value, dependentValues, dataSource, !!metadataStore);
  const book = ask && dataSource ? bookFor(dataSource) : null;
  const key = ask?.key ?? '';
  // The ask's primitives, so the subscription is keyed on data, not on the
  // `ask` object this render built.
  const askKind = ask?.kind ?? '';
  const askTarget = ask ? (ask.kind === 'field' ? ask.objectName : ask.recipientType) : '';
  const askValue = ask ? (ask.kind === 'record' ? ask.id : ask.name) : '';

  const subscribe = React.useCallback(
    (listener: () => void) => {
      if (!book || !dataSource) return noSubscription();
      const off = book.subscribe(listener);
      if (askKind === 'record') {
        book.askRecord(askTarget, askValue, key);
      } else if (askKind === 'registry') {
        const registry = TYPE_TO_REGISTRY[askTarget];
        book.askCatalog(`registry:${registry.type}`, askValue, key, async () => {
          const store = metadataStoreRef.current;
          const items = store ? await store.ensureType(registry.type) : [];
          const map = new Map<string, string>();
          for (const item of Array.isArray(items) ? items : []) {
            if (typeof item?.name === 'string' && item.name) {
              map.set(item.name, recipientCandidateLabel(registry.labelFields, item));
            }
          }
          return map;
        });
      } else if (askKind === 'field') {
        book.askCatalog(`field:${askTarget}`, askValue, key, async () => {
          const schema = await dataSource.getObjectSchema(askTarget);
          return new Map(deriveUserFields(schema).map((f) => [f.name, f.label]));
        });
      }
      return off;
    },
    [book, dataSource, key, askKind, askTarget, askValue],
  );
  const getSnapshot = React.useCallback(() => (book ? book.read(key) ?? PENDING : UNASKED), [book, key]);
  return React.useSyncExternalStore(book ? subscribe : noSubscription, book ? getSnapshot : readUnasked, book ? getSnapshot : readUnasked);
}
