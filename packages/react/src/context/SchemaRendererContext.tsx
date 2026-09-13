import React, { createContext, useContext, useMemo } from 'react';
import type { DebugFlags } from '@object-ui/core';
import type { DataSource } from '@object-ui/types';

/**
 * Host-provided fetch used for `provider: 'api'` view data sources so custom
 * endpoints carry the same credentials (Authorization, tenant, locale headers)
 * as the native data channel. Optional — when absent, ApiDataSource falls back
 * to the bare global fetch (cookies only).
 */
export type ApiFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

interface SchemaRendererContextType {
  /**
   * The adapter the host injected, as the published `DataSource` contract
   * declares it (objectui#7912).
   *
   * Typed, not `any`: this is the injection point for the ENTIRE renderer tree,
   * and `useSchemaContext()` hands whatever is declared here to every consumer
   * that reads it back. While it was `any`, a bare string passed where the
   * host's adapter belongs raised nothing at compile time and failed at runtime
   * on the first `find()` — the shape of a config value read from the wrong
   * place. The type was never unknown: `@object-ui/types` exports `DataSource`,
   * `useSettledSchema` in this same package already declares its parameter as
   * `DataSource<any> | null | undefined`, and `app-shell`'s README writes
   * `DataSource` against this very seam.
   *
   * `null | undefined` are part of the contract, not a weakening of it: a host
   * renders with no adapter bound (a Studio preview, a react page before the
   * AdapterProvider connects, a widget test that drives `apiFetch` alone), and
   * every reader in the tree already guards for it. The union states the three
   * states that actually occur and refuses everything else — a string, `{}`, a
   * plain data bag, a partial adapter missing a required member. It is spelled
   * exactly as `useSettledSchema` spells it, one hop away.
   */
  dataSource: DataSource | null | undefined;
  debug?: boolean;
  debugFlags?: DebugFlags;
  apiFetch?: ApiFetch;
}

const SchemaRendererContext = createContext<SchemaRendererContextType | null>(null);

export { SchemaRendererContext };

export const SchemaRendererProvider = ({
  children,
  dataSource,
  debug,
  debugFlags,
  apiFetch,
}: {
  children: React.ReactNode;
  /** The host's adapter — see {@link SchemaRendererContextType.dataSource}. */
  dataSource: DataSource | null | undefined;
  debug?: boolean;
  debugFlags?: DebugFlags;
  apiFetch?: ApiFetch;
}) => {
  // Nested providers (react-page, studio preview surfaces) re-wrap with their
  // own dataSource but rarely know about the host's authenticated fetch —
  // inherit it from the parent context so provider:'api' auth survives nesting.
  const parent = useContext(SchemaRendererContext);
  const effectiveApiFetch = apiFetch ?? parent?.apiFetch;
  const value = useMemo(
    () => ({ dataSource, debug, debugFlags, apiFetch: effectiveApiFetch }),
    [dataSource, debug, debugFlags, effectiveApiFetch],
  );
  return (
    <SchemaRendererContext.Provider value={value}>
      {children}
    </SchemaRendererContext.Provider>
  );
};

export const useSchemaContext = () => {
  const context = useContext(SchemaRendererContext);
  if (!context) {
    throw new Error('useSchemaContext must be used within a SchemaRendererProvider');
  }
  return context;
};

export const useDataScope = (path?: string) => {
  const context = useContext(SchemaRendererContext);
  const dataSource = context?.dataSource;
  if (!path) return undefined;
  if (!dataSource) return undefined;
  // Simple path resolution for now. In real app might be more complex.
  //
  // The accumulator is `any` BY DECLARATION, not by inheritance: this walk
  // addresses arbitrary member names on the injected value, and `DataSource`
  // declares none of them, so indexing it by a path segment is an error the
  // moment the seam above stops being `any` (objectui#7912). The hook's
  // published return type is unchanged — it was `any` before this annotation
  // and it is `any` after it, so no reader of `useDataScope` moves.
  //
  // ⚠️ What the type now makes visible: against a REAL adapter every path
  // resolves to `undefined`, because an adapter has no `users`/`value` member
  // to walk. Hosts that get data out of this hook are injecting a data bag
  // through a key the contract says is an adapter. Whether that second meaning
  // becomes real or is retired is NOT decided here — same shape, and the same
  // deliberate non-decision, as the `ctx?.formValues ?? ctx?.data` tail on
  // objectui#7206.
  return path.split('.').reduce<any>((acc, part) => acc && acc[part], dataSource);
}
