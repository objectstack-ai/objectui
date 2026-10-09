/**
 * Approval requests as a standard `DataSource` (objectui#12032, A1 of the
 * approvals rebuild objectui#2763).
 *
 * The standard renderers read approval requests through this source:
 * `ListView` for a list, `RecordDetailView` for one request. Both take ONE
 * `dataSource`. `RecordDetailView` also sends its side reads through it
 * (`sys_user`, comments, activities, history). So this source routes. Reads of
 * `sys_approval_request` go to the approvals routes through the existing
 * `provider: 'api'` door (`ApiDataSource`). Every other resource, and every
 * other method, goes to the host adapter unchanged. The rows come back exactly
 * as the approvals service serves them, so `viewer` (list and get) and
 * `decision_progress` (get only, by contract) are ordinary fields a view binds.
 *
 * ## One source per scope
 *
 * The inbox's three lists are SERVER-SIDE scopes on `GET /approvals/requests`,
 * never client filters. A scope is fixed when the source is built and rides on
 * every list request as the door's `read.params`:
 *
 *   - `awaiting_me`     → `status=pending&approverId=<every identity, comma-joined>`
 *   - `submitted_by_me` → `submitterId=<the user>`
 *   - `all`             → nothing
 *
 * A scope that names no identity (no approver identity, no submitter id) reads
 * as an empty list and sends no request, as the inbox does. ⛔ It never falls
 * through to the unscoped list: that would show every request to someone who
 * asked for "mine".
 *
 * ## The list speaks the route's own names, and refuses the rest
 *
 * The approvals list route has a CLOSED parameter set. It accepts `object`,
 * `recordId`, `status`, `approverId`, `submitterId`, `q`, `limit` and `offset`,
 * and answers any other name with a 400 (objectstack's
 * `APPROVAL_REQUEST_LIST_PARAMS`). `ListView` speaks the data API's `$` names.
 * So each list read is translated here:
 *
 *   - `$top` → `limit`, `$skip` → `offset`, `$search` → `q`;
 *   - `$select` is dropped. The route has no projection, so dropping it widens
 *     the columns that come back, never the rows;
 *   - every other name (`$filter`, `$orderby`, `$expand`, `$searchFields`, …)
 *     is REFUSED with a thrown `UNSUPPORTED_QUERY_PARAM` error before any request
 *     goes out, so `ListView` shows its error panel. ⛔ It is never dropped: a
 *     dropped filter is a list of rows the viewer did not ask for, shaped
 *     exactly like the right answer.
 *
 * ## The get reads one request, with no parameters
 *
 * `GET /approvals/requests/:id` reads no query parameters, so the get goes
 * through a door with no scope params and sends none of the caller's
 * `QueryParams`. `RecordDetailView` asks for `$expand` on every declared
 * relation, and this route has no expansion; it serves its own display names
 * instead (`submitter_name`, `record_title`, …). A 404 resolves `null` (not
 * found). Every other failure rejects, so the record page can say "no access" or
 * "could not load" (the door's `findOne` contract).
 *
 * ## Other reads of approval requests are refused, not forwarded
 *
 * The host adapter's other row-reading methods (`aggregate`,
 * `queryGroupHeaders`, `exportDownload`) would read `sys_approval_request`
 * through the data API: outside the scope and without `viewer`. Called for
 * approval requests, they reject with the same `UNSUPPORTED_QUERY_PARAM`
 * refusal. For every other resource they are the host's.
 */
import { ApiDataSource } from '@object-ui/core';
import { createAuthenticatedFetch } from '@object-ui/auth';
import type { DataSource, QueryParams, QueryResult } from '@object-ui/types';
import { API_BASE, type ApprovalRequestRow } from './approvalsApi';

/** The object whose reads this source routes to the approvals routes. */
export const APPROVAL_REQUEST_OBJECT = 'sys_approval_request';

/** The inbox's three server-side scopes. */
export type ApprovalRequestScope =
  | { kind: 'awaiting_me'; approverIds: readonly string[] }
  | { kind: 'submitted_by_me'; submitterId: string | null | undefined }
  | { kind: 'all' };

export interface ApprovalRequestsDataSourceOptions {
  /** The adapter every other resource and method goes to (the console's own). */
  host: DataSource;
  /** The list this source serves. */
  scope: ApprovalRequestScope;
  /** Transport. Defaults to the console's authenticated fetch (Bearer + tenant). */
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  /** API root. Defaults to the one `approvalsApi` uses. */
  baseUrl?: string;
}

