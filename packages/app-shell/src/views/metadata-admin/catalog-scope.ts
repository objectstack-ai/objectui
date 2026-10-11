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
 * The catalog types Setup administers through this scope. Each name is also
 * the activation ledger's `metadata_type` and the activation door's `:type`
 * (see `catalog-activation.ts`). `capability` is absent: the Capabilities page
 * and the capability picker still read `sys_capability` rows, and moving them
 * onto the registry is objectui#7611's follow-up. (The registry serves the
 * platform's own capabilities since objectstack#22669, #15204 stage 6b-1a;
 * before it, it served the package-declared ones only.) A capability has no
 * switch either: ADR-0126 §3 makes it code-only, and the activation door
 * refuses the type with `400`.
 */
export const SETUP_CATALOG_TYPES = ['permission', 'position'] as const;
