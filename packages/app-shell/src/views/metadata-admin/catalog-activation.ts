// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * The ACTIVE switch of a Setup catalog item — the one seam on the Setup
 * catalog pages that still reads and writes a catalog ROW (objectui#7611).
 *
 * ## Where the switch belongs, and why it is not there yet
 *
 * ADR-0126 §3, as ADR-0131 D6 amends it, puts `permission` in Regime C
 * ("disable + clone", landed machinery that converges later — §8) and
 * pre-charts `position` there: disabling is one `active` bit of
 * deployment-level state in the tenant-less activation ledger
 * `sys_metadata_activation`, written by the enable/disable doors. Measured on
 * objectstack `main` for objectui#7611: the ledger has exactly two write
 * doors, `POST /automation/:name/toggle` and
 * `POST /actions/_activation/:object/:action`, and each fixes its own
 * `metadata_type` (`flow`, `action`), so neither accepts `permission` or
 * `position`; and the authorization resolver still reads the row's flag
 * (`isRowActive`). Until the server opens a ledger door for the two types and
 * moves its consult point onto it, a switch wired to the ledger would flip a
 * bit nothing reads.
 *
 * So the switch keeps TODAY's behaviour: the row's `active` column through
 * the data door, which is exactly what the Setup object pages' Activate and
 * Deactivate actions write (`PATCH /api/v1/data/<object>/<id>` with
 * `{ active }`). The data door decides who may write it — measured: the
 * platform administrator may, an organization administrator is refused.
 *
 * ## Why this is a seam and not a second list
 *
 * The page's ITEMS are the registry's (ADR-0131 D7: one list, never merged
 * with a database list). This module only answers, per listed item NAME, the
 * one fact the registry does not carry yet, the way Setup › Packaged
 * automation joins the engine's activation state onto the `flow` items
 * (`views/setup/packagedFlows.ts`). A row with no registry item is never
 * listed, and an item with no row has no switch — that is the honest state of
 * a position authored through the metadata door, which the server gives no
 * row (measured on objectstack `main`).
 *
 * ⛔ Nothing else on the Setup catalog pages reads a catalog row. When the
 * ledger door lands, this file is what changes, and the pages do not.
 */

import { SETUP_CATALOG_TYPES } from './catalog-scope.js';

/** One catalog row's activation state, keyed by the item's machine name. */
export interface CatalogRowState {
  /** The row's id — the data door addresses the row by it. */
  id: string;
  /** The row's flag. A row that omits it is active (the column's default). */
  active: boolean;
}

/** The data-door calls this module makes, as `DataSource` declares them. */
export interface CatalogRowDoor {
  find(resource: string, params?: Record<string, unknown>): Promise<unknown>;
  update(resource: string, id: string, data: Record<string, unknown>): Promise<unknown>;
}

/** Rows of a `find()` answer, read as `QueryResult` declares them (`data`). */
function rowsOf(res: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(res)) return res as Array<Record<string, unknown>>;
  const data = (res as { data?: unknown } | null | undefined)?.data;
  return Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
}

/** Does Setup offer an active switch for this catalog type at all? */
export function hasCatalogActivation(type: string): boolean {
  return Object.prototype.hasOwnProperty.call(SETUP_CATALOG_TYPES, type);
}

/**
 * The activation state of every catalog row of `type`, by item name. An empty
 * map for a type without a switch. A rejected read propagates: the caller
 * shows the switch as unknown rather than as "active".
 */
export async function readCatalogRowStates(
  door: CatalogRowDoor,
  type: string,
): Promise<Map<string, CatalogRowState>> {
  const out = new Map<string, CatalogRowState>();
  const target = SETUP_CATALOG_TYPES[type];
  if (!target) return out;
  const rows = rowsOf(
    await door.find(target.rowObject, { $select: ['id', 'name', 'active'], $top: 1000 }),
  );
  for (const row of rows) {
    const name = row?.name;
    const id = row?.id;
    if (typeof name !== 'string' || !name || id == null) continue;
    out.set(name, { id: String(id), active: row.active !== false });
  }
  return out;
}

/** Flip one catalog item's flag through the row the data door addresses. */
export async function writeCatalogActive(
  door: CatalogRowDoor,
  type: string,
  rowId: string,
  active: boolean,
): Promise<void> {
  const target = SETUP_CATALOG_TYPES[type];
  if (!target) throw new Error(`No activation for metadata type '${type}'`);
  await door.update(target.rowObject, rowId, { active });
}
