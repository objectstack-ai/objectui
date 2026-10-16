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
 * ## The edit widgets' own lists, read once per page
 *
 * A cell names a stored value from the very list its edit widget offers:
 *
 *   - `object-ref` → the registered-object catalog, `loadObjectCatalog`
 *     (`./objectCatalog.ts`), the read `ObjectRefField` makes;
 *   - a record kind (`user`, `team`, `business_unit`, `unit_and_subordinates`)
 *     → `loadRecipientCandidates` (`./recipientKinds.ts`), the picker's one
 *     candidate query, labelled with the kind's `labelFields`;
 *   - a registry kind (`position`) → the console's metadata store,
 *     `ensureType(<type>)`, the reader `RecipientPickerField` lists it with;
 *   - the `field` kind → the shared object's schema through
 *     `deriveUserFields`, the picker's own column derivation.
 *
 * Each list is a CATALOG: read the first time any cell asks it, once per data
 * source, and every cell of every row answered from it. A grid page of fifty
 * rules costs one read per list it names, not fifty — and a value reads in the
 * list exactly as it reads in the open picker, including the picker's bound (a
 * record past the candidate query's first 500 is not offered, and not named).
 *
 * ## The four answers a cell gets
 *
 *   - `unasked` — the edit widget could not list it either: no data source, no
 *     sibling kind, a kind it does not know, no metadata store for a registry
 *     kind. The cell draws the stored text exactly as the text cell did before
 *     it existed, so a call site that cannot supply what the cell needs
 *     changes nothing.
 *   - `pending` — asked, not answered yet. Drawn the same as `unasked`.
 *   - `resolved` — the label.
 *   - `unresolved` — the list was read and does not hold the value (a deleted
 *     record, a renamed object), or the read failed (no read access). The cell
 *     draws the raw stored value, muted, never a blank.
 *
 * ## Cache lifetime
 *
 * Answers live for the data source's lifetime, which is the page session: a
 * display label, not a decision input, so an item renamed mid-session reading
 * its old label until reload is the right trade (the same one the approver
 * directory in `@object-ui/app-shell` makes). Keyed by the data source object,
 * so two hosts, and two tests, never share an answer.
 *
 * ## Why this module is small
 *
 * Every `packages/fields` module rides the console's eager `ui-components`
 * chunk, whatever imports it lazily (`scripts/vite-ineffective-dynamic-imports.ts`
 * says why), and that chunk has a ceiling of its own in
 * `scripts/check-eager-closure-budget.mjs`. One catalog mechanism serves all
 * five lists for that reason: a second one (a batched `$in` reader for the
 * record kinds) cost a page-load payload the budget refused.
 */

import React from 'react';
import { MetadataCtx, SchemaRendererContext } from '@object-ui/react';
import type { DataSource } from '@object-ui/types';
import { loadObjectCatalog } from './objectCatalog.js';
import {
  FIELD_RECIPIENT_TYPE,
  TYPE_TO_OBJECT,
  TYPE_TO_REGISTRY,
  loadRecipientCandidates,
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

/** A list's name → label pairs, or `null` when its read failed. */
type Catalog = ReadonlyMap<string, string> | null;
type CatalogLoad = () => Promise<ReadonlyMap<string, string>>;

/** Every answer one data source has given, and the reads still in flight. */
class LabelBook {
  private readonly entries = new Map<string, RefLabel>();
  private readonly listeners = new Set<() => void>();
  private readonly catalogs = new Map<string, Promise<Catalog>>();

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  read(key: string): RefLabel | undefined {
    return this.entries.get(key);
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
      const label = map?.get(name);
      this.entries.set(key, label === undefined ? UNRESOLVED : Object.freeze({ state: 'resolved', label }));
      for (const listener of [...this.listeners]) listener();
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
 * The one store subscription both cells make: `name` asked of the catalog
 * `catalogId` names (`''` = nothing can be asked), loaded by `load`. `load` is
 * read through a ref so a render's fresh closure never re-subscribes a cell.
 */
function useCatalogLabel(dataSource: DataSource | null, catalogId: string, name: string, load: CatalogLoad): RefLabel {
  const book = catalogId && dataSource ? bookFor(dataSource) : null;
  const key = JSON.stringify([catalogId, name]);
  const loadRef = React.useRef(load);
  // An effect, so it runs before the subscription's own effect below.
  React.useEffect(() => {
    loadRef.current = load;
  });
  const subscribe = React.useCallback(
    (listener: () => void) => {
      if (!book) return noSubscription();
      const off = book.subscribe(listener);
      book.ask(catalogId, name, key, () => loadRef.current());
      return off;
    },
    [book, catalogId, name, key],
  );
  const getSnapshot = React.useCallback(() => (book ? book.read(key) ?? PENDING : UNASKED), [book, key]);
  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** The registered object a stored `object-ref` value names. */
export function useObjectRefLabel(value: unknown): RefLabel {
  const dataSource = React.useContext(SchemaRendererContext)?.dataSource ?? null;
  const canList = typeof dataSource?.getObjects === 'function' || typeof dataSource?.find === 'function';
  return useCatalogLabel(dataSource, typeof value === 'string' && value && canList ? 'object' : '', String(value), async () => {
    const rows = await loadObjectCatalog(dataSource);
    return new Map(rows.map((row) => [row.name, row.label ?? '']));
  });
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
  // Read raw, as the picker reads it: an absent store and an empty registry
  // are different facts. Through a ref, because the store's context value is
  // rebuilt whenever any type it caches settles (AGENTS.md #10).
  const metadataStore = React.useContext(MetadataCtx);
  const storeRef = React.useRef(metadataStore);
  React.useEffect(() => {
    storeRef.current = metadataStore;
  });
  // The same sibling reads the edit widget makes: `recipient_type` picks the
  // kind, and in `field` mode `object_name` names the object whose columns
  // are offered — both declared in the field's own `dependsOn`.
  const kind = String(dependentValues?.recipient_type ?? '');
  const objectName = String(dependentValues?.object_name ?? '');
  const record = TYPE_TO_OBJECT[kind];
  const registry = TYPE_TO_REGISTRY[kind];
  const catalogId =
    !dependentValues || typeof value !== 'string' || !value
      ? ''
      : record
        ? typeof dataSource?.find === 'function' ? `record:${kind}` : ''
        : registry
          ? metadataStore ? `registry:${registry.type}` : ''
          : kind === FIELD_RECIPIENT_TYPE && objectName && typeof dataSource?.getObjectSchema === 'function'
            ? `field:${objectName}`
            : '';
  return useCatalogLabel(dataSource, catalogId, String(value), async () => {
    // `catalogId` is '' without a data source, so no load runs without one.
    if (!dataSource) return new Map();
    if (record) {
      const rows = await loadRecipientCandidates(dataSource, record);
      return new Map(rows.map((row) => [String((row as Record<string, unknown>)?.[record.storeField] ?? ''), recipientCandidateLabel(record.labelFields, row)]));
    }
    if (registry) {
      const items = (await storeRef.current?.ensureType(registry.type)) ?? [];
      return new Map(
        (Array.isArray(items) ? items : [])
          .filter((item) => typeof item?.name === 'string' && item.name)
          .map((item) => [item.name as string, recipientCandidateLabel(registry.labelFields, item)]),
      );
    }
    return new Map(deriveUserFields(await dataSource.getObjectSchema(objectName)).map((f) => [f.name, f.label]));
  });
}
