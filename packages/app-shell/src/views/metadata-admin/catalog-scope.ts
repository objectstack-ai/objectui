// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * The ENVIRONMENT scope of the metadata-admin pages — the Setup catalog
 * (objectui#7611, objectstack ADR-0131 D3/D7).
 *
 * ## Why a scope and not a page family
 *
 * ADR-0131 D3 gives positions and permission sets one home, the environment
 * registry, and D7 says the Setup pages list that registry. The ruling that
 * unblocked objectui#7611 says how: "Build it by reuse, not by new pages" — the
 * Setup catalog pages are the console's existing metadata-admin list and
 * editors, re-routed and re-gated for Setup. So the catalog is the same
 * `…/metadata/:type` route with one URL parameter, `scope=environment`:
 *
 *   - the LIST stops scoping to one project package (the Studio rule, under
 *     which a platform-shipped set such as `admin_full_access` is never
 *     listed) and lists every item the registry serves for the type, with its
 *     provenance;
 *   - the EDITORS add the Setup half beside the definition: who holds a
 *     permission set, who holds a position.
 *
 * The scope is addressable state (AGENTS.md #8), so it lives in the URL and
 * every link the pages emit carries it on: the item links, the create link,
 * the breadcrumb back to the list. The Setup navigation and the console's
 * legacy `system/*` URLs land on it.
 *
 * ⛔ It is a VIEW scope, never an authority: the server decides every write,
 * and the read-only gates read the caller's capabilities (`useCanAuthorMetadata`)
 * and the deployment's posture, not this parameter.
 */

/** The query parameter carrying the scope. Page-local to metadata-admin. */
export const CATALOG_SCOPE_PARAM = 'scope';

/** The one value it takes: the environment catalog Setup administers. */
export const ENVIRONMENT_SCOPE = 'environment';

/** Read-only view of a URL's query, as `useSearchParams` hands it out. */
interface QueryLike {
  get(name: string): string | null;
}

/** Is this URL the environment (Setup catalog) scope? */
export function isEnvironmentScope(search: QueryLike): boolean {
  return search.get(CATALOG_SCOPE_PARAM) === ENVIRONMENT_SCOPE;
}

/** `scope=environment`, ready to join into a query string. */
export const ENVIRONMENT_SCOPE_QUERY = `${CATALOG_SCOPE_PARAM}=${ENVIRONMENT_SCOPE}`;

/**
 * The query suffix a link on an environment-scope page appends so the next
 * page stays in that scope — `?scope=environment`, or `''` outside it.
 */
export function environmentScopeSuffix(search: QueryLike): string {
  return isEnvironmentScope(search) ? `?${ENVIRONMENT_SCOPE_QUERY}` : '';
}

/**
 * The catalog types Setup administers through this scope, with the data
 * object that still holds each one's ACTIVE flag (see `catalog-activation.ts`).
 * `capability` is deliberately absent: `GET /api/v1/meta/capability` serves the
 * package-declared capabilities only, not the platform's own (objectui#7611
 * measured 2 of 11 on the showcase), so a Setup page reading it would show
 * less than the page it replaces.
 */
export const SETUP_CATALOG_TYPES: Readonly<Record<string, { rowObject: string }>> = {
  permission: { rowObject: 'sys_permission_set' },
  position: { rowObject: 'sys_position' },
};
