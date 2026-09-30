// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * useObjectFields — loads an Object's field catalog for the View column
 * configurator's "Available fields" pane.
 *
 * Reads `object.fields` (record OR array shape) via the shared
 * MetadataClient and normalizes it into a flat, ordered list the picker
 * can render. Hidden fields are kept (admins legitimately surface them)
 * but flagged so the picker can de-emphasize them.
 *
 * The hook is defensive: a missing object name, a 404, or a transport
 * error all resolve to an empty list with `error` set, so the configurator
 * can gracefully fall back to manual column entry.
 */

import * as React from 'react';
import { useMetadataClient } from '../useMetadata.js';
import { t, useMetadataLocale } from '../i18n.js';
import { readFields } from './object-fields-io.js';

export interface ObjectFieldInfo {
  /** snake_case API name. */
  name: string;
  /** Human label (falls back to the name). */
  label: string;
  /** Raw field type id (e.g. 'text', 'lookup'). */
  type: string;
  hidden: boolean;
  /**
   * `true` when the object declares the field `required` — the write-time
   * contract the server enforces on every save. Absent otherwise.
   *
   * Carried for the view inspector's refusal of a required field placed in a
   * predicate-gated form section (objectui#6900): the served object document
   * already holds the flag, so this is the same payload read once more, not a
   * second data path. Hosts that pass an override catalog and leave it out get
   * no such refusal.
   */
  required?: boolean;
}

export interface UseObjectFieldsResult {
  fields: ObjectFieldInfo[];
  loading: boolean;
  error: string | null;
}

export function useObjectFields(
  objectName: string | undefined,
  /**
   * Pre-resolved field catalog. When supplied the hook skips the network
   * fetch entirely and returns this list verbatim — used by hosts that
   * already hold the object definition (e.g. the runtime ViewConfigPanel,
   * which reads `objectDef.fields`) so the inspector has zero network
   * dependency.
   */
  override?: ObjectFieldInfo[],
): UseObjectFieldsResult {
  const client = useMetadataClient();
  // The designer locale the hook's own not-found sentence reads in
  // (objectui#10862). The fetch records THAT the object was not found, and the
  // row is read here, where the hook returns, so a language switch re-reads it
  // without a refetch. A transport error is the transport's message and
  // passes through as it came.
  const locale = useMetadataLocale();
  const [state, setState] = React.useState<{ result: UseObjectFieldsResult; notFound: boolean }>({
    result: {
      fields: [],
      loading: !override && !!objectName,
      error: null,
    },
    notFound: false,
  });

  React.useEffect(() => {
    // Override short-circuits the fetch: trust the caller-supplied catalog.
    if (override) {
      setState({ result: { fields: override, loading: false, error: null }, notFound: false });
      return;
    }
    if (!objectName) {
      setState({ result: { fields: [], loading: false, error: null }, notFound: false });
      return;
    }
    let cancelled = false;
    setState((s) => ({ result: { ...s.result, loading: true, error: null }, notFound: false }));
    client
      .get<Record<string, unknown>>('object', objectName)
      .then((obj) => {
        if (cancelled) return;
        if (!obj) {
          setState({ result: { fields: [], loading: false, error: null }, notFound: true });
          return;
        }
        const view = readFields((obj as any).fields);
        const fields: ObjectFieldInfo[] = view.entries.map((e) => ({
          name: e.name,
          label:
            typeof e.def.label === 'string' && e.def.label
              ? (e.def.label as string)
              : e.name,
          type: typeof e.def.type === 'string' ? (e.def.type as string) : 'text',
          hidden: e.def.hidden === true,
          ...(e.def.required === true ? { required: true } : {}),
        }));
        setState({ result: { fields, loading: false, error: null }, notFound: false });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          result: {
            fields: [],
            loading: false,
            error: err?.message ?? String(err),
          },
          notFound: false,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [client, objectName, override]);

  return state.notFound ? { ...state.result, error: t('engine.form.objectNotFound', locale) } : state.result;
}
