// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Where an installed package came from — the Packages page's Source column
 * and its Source filter (objectui#12675, ruling B on objectstack#23892).
 *
 * Setup's Packages is the ONE list of what is installed, so each row says
 * which of three origins it has. The set is CLOSED: `code` / `marketplace` /
 * `authored`, and nothing else is ever drawn. A row whose origin cannot be
 * read from the signals below is refused at this boundary with a named code,
 * never rendered with an empty cell.
 *
 * ## Each value traces to one named signal
 *
 * `/api/v1/packages` serves no source key (`InstalledPackageSchema` in
 * `@objectstack/spec/kernel` declares none). Two reads the console already
 * makes answer it between them:
 *
 *  - `writable`, the top-level verdict every `/api/v1/packages` row carries
 *    (objectstack#14375, ADR-0070 D2). The server computes it with
 *    `isWritablePackage`: `false` for a package registered from an artifact
 *    (`engine.manifests` — a booted code package, AND a marketplace install,
 *    which install-local registers through the same `registerApp`) or with a
 *    platform scope; `true` for a database-authored base. So `true` ⇒
 *    `authored`. `studio-design/packages-io` reads the same verdict for the
 *    Studio switcher; this module reads it strictly — an absent or non-boolean
 *    value is a refusal here, not the switcher's scope heuristic.
 *  - the marketplace slice's own installed list — the read the Installed Apps
 *    list made (`readMarketplaceInstalls`: the control plane's list when the
 *    environment is cloud-connected, the runtime's install-local ledger
 *    otherwise). A non-writable row whose id is in it ⇒ `marketplace`; one that
 *    is not ⇒ `code`.
 *
 * A row that is BOTH writable and in the marketplace list contradicts the
 * server's own verdict (a marketplace install is never writable), so it is
 * refused too rather than resolved by picking a side.
 *
 * ⚠️ `writable` is served and pinned by objectstack's dispatcher
 * (`packages-serializable-response.test.ts`) but is not declared on the spec's
 * response schema; the contract-first form of this read is a declared key on
 * the served row, which is the objectstack half named in this card's report.
 */

/** The closed set of origins, in the order the filter and the column list them. */
export const PACKAGE_SOURCES = ['code', 'marketplace', 'authored'] as const;

export type PackageSource = (typeof PACKAGE_SOURCES)[number];

/**
 * The Packages page's Source filter, spelled as ONE URL query param.
 *
 * `/apps/APP/component/developer/packages?source=marketplace` opens the list
 * filtered; a Setup nav item reaches the same URL by declaring
 * `{ type: 'component', componentRef: 'developer:packages', params: { source: 'marketplace' } }`,
 * because the sidebar forwards a component item's `params` as the query string.
 * Page-local, so it lives here and not in the console's reserved `urlParams`.
 */
export const PACKAGES_SOURCE_PARAM = 'source';

export type PackageSourceRefusalCode =
  /** The row carries no boolean `writable` verdict, so its origin is unknown. */
  | 'PACKAGE_SOURCE_UNKNOWN'
  /** The row is writable AND listed by the marketplace: the signals disagree. */
  | 'PACKAGE_SOURCE_CONFLICT'
  /** `?source=` names a value outside {@link PACKAGE_SOURCES}. */
  | 'PACKAGE_SOURCE_FILTER_UNKNOWN'
  /** `?source=` appears more than once. */
  | 'PACKAGE_SOURCE_FILTER_REPEATED';

/** A refusal at the Source boundary, naming what it refused. */
export class PackageSourceRefusal extends Error {
  readonly code: PackageSourceRefusalCode;
  /** The package id, or the filter value(s), the refusal is about. */
  readonly subject: string;

  constructor(code: PackageSourceRefusalCode, subject: string) {
    super(`${code}: ${subject}`);
    this.name = 'PackageSourceRefusal';
    this.code = code;
    this.subject = subject;
  }
}

export function isPackageSource(value: unknown): value is PackageSource {
  return typeof value === 'string' && (PACKAGE_SOURCES as readonly string[]).includes(value);
}

/**
 * The origin of one `/api/v1/packages` row. Throws {@link PackageSourceRefusal}
 * when the signals cannot name one.
 *
 * @param marketplaceIds manifest ids the marketplace slice lists as installed;
 *   empty when the marketplace capability is absent (nothing is a marketplace
 *   install there).
 */
export function resolvePackageSource(
  row: { manifest: { id: string }; writable?: unknown },
  marketplaceIds: ReadonlySet<string>,
): PackageSource {
  const id = row.manifest.id;
  if (typeof row.writable !== 'boolean') {
    throw new PackageSourceRefusal('PACKAGE_SOURCE_UNKNOWN', id);
  }
  const listed = marketplaceIds.has(id);
  if (row.writable) {
    if (listed) throw new PackageSourceRefusal('PACKAGE_SOURCE_CONFLICT', id);
    return 'authored';
  }
  return listed ? 'marketplace' : 'code';
}

/**
 * The Source filter the URL asks for: `null` when absent. Throws
 * {@link PackageSourceRefusal} for a value outside the closed set or a repeated
 * param — a filter that silently matched nothing (or everything) would read as
 * a served answer.
 *
 * @param values every occurrence of {@link PACKAGES_SOURCE_PARAM}
 *   (`URLSearchParams.getAll`).
 */
export function readSourceFilter(values: readonly string[]): PackageSource | null {
  if (values.length === 0) return null;
  if (values.length > 1) {
    throw new PackageSourceRefusal('PACKAGE_SOURCE_FILTER_REPEATED', values.join(', '));
  }
  const [value] = values;
  if (!isPackageSource(value)) {
    throw new PackageSourceRefusal('PACKAGE_SOURCE_FILTER_UNKNOWN', value);
  }
  return value;
}

/** The Packages route, optionally filtered to one Source. */
export function packagesHref(basePath: string, source?: PackageSource): string {
  const path = `${basePath}/component/developer/packages`;
  return source ? `${path}?${PACKAGES_SOURCE_PARAM}=${source}` : path;
}
