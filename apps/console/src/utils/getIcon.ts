/**
 * Icon utilities
 *
 * Synchronous accessor that returns a lazy-loaded Lucide icon React component.
 *
 * ## Delegated rather than transcribed (objectui#9204)
 *
 * This was a third copy of `@object-ui/components`' `getLazyIcon` — the same
 * kebab-casing, the same memo, the same `Database` fallback — differing only in
 * that it skipped the name check and let lucide log "Name in Lucide DynamicIcon
 * not found" for an off-catalog name. Its `lucide-react/dynamic` import put
 * lucide's 2,025-entry dynamic-import map on the console's eager path; the
 * shared resolver keeps the icon NAMES as data and fetches the map through
 * `import()` on first use.
 *
 * The result is memoised per name inside that resolver, so call sites still get
 * a *stable* component reference across renders — nothing is created during
 * render. `react-hooks/static-components` cannot see through the call, so the
 * JSX sites that render the result carry a targeted disable pointing back here.
 */

export { getLazyIcon as getIcon } from '@object-ui/components';
