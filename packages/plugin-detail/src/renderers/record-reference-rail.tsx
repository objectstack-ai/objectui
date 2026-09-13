/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * `record:reference_rail` — Compact reference panel for the record's
 * related collections. Lives in the page schema's `aside` region and
 * gives users a HubSpot/Dynamics-style "Reference Panel" snapshot of
 * related data without leaving the Details tab.
 *
 * Each entry renders a tight card with:
 *   - localized object label
 *   - total related count (badge)
 *   - the top N related records (name only, truncated)
 *
 * Data is fetched per entry via the host `DataSource` exposed through
 * `RecordContext`. We deliberately query with `$top` only — this rail is
 * a snapshot, not a paginated list — and silently degrade to "—" on
 * failure so a misconfigured entry never blanks the whole rail.
 *
 * ## The parent scope is compiled by the relationship field's ARITY
 *
 * An entry names a `relationshipField` on the child object and nothing about
 * how that field STORES the link. A `multiple: true` relationship
 * (`Field.user({ multiple: true })` is the platform's own shape) persists an
 * ARRAY of parent ids, so the question is MEMBERSHIP and not equality —
 * equality asks whether that whole stored array IS one id, which `driver-sql`
 * refuses with `400 INVALID_FILTER` while prescribing `$contains`.
 *
 * The condition is therefore composed by `@object-ui/core`'s
 * `composeParentScopeFilter` (objectui#8883), the ONE compiler the related
 * list's rows and the tab badge already share (objectui#7299, objectui#8882).
 * ⛔ Do not add a local arity rule here, however small. The seam's verdict is
 * `@objectstack/spec/data`'s own `isMultiValueField`, and a local
 * approximation is wrong against it in BOTH directions, not merely incomplete:
 * `multiselect` / `checkboxes` / `tags` persist an array with no flag at all,
 * and `multiple: true` is INERT on a type outside the spec's multi-capable
 * set. Two readers of one question, drifted, is the entire defect class.
 *
 * ⚠️ The QUERY rule and the STORAGE rule are two rules, and ⛔ this file does
 * not claim they are one predicate. Measured at source: the spec asks
 * `MULTI_OPTION_TYPES.has(type) || (MULTI_CAPABLE_TYPES.has(type) && multiple
 * === true)`, while the SQL driver's own `isJsonField` asks
 * `JSON_COLUMN_TYPES.has(type) || !!field.multiple` — the flag on ANY type. So
 * `{ type: 'master_detail', multiple: true }` answers `false` to the spec and
 * `true` to the driver, and the two part company for exactly the
 * flag-on-a-non-multi-capable-type case. ⛔ Nothing here decides which is
 * right: that divergence is owned upstream by objectstack#17469. This renderer
 * follows the SPEC, because the spec is what the authoring surface is
 * validated against and what the seam already compiles on — and a second
 * opinion at this call site would be the defect above, one layer up.
 *
 * ## The "View All" link cannot follow the rows there
 *
 * The link builds a `filter[<field>]=<value>` URL into the console's object
 * list. That grammar has no membership operator and no third spelling: the
 * ADR-0055 data surface recognises `gte`/`lte`/`gt`/`lt` and DROPS any other
 * suffix, and the route this link actually targets parses equality only. A
 * hopeful `[contains]` suffix therefore does not narrow the destination at
 * all. Rather than send the user to an unscoped child table dressed as this
 * parent's related records, the link is SUPPRESSED on a multi-value
 * relationship and the reason is logged once — the same "empty and loud beats
 * wider and quiet" posture `RelatedList`'s raw-URL fallback takes for the same
 * grammar. Losing the affordance there is the COST of the repair.
 */

import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useRecordContext, useSafeFieldLabel } from '@object-ui/react';
import { cn, Card, CardHeader, CardTitle, CardContent, Badge, Skeleton } from '@object-ui/components';
import {
  composeParentScopeFilter,
  isMultiValueRelationship,
  type FieldContainerLike,
} from '@object-ui/core';
import { ChevronRight } from 'lucide-react';
import type { ReferenceRailEntry } from '@objectstack/spec/ui';
import { useDetailTranslation } from '../useDetailTranslation';

// `ReferenceRailEntry` is owned by `@objectstack/spec` as of 17.1.0 — re-exported
// here, never re-declared (objectui#5494; `check:spec-symbols` enforces this).
// The spec's `ReferenceRailEntrySchema` is `$strict` over
// {objectName, relationshipField, title?, limit?, displayField?}. The local
// interface this replaced also declared an `icon` key: no render path ever read
// it, and the strict schema refuses it at save, so it retired with the
// derivation rather than surviving either side of the contract.
export type { ReferenceRailEntry } from '@objectstack/spec/ui';

const splitDesigner = (props: Record<string, any>) => {
  const { 'data-obj-id': id, 'data-obj-type': type, style, ...rest } = props || {};
  return { designer: { 'data-obj-id': id, 'data-obj-type': type, style }, rest };
};

export interface RecordReferenceRailRendererProps {
  schema?: {
    entries?: ReferenceRailEntry[];
    className?: string;
    /**
     * When true (default), entries with `total === 0` are folded into a
     * single "+ N more (empty)" footer chip instead of rendering full empty
     * cards. Users can click the chip to expand them inline. Setting
     * `hideEmpty: false` restores the legacy "always render every entry"
     * behavior.
     */
    hideEmpty?: boolean;
    [k: string]: any;
  };
  className?: string;
  [k: string]: any;
}

interface EntryState {
  loading: boolean;
  total: number;
  items: any[];
  error?: string;
}

const humanize = (s: string) =>
  s
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

const pickDisplayName = (row: any, displayField?: string): string => {
  if (displayField && row?.[displayField] != null && row[displayField] !== '') {
    return String(row[displayField]);
  }
  return (
    row?.name ||
    row?.title ||
    row?.subject ||
    row?.label ||
    row?.email ||
    row?.username ||
    row?.code ||
    row?.slug ||
    row?.provider_id ||
    row?.user_agent ||
    row?.ip_address ||
    row?.id ||
    '—'
  );
};

export const RecordReferenceRailRenderer: React.FC<RecordReferenceRailRendererProps> = ({
  schema = {},
  className,
  ...props
}) => {
  const ctx = useRecordContext();
  const i18n = useSafeFieldLabel() as any;
  const { t } = useDetailTranslation();
  const { designer } = splitDesigner(props);
  const routeParams = useParams<{ appName?: string }>();
  const appName = routeParams.appName;

  const entries: ReferenceRailEntry[] = Array.isArray(schema.entries)
    ? schema.entries
    : Array.isArray((schema as any).properties?.entries)
      ? ((schema as any).properties.entries as ReferenceRailEntry[])
      : [];
  const parentId = ctx?.recordId;
  const dataSource = ctx?.dataSource;

  const [states, setStates] = React.useState<Record<string, EntryState>>({});

  // PERF: gate the rail's per-entry queries on visibility. The rail lives in
  // an aside region that is `hidden xl:flex` (see buildDefaultPageSchema), so
  // on sub-`xl` viewports (the common laptop width) it is `display:none` and
  // the IntersectionObserver never reports intersection → zero queries on
  // record open. On `xl`+ it fetches once the rail scrolls near the viewport.
  // Without this, every related collection was fetched eagerly on mount,
  // which (together with RecordDetailView's preload, now removed for this
  // layout) produced ~50 concurrent requests that head-of-line-blocked one
  // another on a single backend container.
  const railRef = React.useRef<HTMLDivElement>(null);
  const [railVisible, setRailVisible] = React.useState(false);
  // Mounted latch: results are applied while mounted regardless of which
  // effect run dispatched them, so a fetch that outlives a re-render isn't
  // dropped (and then never retried because of the sig guard below).
  const mountedRef = React.useRef(true);
  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  // Signature of the entry set already dispatched. The fetch effect re-runs
  // whenever the record context hands down a new `dataSource` identity during
  // the drawer's mount churn; without this guard each re-run re-drained the
  // whole queue (every related collection fetched 3–5×). We fetch once per
  // (parentId + entries) and skip identical re-runs.
  const fetchedSigRef = React.useRef<string>('');
  React.useEffect(() => {
    if (railVisible) return; // latch: once visible, stop observing
    const el = railRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      // No element yet or unsupported environment (SSR/tests): fall back to
      // eager so behaviour never regresses to "never loads".
      setRailVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (records) => {
        if (records.some((r) => r.isIntersecting)) setRailVisible(true);
      },
      { rootMargin: '200px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [railVisible]);

  // The CHILD objects' field defs, keyed by object name — the METADATA the
  // parent-scope seam draws its arity verdict from. Filled by the fetch effect
  // below BEFORE it reads any rows, and read a second time at render time by
  // the "View All" link, so both halves of an entry answer from one source.
  // Empty until a schema proves otherwise: the seam then compiles equality,
  // which is byte for byte the wire this rail has always sent.
  const [entryFields, setEntryFields] = React.useState<Record<string, FieldContainerLike>>({});
  // One warning per (object, field) per mounted rail — the link suppression
  // below is silent on screen by construction, so the developer channel is the
  // only place it can be said at all. Fired from the effect, never from render.
  const warnedSuppressedLinks = React.useRef<Set<string>>(new Set());

  const entriesSig = JSON.stringify(entries.map((e) => `${e.objectName}:${e.relationshipField}:${e.limit ?? 3}`));
  React.useEffect(() => {
    if (!railVisible) return;
    if (!dataSource?.find || !parentId || entries.length === 0) return;
    // Fetch once per (parentId + entries). Re-runs triggered purely by a new
    // `dataSource` identity (drawer mount churn) are no-ops; navigating to a
    // different record changes the signature and refetches.
    const sig = `${parentId}::${entriesSig}`;
    if (fetchedSigRef.current === sig) return;
    fetchedSigRef.current = sig;
    // Mark every entry as loading up front so the skeletons render.
    setStates((prev) => {
      const next = { ...prev };
      for (const entry of entries) {
        next[entry.objectName] = {
          loading: true,
          total: 0,
          items: prev[entry.objectName]?.items || [],
        };
      }
      return next;
    });
    const fetchEntry = async (entry: ReferenceRailEntry, fields: FieldContainerLike) => {
      const key = entry.objectName;
      try {
        const res: any = await dataSource.find(entry.objectName, {
          // The parent-relationship condition, compiled to match the field's
          // ARITY by the one seam the rows and the tab badge already use
          // (objectui#8883). With no `fields` it compiles equality — the
          // historical wire — so an adapter that cannot serve metadata is no
          // worse off than before this card.
          $filter: composeParentScopeFilter(entry.relationshipField, parentId, fields),
          $top: entry.limit ?? 3,
          $count: true,
        });
        if (!mountedRef.current) return;
        const items = Array.isArray(res) ? res : res?.data || [];
        // `total` is the ONE count member `QueryResult` (`@object-ui/types`)
        // declares — the reason `$count: true` is sent above. A `count` arm
        // used to sit between it and the row-length fallback; measured zero
        // producers emit `count` at this seam (objectui#6917), so it is gone
        // rather than left as somewhere a non-conforming producer keeps
        // working unrejected (AGENTS.md #0.1).
        const total = typeof res?.total === 'number' ? res.total : items.length;
        setStates((prev) => ({ ...prev, [key]: { loading: false, total, items } }));
      } catch (err: any) {
        if (!mountedRef.current) return;
        setStates((prev) => ({
          ...prev,
          [key]: { loading: false, total: 0, items: [], error: String(err?.message || err) },
        }));
      }
    };
    void (async () => {
      // ARITY FIRST, then the reads — and the rail's reason for that order is
      // its OWN, not the tab badge's.
      //
      // `RelatedList` deliberately attempts equality, is refused, and refetches
      // once the arity lands; it can, because its fetch effect re-runs on the
      // verdict. This rail cannot: `fetchedSigRef` above latches on
      // (parentId + entries), and the arity is in NEITHER — so a probe-then-
      // correct design would make the refused first attempt the ONLY attempt,
      // and the entry would sit on its error state until the user navigated to
      // another record. The link half compounds it: the destination href is
      // decided by the same verdict, so deferring it would ship exactly the
      // disagreement this card exists to prevent — right rows, wrong link.
      //
      // ⛔ NOT gated on "a schema loaded", which is a different thing: an
      // adapter without `getObjectSchema`, or one whose fetch rejects, still
      // reads rows, with the equality wire it has always sent. Gating would
      // trade this card's loud 400 on one relationship shape for a silently
      // empty rail on every entry in the app.
      const fieldsFor = new Map<string, FieldContainerLike>();
      if (typeof dataSource.getObjectSchema === 'function') {
        await Promise.all(
          Array.from(new Set(entries.map((e) => e.objectName))).map(async (name) => {
            try {
              fieldsFor.set(name, (await dataSource.getObjectSchema(name))?.fields);
            } catch {
              // Equality it is — the wire this rail has always sent.
            }
          }),
        );
      }
      if (!mountedRef.current) return;
      setEntryFields(Object.fromEntries(fieldsFor));
      for (const entry of entries) {
        if (!isMultiValueRelationship(fieldsFor.get(entry.objectName), entry.relationshipField)) {
          continue;
        }
        const warnKey = `${entry.objectName}.${entry.relationshipField}`;
        if (warnedSuppressedLinks.current.has(warnKey)) continue;
        warnedSuppressedLinks.current.add(warnKey);
        console.warn(
          `[RecordReferenceRail] "${entry.objectName}" relates through the multi-value field ` +
            `"${entry.relationshipField}", so the "View All" link is suppressed for it. The ` +
            'console list URL\'s `filter[<field>]=<value>` grammar has no membership operator ' +
            'and no unrecognised suffix narrows it, so the link would open the entire child ' +
            "table dressed as this parent's related records. The rail's own rows are still " +
            'scoped correctly.',
        );
      }
      // Concurrency-capped pool: drain the entries a few at a time instead of
      // firing all N at once, so the rail never floods the backend in a burst.
      const MAX_CONCURRENCY = 3;
      const queue = [...entries];
      const runWorker = async () => {
        while (mountedRef.current) {
          const entry = queue.shift();
          if (!entry) return;
          await fetchEntry(entry, fieldsFor.get(entry.objectName));
        }
      };
      await Promise.all(
        Array.from({ length: Math.min(MAX_CONCURRENCY, queue.length) }, () => runWorker()),
      );
    })();
  }, [railVisible, dataSource, parentId, entriesSig]);

  // useState must run unconditionally — declared above the empty-entries early
  // return so hook order stays stable across renders.
  const [showEmpty, setShowEmpty] = React.useState(false);

  if (entries.length === 0) return null;

  const hideEmpty = schema.hideEmpty !== false;

  // Stable partition: an entry is "empty" only once it has finished loading
  // with total === 0. While loading or on error, we render it so users
  // don't see flicker / disappearing cards.
  const emptyKeys = new Set(
    entries
      .filter((e) => {
        const s = states[e.objectName];
        return hideEmpty && s && !s.loading && !s.error && s.total === 0;
      })
      .map((e) => e.objectName),
  );

  const visibleEntries = entries.filter(
    (e) => showEmpty || !emptyKeys.has(e.objectName),
  );
  const emptyTitles = entries
    .filter((e) => emptyKeys.has(e.objectName))
    .map(
      (e) =>
        e.title ||
        (i18n?.objectLabel
          ? i18n.objectLabel({ name: e.objectName, label: humanize(e.objectName) })
          : humanize(e.objectName)),
    );

  return (
    <div ref={railRef} className={cn('flex flex-col gap-3', schema.className, className)} {...designer}>
      {visibleEntries.map((entry) => {
        const key = entry.objectName;
        const state = states[key] || { loading: true, total: 0, items: [] };
        // The link's URL grammar cannot express MEMBERSHIP (see the file
        // header), so on a multi-value relationship the only honest "View All"
        // is no "View All": the href below would drop the parent scope
        // entirely and open the whole child table. The verdict is the same
        // seam's, off the same metadata the rows were scoped with, and it is
        // `false` until a schema PROVES otherwise — a single-value entry and
        // an entry whose schema never resolved both keep today's link, href
        // byte for byte.
        const suppressViewAll = isMultiValueRelationship(
          entryFields[key],
          entry.relationshipField,
        );
        const title =
          entry.title ||
          (i18n?.objectLabel
            ? i18n.objectLabel({ name: entry.objectName, label: humanize(entry.objectName) })
            : humanize(entry.objectName));

        return (
          <Card key={key} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-2 py-3 px-4 space-y-0 border-b">
              <CardTitle className="text-sm font-semibold tracking-tight truncate">
                {title}
              </CardTitle>
              <div className="flex items-center gap-2 shrink-0">
                {!state.loading && (
                  <Badge variant="secondary" className="tabular-nums">
                    {state.total}
                  </Badge>
                )}
                {appName && parentId && !suppressViewAll && (
                  <Link
                    to={`/apps/${appName}/${entry.objectName}?filter%5B${entry.relationshipField}%5D=${encodeURIComponent(String(parentId))}`}
                    className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                    title={t('detail.viewAll', { defaultValue: 'View All' })}
                  >
                    {t('detail.viewAll', { defaultValue: 'View All' })}
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {state.loading ? (
                <div className="space-y-1.5 p-3">
                  <Skeleton className="h-3.5 w-4/5" />
                  <Skeleton className="h-3.5 w-3/5" />
                  <Skeleton className="h-3.5 w-2/3" />
                </div>
              ) : state.items.length === 0 ? (
                <p className="px-4 py-3 text-xs text-muted-foreground">
                  {t('detail.noRecords')}
                </p>
              ) : (
                <ul className="divide-y">
                  {state.items.map((item) => {
                    const id = item.id || item._id;
                    const name = pickDisplayName(item, entry.displayField);
                    const href = id
                      ? `../${entry.objectName}/record/${encodeURIComponent(String(id))}`
                      : undefined;
                    return (
                      <li key={String(id || name)} className="px-4 py-2">
                        {href ? (
                          <Link
                            to={href}
                            className="group flex items-center justify-between gap-2 text-xs hover:text-foreground text-muted-foreground transition-colors"
                          >
                            <span className="truncate">{name}</span>
                            <ChevronRight className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        ) : (
                          <span className="block truncate text-xs text-muted-foreground">{name}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        );
      })}
      {!showEmpty && emptyTitles.length > 0 && (
        <button
          type="button"
          onClick={() => setShowEmpty(true)}
          className="self-start inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1 rounded-md border border-dashed border-border/60 hover:border-border bg-background"
          title={emptyTitles.join(' · ')}
        >
          <span>
            {t('detail.showEmptyRelated', {
              defaultValue: '+ {{count}} empty',
              count: emptyTitles.length,
            })}
          </span>
          <span className="truncate max-w-[180px] text-muted-foreground/70">
            ({emptyTitles.join(' · ')})
          </span>
        </button>
      )}
    </div>
  );
};

export default RecordReferenceRailRenderer;
