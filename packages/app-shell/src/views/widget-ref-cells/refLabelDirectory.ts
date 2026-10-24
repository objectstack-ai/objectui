/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The label directory behind the console's faces for the two widget-hinted
 * reference keys of `@object-ui/fields` (objectui#12613): `object-ref` (a stored
 * object name) and `recipient-picker` (a stored recipient id or name, whose kind
 * a sibling `recipient_type` names).
 *
 * ## Where each answer comes from
 *
 *   - `object-ref` → the console's metadata store, `ensureType('object')`: the
 *     same `GET /meta/object` list `ObjectRefField` offers, as full object
 *     definitions, so the label AND the icon come from one read the console
 *     already caches for the session;
 *   - a record kind (`user`, `team`, `business_unit`, `unit_and_subordinates`,
 *     `RECIPIENT_RECORD_KINDS`) → the stored ids THEMSELVES, read by exact id
 *     through `@object-ui/react`'s shared reference store: every id any cell
 *     asks for in one tick goes out as one `$in` query per object and stored
 *     column — shared with every lookup and user cell on the page. ⛔ Not the
 *     picker's candidate list: that query stops at 500 rows by
 *     name, and a recipient past it is a real recipient the list must still
 *     name. The ROW is kept, and its label is built at render with the fields
 *     the viewer may not read removed (`withoutDeniedFields`), as the lookup
 *     picker builds its option labels;
 *   - a registry kind (`position`, `RECIPIENT_REGISTRY_KINDS`) → the metadata
 *     store, `ensureType(<type>)`, the reader `RecipientPickerField` lists it
 *     with;
 *   - the `field` kind → the shared object's schema through
 *     `deriveUserFields`, the picker's own column derivation.
 *
 * Nothing is read per cell: a catalog (the objects, a registry type, one
 * object's user columns) is read the first time any cell asks it, and record
 * ids are batched by the shared reference store, once per data source.
 *
 * ## The answers a face gets
 *
 *   - `unasked` — the edit widget could not list it either: no data source, no
 *     sibling kind, a kind it does not know, no metadata store for a store-read
 *     kind. The face draws the stored text exactly as the text cell does, so a
 *     call site that cannot supply what the face needs changes nothing.
 *   - `pending` — asked, not answered yet. Drawn the same as `unasked`.
 *   - `resolved` — the label (and, for an object, its icon).
 *   - `unresolved` — the read answered without the value (a deleted record, a
 *     renamed object), or failed (no read access). The face draws the raw
 *     stored value, muted, never a blank.
 *
 * ## Cache lifetime
 *
 * Answers live for the data source's lifetime, which is the page session: a
 * display label, not a decision input, so an item renamed mid-session reading
 * its old label until reload is the right trade (the same one
 * `useApproverDirectory` makes). Keyed by the data source object, so two hosts,
 * and two tests, never share an answer. The record LABEL is not cached: it is
 * rebuilt from the cached row on every render, so a read policy that loads
 * after the row arrived relabels the cell.
 *
 * ## Why it lives here, behind a lazy import
 *
 * Every `packages/fields` module rides the console's eager `ui-components`
 * chunk, whatever imports it lazily (`scripts/vite-ineffective-dynamic-imports.ts`
 * says why), and that chunk has a ceiling of its own in
 * `scripts/check-eager-closure-budget.mjs` with no room for a label reader. So
 * `@object-ui/fields` keeps the rule and the keys with a text default, as it
 * does for `RECORD_POINTER_CARD_TYPE`, and this package registers the faces,
 * loading this module and the faces only when a cell first draws one
 * (`./widget-ref-cell-renderers.tsx`).
 */

import React from 'react';
import { MetadataCtx, SchemaRendererContext, pickReferenceRecord, useReferenceRecords } from '@object-ui/react';
import { withoutDeniedFields } from '@object-ui/core';
import { usePermissions } from '@object-ui/permissions';
import type { DataSource } from '@object-ui/types';
import {
  FIELD_RECIPIENT_TYPE,
  RECIPIENT_RECORD_KINDS,
  RECIPIENT_REGISTRY_KINDS,
  deriveUserFields,
  recipientCandidateLabel,
} from '@object-ui/fields';

/** What a face knows about one stored reference. See the module doc. */
export type RefLabel =
  | { readonly state: 'unasked' }
  | { readonly state: 'pending' }
  | { readonly state: 'resolved'; readonly label: string; readonly icon?: string }
  | { readonly state: 'unresolved' };

/** A book entry. */
type Entry = RefLabel;

const UNASKED: RefLabel = Object.freeze({ state: 'unasked' });
const PENDING: RefLabel = Object.freeze({ state: 'pending' });
const UNRESOLVED: RefLabel = Object.freeze({ state: 'unresolved' });

/** One catalog member's face: its label, and an icon when the list has one. */
interface CatalogItem {
  label: string;
  icon?: string;
}
/** A catalog's members by name, or `null` when its read failed. */
type Catalog = ReadonlyMap<string, CatalogItem> | null;
type CatalogLoad = () => Promise<ReadonlyMap<string, CatalogItem>>;

/** Every answer one data source has given, and the reads still in flight. */
class LabelBook {
  private readonly entries = new Map<string, Entry>();
  private readonly listeners = new Set<() => void>();
  private readonly catalogs = new Map<string, Promise<Catalog>>();
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  read(key: string): Entry | undefined {
    return this.entries.get(key);
  }

  private publish(): void {
    for (const listener of [...this.listeners]) listener();
  }

  /**
   * Ask catalog `catalogId` for `name`, loading it with `load` the first time
   * any cell asks it. The answer is published from a promise callback, so a
   * subscriber registering right now always hears it.
   */
  ask(catalogId: string, name: string, key: string, load: CatalogLoad): void {
    if (this.entries.has(key)) return;
    this.entries.set(key, PENDING);
    let catalog = this.catalogs.get(catalogId);
    if (!catalog) {
      catalog = Promise.resolve()
        .then(load)
        .catch(() => null);
      this.catalogs.set(catalogId, catalog);
    }
    void catalog.then((map) => {
      const item = map?.get(name);
      this.entries.set(key, item ? Object.freeze({ state: 'resolved', ...item }) : UNRESOLVED);
      this.publish();
    });
  }
}

const books = new WeakMap<DataSource, LabelBook>();

function bookFor(dataSource: DataSource): LabelBook {
  let book = books.get(dataSource);
  if (!book) {
    book = new LabelBook();
    books.set(dataSource, book);
  }
  return book;
}

const noSubscription = (): (() => void) => () => {};

/**
 * The one store subscription both faces make: the entry under `key`, asked by
 * `ask` when a cell first subscribes (`key` '' = nothing can be asked). `ask` is
 * read through a ref so a render's fresh closure never re-subscribes a cell.
 */
function useBookEntry(dataSource: DataSource | null, key: string, ask: (book: LabelBook) => void): Entry {
  const book = key && dataSource ? bookFor(dataSource) : null;
  const askRef = React.useRef(ask);
  // An effect, so it runs before the subscription's own effect below.
  React.useEffect(() => {
    askRef.current = ask;
  });
  const subscribe = React.useCallback(
    (listener: () => void) => {
      if (!book) return noSubscription();
      const off = book.subscribe(listener);
      askRef.current(book);
      return off;
    },
    [book, key],
  );
  const getSnapshot = React.useCallback(() => (book ? book.read(key) ?? PENDING : UNASKED), [book, key]);
  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * The console's metadata store, read raw — an absent store and an empty
 * registry are different facts — and through a ref, because the store's
 * context value is rebuilt whenever any type it caches settles (AGENTS.md #10).
 */
function useMetadataStoreRef() {
  const store = React.useContext(MetadataCtx);
  const ref = React.useRef(store);
  React.useEffect(() => {
    ref.current = store;
  });
  return { present: !!store, ref };
}

/** The registered object a stored `object-ref` value names: its label and icon. */
export function useObjectRefLabel(value: unknown): RefLabel {
  const dataSource = React.useContext(SchemaRendererContext)?.dataSource ?? null;
  const store = useMetadataStoreRef();
  const name = typeof value === 'string' ? value : '';
  const key = name && store.present ? JSON.stringify(['object', name]) : '';
  return useBookEntry(dataSource, key, (book) =>
    book.ask('object', name, key, async () => {
      const items = (await store.ref.current?.ensureType('object')) ?? [];
      const map = new Map<string, CatalogItem>();
      for (const item of Array.isArray(items) ? items : []) {
        if (typeof item?.name !== 'string' || !item.name) continue;
        map.set(item.name, {
          label: typeof item.label === 'string' ? item.label : '',
          ...(typeof item.icon === 'string' && item.icon ? { icon: item.icon } : {}),
        });
      }
      return map;
    }),
  ) as RefLabel;
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
  const dataSource = React.useContext(SchemaRendererContext)?.dataSource ?? null;
  const store = useMetadataStoreRef();
  const perms = usePermissions();
  // The same sibling reads the edit widget makes: `recipient_type` picks the
  // kind, and in `field` mode `object_name` names the object whose columns
  // are offered — both declared in the field's own `dependsOn`.
  const kind = String(dependentValues?.recipient_type ?? '');
  const objectName = String(dependentValues?.object_name ?? '');
  const record = RECIPIENT_RECORD_KINDS[kind];
  const registry = RECIPIENT_REGISTRY_KINDS[kind];
  const id = dependentValues && typeof value === 'string' ? value : '';
  // A record kind is read through the shared reference store, keyed by the
  // column its recipients are stored in; every other kind through the book.
  const recordReadable = !!(id && record && typeof dataSource?.find === 'function');
  const recordAnswers = useReferenceRecords(
    recordReadable ? dataSource : null,
    record?.object,
    recordReadable ? [id] : [],
    record?.storeField,
  );
  const key = !id || record
    ? ''
    : registry
        ? store.present ? JSON.stringify(['registry', registry.type, id]) : ''
        : kind === FIELD_RECIPIENT_TYPE && objectName && typeof dataSource?.getObjectSchema === 'function'
          ? JSON.stringify(['field', objectName, id])
          : '';
  const entry = useBookEntry(dataSource, key, (book) => {
    if (registry) {
      return book.ask(`registry:${registry.type}`, id, key, async () => {
        const items = (await store.ref.current?.ensureType(registry.type)) ?? [];
        const map = new Map<string, CatalogItem>();
        for (const item of Array.isArray(items) ? items : []) {
          if (typeof item?.name === 'string' && item.name) {
            map.set(item.name, { label: recipientCandidateLabel(registry.labelFields, item) });
          }
        }
        return map;
      });
    }
    book.ask(`field:${objectName}`, id, key, async () => {
      const schema = dataSource ? await dataSource.getObjectSchema(objectName) : null;
      return new Map(deriveUserFields(schema).map((f) => [f.name, { label: f.label }]));
    });
  });
  if (!record) return entry;
  if (!recordReadable) return UNASKED;
  const answer = pickReferenceRecord(recordAnswers, record.object, id, record.storeField);
  if (!answer || answer.state === 'pending') return PENDING;
  // A deleted record and a refused read both draw the raw stored value, muted.
  if (answer.state !== 'readable') return UNRESOLVED;
  // Built at render, from the row with the fields this viewer may not read
  // removed, so a policy that loads after the row relabels the cell.
  const shown = withoutDeniedFields(answer.record, perms, record.object, [record.storeField]);
  return { state: 'resolved', label: recipientCandidateLabel(record.labelFields, shown) };
}