/** The `$` names the list translates, and the route name each becomes. */
const TRANSLATED: Readonly<Record<string, string>> = {
  $top: 'limit',
  $skip: 'offset',
  $search: 'q',
};

/** A projection: dropping it widens columns, never rows. */
const DROPPED = new Set(['$select']);

/** Host methods that read rows of a resource; refused for approval requests. */
const REFUSED_HOST_READS = new Set(['aggregate', 'queryGroupHeaders', 'exportDownload']);

/** The refusal `ListView` classifies as a rejected query (its error panel). */
function refusal(what: string): Error & { code: string } {
  const err = new Error(
    `${APPROVAL_REQUEST_OBJECT}: the approvals list cannot honour ${what}. ` +
      'It pages (limit, offset) and searches (q) within its scope, and nothing else.',
  ) as Error & { code: string };
  err.code = 'UNSUPPORTED_QUERY_PARAM';
  return err;
}

/** An absent value, as the door's own query flattening reads one. */
function isAbsent(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  return false;
}

/** The route parameters for one list read, or a thrown refusal. */
function toListQuery(params: QueryParams | undefined): Record<string, unknown> {
  const query: Record<string, unknown> = {};
  const refused: string[] = [];
  for (const [key, value] of Object.entries(params ?? {})) {
    if (isAbsent(value)) continue;
    const name = TRANSLATED[key];
    if (name) query[name] = typeof value === 'string' ? value.trim() : value;
    else if (!DROPPED.has(key)) refused.push(key);
  }
  if (refused.length > 0) throw refusal(refused.sort().join(', '));
  return query;
}

/** The scope's route parameters, or `null` when it names no identity. */
function toScopeParams(scope: ApprovalRequestScope): Record<string, string> | null {
  switch (scope.kind) {
    case 'awaiting_me': {
      const ids = scope.approverIds.map((id) => String(id).trim()).filter(Boolean);
      return ids.length > 0 ? { status: 'pending', approverId: ids.join(',') } : null;
    }
    case 'submitted_by_me': {
      const id = String(scope.submitterId ?? '').trim();
      return id ? { submitterId: id } : null;
    }
    case 'all':
      return {};
  }
}

/**
 * Build the routed source for one scope. Hand it to `ListView` /
 * `RecordDetailView` as their `dataSource`; mount one per scope.
 */
export function createApprovalRequestsDataSource(
  options: ApprovalRequestsDataSourceOptions,
): DataSource {
  const { host, scope } = options;
  const fetchFn = options.fetch ?? createAuthenticatedFetch();
  const url = `${(options.baseUrl ?? API_BASE).replace(/\/+$/, '')}/approvals/requests`;
  const scopeParams = toScopeParams(scope);
  const itemDoor = new ApiDataSource<ApprovalRequestRow>({ read: { url, method: 'GET' }, fetch: fetchFn });

  const find = async (resource: string, params?: QueryParams): Promise<QueryResult<unknown>> => {
    if (resource !== APPROVAL_REQUEST_OBJECT) return host.find(resource, params);
    const query = toListQuery(params);
    if (scopeParams === null) return { data: [], total: 0 };
    const listDoor = new ApiDataSource<ApprovalRequestRow>({
      read: { url, method: 'GET', params: { ...scopeParams, ...query } },
      fetch: fetchFn,
    });
    return listDoor.find(resource);
  };

  const findOne = async (resource: string, id: string, params?: QueryParams): Promise<unknown> => {
    if (resource !== APPROVAL_REQUEST_OBJECT) return host.findOne(resource, id, params);
    return itemDoor.findOne(resource, encodeURIComponent(id));
  };

  // Every other member is the host's, bound to it, and cached per host function
  // so a consumer reads one identity for a method across renders.
  const bound = new Map<PropertyKey, { source: unknown; fn: unknown }>();
  return new Proxy(host, {
    get(target, prop) {
      if (prop === 'find') return find;
      if (prop === 'findOne') return findOne;
      const value = Reflect.get(target, prop, target);
      if (typeof value !== 'function') return value;
      const hit = bound.get(prop);
      if (hit && hit.source === value) return hit.fn;
      const method = value as (...args: unknown[]) => unknown;
      const fn =
        typeof prop === 'string' && REFUSED_HOST_READS.has(prop)
          ? (resource: unknown, ...rest: unknown[]) =>
              resource === APPROVAL_REQUEST_OBJECT
                ? Promise.reject(refusal(prop))
                : method.call(target, resource, ...rest)
          : method.bind(target);
      bound.set(prop, { source: value, fn });
      return fn;
    },
  });
}
