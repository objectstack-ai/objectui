/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * ObjectCalendar Component
 * 
 * A specialized calendar component that works with ObjectQL data sources.
 * Displays records as calendar events based on date field configuration.
 * Implements the calendar view type from @objectstack/spec view.zod ListView schema.
 * 
 * Features:
 * - Month/week/day calendar views
 * - Auto-mapping of records to calendar events
 * - Date range filtering
 * - Event click handling
 * - Color coding support
 * - Works with object/value data providers
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { ObjectCalendarSchema, DataSource, CalendarConfig, ViewData } from '@object-ui/types';
import { CalendarView, type CalendarViewEvent } from './CalendarView';
import { usePullToRefresh } from '@object-ui/mobile';
import {
  useNavigationOverlay,
  useSafeTranslate,
  useObjectTranslation,
  extractWriteErrorMessage,
  isPermissionError,
  declaredUserMessage,
  useSettledSchema,
  NON_GRID_ROW_CEILING,
  NON_GRID_ROW_CEILING_TOP,
  applyNonGridRowCeiling,
  NonGridRowCeilingNote,
} from '@object-ui/react';
import {
  RECORD_OVERLAY_DEFAULT_WIDTH,
  RecordDetailPanel,
  deriveRecordPageHref,
} from '@object-ui/plugin-detail';
import { usePermissions } from '@object-ui/permissions';
import { ChevronRight } from 'lucide-react';
import {
  cn,
  useIsMobile,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  NavigationOverlay,
  legacyRecordDrawerWidthKey,
  recordOverlayWidthStorageKey,
  toast,
  useOverlayAnchor,
} from '@object-ui/components';
import {
  buildExpandFields,
  convertSortToQueryParams,
  getRecordDisplayName,
  createFieldColorResolver,
  resolveRecordSourceConfig,
  resolveRecordSourceObjectName,
  ValueDataSource,
} from '@object-ui/core';

/**
 * ⛔ RETIRED (objectui#8651) — a plugin-local `CalendarSchema` used to sit here,
 * and `ObjectCalendarComponentProps.schema` below was the union of it with
 * `ObjectGridSchema`. Both arms are gone; the prop is now the published schema
 * of the element this file is registered as (`index.tsx`, both tags).
 *
 * What the union cost, measured with the TypeScript checker on the merge-base
 * (`getPropertyOfType`, never a grep — objectui#8410). Of the fifteen keys this
 * renderer reads off the node, FOUR were declared on neither arm and EIGHT on
 * exactly one, while `ObjectCalendarSchema` already declared ELEVEN of the
 * fifteen.
 *
 * ⚠️ But the cast count is NOT twelve, and an earlier cut of this comment said
 * it was. `ObjectGridSchema` carries `BaseSchema`'s `[key: string]: any`, so on
 * the UNION the five `CalendarSchema`-only keys resolved through that index
 * signature and compiled with no cast at all. The checker on the union itself:
 * DECLARED 8 of 15 (`colorField` `dateField` `defaultView` `endField` `filter`
 * `objectName` `sort` `titleField`), NOT declared 7 (`allDayField` `calendar`
 * `data` `endDateField` `navigation` `startDateField` `staticData`), nonsense
 * control `false`. ⇒ SEVEN reads needed a cast, not twelve.
 *
 * ⭐ That reading is worse for the old shape, not better: those five compiled
 * silently as `any` — admitted through an index signature, never examined —
 * which is the objectui#6914 defect itself rather than an absence of one. A
 * cast at least announces the gap. The union's own index signature is `false`,
 * which is why the other seven had to be cast.
 *
 * The two arms failed differently and neither was salvageable:
 *
 *   - `ObjectGridSchema` is `type: 'object-grid'`. No producer hands this
 *     component one: the single call site is this package's `index.tsx`, whose
 *     two registrations both publish `OBJECT_CALENDAR_INPUTS`.
 *   - the local interface was absent from this package's barrel, so no importer
 *     could name it, and it SHADOWED `@object-ui/types`' own published
 *     `CalendarSchema` — the date-picker primitive reachable at `ui:calendar`
 *     only (objectui#8499). Its two distinctive members were the alias spellings
 *     `dateField` / `endField`, which objectui#8355 has since RETIRED at both
 *     faces — `getCalendarConfig` below reads the declared spellings only, and
 *     `@object-ui/types` refuses the two by name.
 *
 * The shape this leaves is the family's: `ObjectKanban` takes
 * `ObjectKanbanSchema`, `ObjectGantt` takes `ObjectGanttSchema`, `ObjectMap`
 * takes `ObjectMapSchema` — and `plugin-map` is registered under two tags with
 * one published props type, exactly as this package is.
 *
 * Pinned in `__tests__/calendarUnionReads-8651.test.tsx`.
 */

/**
 * Props of the `ObjectCalendar` React component.
 *
 * Renamed off the bare `ObjectCalendarProps` (objectui#4650): from 17.0.0
 * `@objectstack/spec/ui` owns that name, where it is the AUTHORED props
 * document of the `object-calendar` element — `z.input<typeof
 * ObjectCalendarPropsSchema>`, i.e. serialisable authoring keys only. This is
 * the RENDERER's props: a live `dataSource`, records pre-fetched by a parent,
 * and the host callbacks below, none of which can exist in authored metadata.
 * Two layers under one word, resolved the way this repo already resolved it for
 * `PageHeaderProps` -> `PageHeaderComponentProps` (app-shell) and the
 * `Record*ComponentProps` family in `@object-ui/types`.
 *
 * The barrel keeps `ObjectCalendarProps` as a deprecated alias of this type, so
 * no importer breaks. Tripwire: `__tests__/spec-symbol-4650.test.ts`.
 */
export interface ObjectCalendarComponentProps {
  schema: ObjectCalendarSchema;
  dataSource?: DataSource;
  className?: string;
  /** Pre-fetched records passed by a parent (e.g. ObjectView). When provided, skips internal data fetching. */
  data?: any[];
  /** Loading state propagated from a parent. Respected only when `data` is also provided. */
  loading?: boolean;
  onEventClick?: (record: any) => void;
  /**
   * TWO parameters since objectui#9357, and the second is not decoration: this
   * prop reaches `useNavigationOverlay` as its `onRowClick`, and `handleClick`
   * invokes it as `onRowClick(record, event)` — the modifier payload a host
   * needs to implement Cmd/Ctrl/middle-click for itself. Declaring one
   * parameter hid the second on the ONE line a host reads. Spelled `any` and
   * not `HandleClickModifiers` for the reason objectui#9341 measured on
   * `ObjectKanbanSchema.onCardClick`: that interface lives in
   * `@object-ui/react`, the published twins in `@object-ui/types` may not name
   * it, and a host that discovered the payload from the implementation
   * annotated it `React.MouseEvent` — which a narrower declaration refuses
   * contravariantly. `BaseSchema`'s own `onClick` / `onChange` / `onSubmit`
   * already use this spelling for exactly this situation.
   */
  onRowClick?: (record: any, event?: any) => void;
  onDateClick?: (date: Date) => void;
  onEdit?: (record: any) => void;
  onDelete?: (record: any) => void;
  onNavigate?: (date: Date) => void;
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
  onEventDrop?: (record: any, newStart: Date, newEnd?: Date) => void;
  locale?: string;
}

/**
 * Helper to get calendar configuration from schema.
 *
 * `filter` is the query filter and nothing else (objectui#7711) — the calendar
 * twin of the `filter.map` retirement `ObjectMap` took in objectui#4034.
 *
 * This function used to read the calendar's configuration out of
 * `schema.filter.calendar`, in an arm ABOVE the canonical read below, and the
 * comment on that canonical read called IT the "backward compatibility" one.
 * The contract was inverted there: `@objectstack/spec`'s
 * `ComponentPropsMap['object-calendar']` declares `calendar` as the
 * configuration container and `filter` as the base query filter, and admits no
 * `filter.calendar` spelling at all. Both the arm and that comment are gone —
 * this block consumes only what the spec declares.
 *
 * What the retired arm did: it made ONE authored key mean two incompatible
 * things at once. `filter: { calendar: 'team' }` — a legitimate condition on a
 * field literally named `calendar` — was read here as a `CalendarConfig`,
 * while the very same object still went to `$filter` on the wire below.
 *
 * ⚠️ Measured difference from the map twin, and the reason this retirement
 * needs no dev-time diagnostic rider like plugin-map's
 * `warnOnLegacyFilterMapConfig`:
 * - There is no `Array.prototype.calendar`, so `'calendar' in schema.filter`
 *   never fired on an array-shaped filter — where `'map' in schema.filter`
 *   fired on every single one of them, inherited method and merged `and` node
 *   included. Only an object-shaped filter carrying an own `calendar` key ever
 *   reached the retired arm.
 * - A schema whose only configuration lived under the retired spelling now
 *   returns null from here, and the early return answers null with the
 *   existing "Calendar configuration required. Please specify startDateField
 *   and titleField." refusal screen. The map fell back to DEFAULT field names,
 *   which looks like bad data and is why it had to warn; the calendar names
 *   what is missing on screen. Nothing is dropped without a trace.
 *
 * ⛔ No compatibility rung and no deprecation window, per AGENTS.md #0.1: a
 * tolerant fallback fossilizes the wrong convention into a second de-facto
 * contract. Pinned in `__tests__/ObjectCalendar.filterIsNotAConfigSlot-7711.test.tsx`.
 */
/**
 * The config this component reads: the spec's `CalendarConfig` plus the ONE
 * objectui-local key it also honours.
 *
 * ⭐ Measured, objectui#8026 — `allDayField` is NOT a spec key, and the card
 * that named it "declared by the spec" was reading a different type.
 * `@objectstack/spec`'s `CalendarConfigSchema` is a `strictObject` of exactly
 * four keys (`startDateField`, `endDateField`, `titleField`, `colorField`) and
 * refuses `allDayField` BY NAME with an `unrecognized_keys` diagnostic — on the
 * pinned 17.3.0 and on objectstack `main`. The `@default 'allDay'` doc comment
 * lives on `@object-ui/types`' `CalendarViewSchema`, which is the SIBLING
 * `calendar-view` element's own type, not this one.
 *
 * The lane `allDayField` really rides is objectui's own, and it is deliberate:
 * `@object-ui/types`' `CalendarConfig` mirror derives from the spec schema and
 * keeps `.passthrough()` explicitly for this, naming this key — "the renderers
 * grow config knobs ahead of the protocol (calendar's `allDayField`, for one),
 * and stripping them here would silently disable a shipped capability"
 * (`packages/types/src/zod/objectql.zod.ts`). That is the same class objectui's
 * sanctioned `defaultView` occupies: the spec refuses `defaultView` on this
 * object in exactly the same shape, and this component has honoured it for
 * releases. So honouring `allDayField` widens no accept set — objectui's
 * published validator already admits it, `ListView` already collects it into
 * the fetch, and `ObjectView` already forwards it verbatim.
 */
type ObjectCalendarConfig = CalendarConfig & {
  /** Record field carrying the all-day flag. objectui-local — see above. */
  allDayField?: string;
};

/**
 * ⛔ RETIRED — THE TWO PRE-#2231 ALIAS RUNGS ARE GONE (objectui#8355, director
 * seat, 2026-09-16, class-1 self-adjudication: "retire the aliases at both
 * faces, now"). `dateField` and `endField` were read here as a cast on the node
 * — `startDateField || dateField`, `endDateField || endField` — and this
 * function now reads the declared spellings only.
 *
 * ## THE OTHER HALF, and why it is not optional
 *
 * ⚠️ An earlier attempt removed exactly this ladder and BROKE A LIVE AUTHORING
 * PATH (recorded on objectui#8651). The census behind it was false in two ways
 * worth keeping: the producer does not write the key literally, it SPREADS the
 * authored block, so a word-boundary text census is structurally blind to it;
 * and the regex it used could not have matched a TypeScript optional member
 * either. What made the breakage SILENT, though, was neither of those — it was
 * that nothing refused the key. The node still validated, the alias still
 * arrived, nothing read it, and the author met this file's generic "Calendar
 * configuration required" screen, which names the canonical keys and says
 * nothing about the key they actually wrote.
 *
 * ⇒ the ruling lands the removal TOGETHER WITH the refusal that makes the same
 * document fail loudly instead: `@object-ui/types` declares both spellings as
 * `aliasKeyRefusal()` arms on the view-level calendar block, on this element's
 * own `calendar` container, and on the FLAT node face this function reads — so
 * an author writing `dateField` is refused BY NAME at the key path, pointed at
 * `startDateField`, on every surface. `ListView`'s calendar branch stops
 * flattening the two onto the node in the same change. ⛔ Never remove one half
 * without the other: ladder-without-tombstone is the known-bad state, and it is
 * the state that shipped once already.
 *
 * ⚠️ Option A — normalise at the producer, i.e. keep translating `dateField` to
 * `startDateField` in `ListView` — was put to the director seat and REFUSED as
 * the end state, on the ground that it keeps a second spelling alive at the
 * producer, which is the lenient alias AGENTS.md #0.1 names. ⛔ Do not reopen it
 * by adding a fold anywhere on this path.
 *
 * Pinned in `__tests__/calendarUnionReads-8651.test.tsx` (the read census and
 * the render legs) and, for the refusal itself, in `@object-ui/types`'
 * `calendar-date-alias-refusal-8355.test.ts` and `plugin-list`'s
 * `ListView.calendarAliasRefused-8355.test.tsx`.
 */
function getCalendarConfig(schema: ObjectCalendarSchema): ObjectCalendarConfig | null {
  // The declared configuration container — read FIRST, as the spec declares it.
  if (schema.calendar) {
    return schema.calendar as ObjectCalendarConfig;
  }

  // The flat spelling, which `ObjectView` and `ListView` emit.
  //
  // ⛔ The two alias rungs are spelled as a cast ON `schema` at each read site,
  // never through a renamed local. The repo's read census (objectui#6576's
  // `schemaReads`, used by
  // `types/src/__tests__/calendar-flat-color-allday-8466.test.ts` and by this
  // card's own pin) matches `schema.KEY` and `(schema as T).KEY` — a local alias
  // would hide these two reads from the very instrument meant to enumerate them,
  // which is the same class of blindness that produced the false census above.
  if (schema.startDateField) {
      return {
          startDateField: schema.startDateField,
          endDateField: schema.endDateField,
          titleField: schema.titleField,
          colorField: schema.colorField,
          allDayField: schema.allDayField
      } as ObjectCalendarConfig;
  }

  return null;
}

/**
 * A record the calendar cannot place: the field declared as `startDateField`
 * carries no value on it, so there is no date to draw and none is invented
 * (objectui#7071). Deliberately just an id and a display title — the ruled
 * affordance is a count and a list, so nothing here feeds a scheduling gesture.
 */
interface UnscheduledRecord {
  id: string | number;
  title: string;
}

export const ObjectCalendar: React.FC<ObjectCalendarComponentProps> = ({
  schema,
  dataSource,
  className,
  data: externalData,
  loading: externalLoading,
  onEventClick,
  onRowClick,
  onDateClick,
  onNavigate,
  onViewChange,
  onEventDrop,
  locale,
}) => {
  const tt = useSafeTranslate();
  // `useSafeTranslate` takes a plain English fallback and passes NO options to
  // i18next, so it cannot fill a `{{count}}` hole — the unscheduled label needs
  // one, and reads its key through `useObjectTranslation` instead. Both spell
  // the provider-less fallback the same way (objectui#6219), so the label is
  // correct whether or not an `I18nProvider` is mounted.
  const { t } = useObjectTranslation();
  // When the parent (e.g. ObjectView) pre-fetches data and passes it via the `data` prop,
  // we must not trigger a second fetch. Detect external data by checking for an array.
  const hasExternalData = Array.isArray(externalData);

  const [data, setData] = useState<any[]>(hasExternalData ? externalData! : []);
  const [loading, setLoading] = useState(hasExternalData ? (externalLoading ?? false) : true);
  const [error, setError] = useState<Error | null>(null);
  /**
   * Did the platform row ceiling bite, and how large was the whole filtered
   * result set (objectui#7210)? Carried from the response that knew it —
   * `data.length === NON_GRID_ROW_CEILING` cannot tell a capped result set
   * apart from one that is exactly that size.
   */
  const [rowCeiling, setRowCeiling] = useState<{ truncated: boolean; total?: number }>({
    truncated: false,
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  // Disclosure state of the "unscheduled" area (objectui#7071). Collapsed by
  // default, as ruled: the count is always on screen, the list is opt-in.
  // Component state is the right home per AGENTS.md §5 #8 — nobody would share
  // or bookmark it — and it survives a data refresh because a refetch re-renders
  // this component rather than remounting it.
  const [unscheduledOpen, setUnscheduledOpen] = useState(false);
  const isMobile = useIsMobile();
  const schemaDefaultView = schema.defaultView;
  // Lazy initializer: read window.innerWidth synchronously so SSR-friendly
  // useIsMobile (which returns false on first render) doesn't lock us into
  // a 24-hour day grid on phones.
  const [view, setView] = useState<'month' | 'week' | 'day'>(() => {
    const wantsDay = schemaDefaultView === 'day' || !schemaDefaultView;
    const isMobileSync = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobileSync && wantsDay) return 'month';
    return schemaDefaultView || 'month';
  });
  // If the viewport later transitions into mobile (rotation, resize) while
  // sitting on day view, downgrade to month.
  useEffect(() => {
    if (isMobile && view === 'day' && (schemaDefaultView === 'day' || !schemaDefaultView)) {
      setView('month');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);
  const [refreshKey, setRefreshKey] = useState(0);

  // P2: Auto-subscribe to DataSource mutation events (standalone mode only).
  // When rendered as a child of ObjectView with external data, parent handles refresh.
  useEffect(() => {
    if (hasExternalData) return; // Parent handles refresh
    if (!dataSource?.onMutation || !schema.objectName) return;
    const unsub = dataSource.onMutation((event: any) => {
      if (event.resource === schema.objectName) {
        setRefreshKey(k => k + 1);
      }
    });
    return unsub;
  }, [dataSource, schema.objectName, hasExternalData]);

  const handlePullRefresh = useCallback(async () => {
    setRefreshKey(k => k + 1);
  }, []);

  const { ref: pullRef, isRefreshing, pullDistance } = usePullToRefresh<HTMLDivElement>({
    onRefresh: handlePullRefresh,
    enabled: !!dataSource && !!schema.objectName,
  });

  // `'array'` — the arm `object-calendar`'s published `data` row declares
  // (objectui#8348, decision batch #83, 「8348 以协议为准」). MEASURED on
  // `@objectstack/spec` 17.4.0: `ComponentPropsMap['object-calendar'].data` is
  // `z.array(z.unknown()).optional()`, *"Pre-fetched records — skips the
  // internal fetch"*, and this package's own registration publishes the same
  // arm (`{ name: 'data', type: 'array' }` in `index.tsx`). So the
  // `{ provider, items }` config object — which that row refuses by KIND, and
  // which `os validate` and the save gate therefore refuse — is no longer a
  // record source here either. An authored ARRAY is unchanged: it still reaches
  // this ladder verbatim (so `staticData` and `objectName` stay unreached, as
  // the registration's description promises) AND reaches the component as the
  // `data` PROP through `index.tsx`'s `resolveExternalData`, which is what
  // actually draws it.
  //
  // ⚠️ NAMED SEAM, and the reason the three members are passed one by one
  // instead of handing the whole node over (objectui#8651). The shared
  // resolver's PARAMETER declares `data?: ViewData`, but its own `dataArm`
  // contract — and its `authoredDataIsOnTheDeclaredArm` predicate, which takes
  // `unknown` — admit an ARRAY on the `'array'` arm, which is exactly the arm
  // this block declares (`ObjectCalendarSchema.data`, objectui#9239/#8348). So
  // the signature contradicts the function's own documented contract, and the
  // retired union hid it: `ObjectGridSchema.data` is `ViewData`, so the call
  // type-checked while saying something this block does not mean.
  //
  // ⛔ That is an upstream defect in `@object-ui/core`, NOT a licence to widen
  // anything here (AGENTS.md #0.1) — and `packages/core/` is outside this
  // card's file surface. Reported rather than patched. This spelling passes
  // only the three members the resolver documents itself as reading, with the
  // `data` member named at the arm this block declares, so the RUNTIME value
  // reaching the predicate is byte-for-byte the one `schema.data` held before.
  const dataConfig = useMemo(() => resolveRecordSourceConfig(
    {
      objectName: schema.objectName,
      data: schema.data as ViewData | undefined,
      staticData: schema.staticData,
    },
    'array',
  ), [
    schema.data,
    schema.staticData,
    schema.objectName,
  ]);
  // Every key `getCalendarConfig` reads, and nothing it does not.
  //
  // `schema.filter` used to head this list, because the function used to read
  // `schema.filter.calendar` (objectui#7711). With that arm retired, keeping
  // `filter` here would say the calendar's CONFIGURATION depends on the query
  // filter — the very claim this card removes — and would recompute on every
  // filter change for nothing.
  //
  // Dropping it also removes an accidental co-trigger, so the three flat keys
  // the function reads but this list never named were added in the same edit:
  // `startDateField`, `endDateField` and `allDayField`. Before that change a
  // simultaneous `filter` change could recompute the memo and pick those up by
  // luck; that luck is now gone, so the list has to be honest. Pinned in
  // `__tests__/ObjectCalendar.filterIsNotAConfigSlot-7711.test.tsx`.
  //
  // ⚠️ The two retired alias rungs are NO LONGER listed, and the direction
  // matters: this list is exactly what `getCalendarConfig` reads, in BOTH
  // directions, so an entry for a key that function no longer reads would be
  // as wrong as a missing one. A cut of objectui#8651 dropped them alongside a
  // retirement that broke a live authoring path and they came back; objectui#8355
  // retires the rungs FOR REAL — together with the by-name refusal that makes an
  // authored alias loud instead of inert — so they leave here with them.
  //
  // ⭐ objectui#8026 — `allDayField` is now LOAD-BEARING here, not merely
  // honest. When #7711 named it, nothing read the key, so the dependency could
  // only ever cost a recompute; the events pass below now reads it, so a change
  // to the authored `allDayField` genuinely changes what is drawn and this
  // entry is what makes that reach the screen. ⚠️ Measured while doing so: the
  // #7711 file named above pins `startDateField`'s recompute and `filter`'s
  // NON-recompute and mentions neither `allDayField` nor `colorField` — the
  // dependency itself has never had an assertion on it. The behaviour rows that
  // now depend on this entry live in
  // `__tests__/ObjectCalendar.allDayFieldIsHonoured-8026.test.tsx`.
  const calendarConfig = useMemo(() => getCalendarConfig(schema), [
    schema.calendar,
    schema.startDateField,
    schema.endDateField,
    schema.titleField,
    schema.colorField,
    schema.allDayField
  ]);
  const hasInlineData = dataConfig?.provider === 'value';
  /**
   * The record-fetch effect below used to key on `dataConfig` itself — the
   * whole memoised object identity. `useMemo` carries no semantic
   * guarantee (React may discard its cache and recompute), and
   * `resolveRecordSourceConfig(schema)` builds a fresh wrapper object on every call
   * even when its own deps haven't changed, so a discard alone was enough
   * to re-run the effect and refetch. `dataProvider` and `dataItems` are
   * the remaining primitive fields that effect reads off `dataConfig` —
   * `schemaObjectName` below already covers the `object` field for the
   * same purpose. Keying on all three instead of the container object
   * makes a cache discard a no-op (objectui#6592).
   */
  const dataProvider = dataConfig?.provider;
  const dataItems = dataConfig?.provider === 'value' ? dataConfig.items : undefined;

  // ⭐ objectui#6453 — this replaces a `useRef` written in the render body
  // (`objectSchemaRef.current = objectSchema`), which existed so the fetch
  // effect below could read the schema without listing it as a dependency.
  // That bought the effect one run per mount and paid for it with the
  // expansion, permanently: on that one run the ref was still `null`,
  // `buildExpandFields` saw no fields, and the standalone calendar's query went
  // out with no `$expand` at all — so every lookup / master_detail / user /
  // tree field rendered from its raw foreign-key id, forever.
  //
  // The KEY is the object the record query will use, which on this component is
  // NOT simply `schema.objectName`: an authored `data` block can name a
  // different object. Comparing it during render means switching objects closes
  // the gate in the same commit that changes it, not one commit later, so no
  // query can carry the previous object's expand set.
  const schemaObjectName = resolveRecordSourceObjectName(schema, dataConfig);
  const schemaKey = schemaObjectName ?? '';
  /**
   * Has the object schema for THIS object finished resolving? Note what this is
   * NOT: "`objectSchema` is truthy". A calendar whose adapter exposes no
   * `getObjectSchema`, or whose schema read failed, must still fetch its
   * records — gating on a truthy schema would leave those calendars empty
   * forever. "Settled with nothing" and "not yet settled" are different states
   * and only the second may hold the query.
   */
  //
  // Since objectui#7225 (maintainer ruling B, 2026-09-02) this is the SHARED
  // `useSettledSchema`. `ObjectCalendar` was #6482's named obstacle to that
  // convergence, and the obstacle turned out to be about the GATE half, which
  // the hook deliberately leaves local (the record effect below still gates
  // only its `object`-provider branch). The RESOLUTION half fits via the
  // recipe the hook's own doc comment prescribes for this component by name:
  // an inline `value` data set issues no metadata read, so it is expressed as
  // "there is no source to read from" — `dataSource: undefined` — rather than
  // as a second "should fetch" flag. The hook settles-with-`null` on that
  // path, which is exactly what the hand copy's `hasInlineData` exit did.
  const { ready: objectSchemaReady, def: objectSchema } = useSettledSchema<any>(
    schemaKey,
    hasInlineData ? undefined : dataSource,
  );

  // Permissions context, read here rather than inside the fetch effect below:
  // an effect's DEPENDENCY ARRAY is evaluated during render, so `perms` has to
  // be a binding that already exists by the time this component's render
  // reaches that effect (objectui#7230, same structural note PR #7229 recorded
  // for `ListView`'s memo).
  const perms = usePermissions();

  // Sync external data/loading changes from parent (e.g. ObjectView re-fetches after filter change)
  useEffect(() => {
    if (hasExternalData) {
      setData(externalData!);
      // ...and drop any ceiling this component's OWN fetch had reported
      // (objectui#7210). A parent that hands over `data` owns the query, so it
      // owns whether that query was capped; a `truncated` left over from a
      // fetch whose rows are no longer on screen is a footnote about a result
      // set that is not being drawn. Every other `setData` path here already
      // resets it — this was the one that did not.
      setRowCeiling({ truncated: false });
    }
  }, [externalData, hasExternalData]);

  useEffect(() => {
    if (hasExternalData && externalLoading !== undefined) {
      setLoading(externalLoading);
    }
  }, [externalLoading, hasExternalData]);

  // Fetch data based on provider
  useEffect(() => {
    // Skip internal fetch when data is managed by a parent component
    if (hasExternalData) return;

    // ⭐ objectui#6453 — the object schema GATES this query; it does not refine
    // it afterwards. Measured on THIS component (instrumented adapter, three
    // latency profiles), the alternative — putting `objectSchema` in the
    // dependency list below — costs two queries and, when the schema read is
    // the slower of the two, a THREE-step paint: raw ids, back to the
    // "Loading calendar..." placeholder (this effect calls `setLoading(true)`
    // on re-run, and `loading` is an early return above), then the expanded
    // rows. When the schema read is the faster one the first response is
    // instead discarded on arrival — a round trip bought and thrown away.
    // Gating is the only shape that is right in every profile.
    //
    // Scoped to the `object` provider deliberately: an inline (`value`) data
    // set has no expand set to derive and issues no metadata read at all, so
    // gating it would hold a query open on a resolution nothing was going to
    // produce.
    if (dataProvider === 'object' && !objectSchemaReady) return;

    let isMounted = true;
    const fetchData = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);

        if (hasInlineData && dataProvider === 'value') {
          // THE INLINE PROVIDER NO LONGER EXITS BEFORE THE QUERY
          // (objectui#9061, porting objectui#8769's repair off `ObjectGantt`).
          //
          // This branch used to be `setData(dataItems); return;` — taken
          // BEFORE the `find` below, which is the ONE site in this file that
          // lowers `schema.filter` onto `$filter`, `schema.sort` onto
          // `$orderby` (via `convertSortToQueryParams`) and the objectui#7210
          // ceiling onto `$top`. So an authored `filter` reached nothing and
          // the grid drew EVERY authored row: the fail-OPEN direction, because
          // the key that was dropped is the key that NARROWS. Accepting a
          // declared key one cannot honour is the defect, and `ValueDataSource`
          // honours all three over its own array, so they are honoured here.
          //
          // ⚠️ NOT a literal transplant of the gantt's diff, and the difference
          // is structural rather than cosmetic. `ObjectGantt` resolves ONE
          // `effectiveDataSource` for every provider, so its repair was to
          // delete the branch and let the inline case fall through to the
          // shared query. This effect's `find` sits INSIDE the
          // `dataProvider === 'object'` arm, behind an `$expand` projection an
          // inline set has no metadata to build and behind the
          // `objectSchemaReady` gate deliberately scoped to that same arm.
          // Falling through here would therefore throw
          // `DataSource required for object/api providers` on a calendar that
          // needs no DataSource at all. So the adapter is resolved for the
          // inline provider ONLY — `api` keeps exactly the behaviour it had —
          // and the same three keys are lowered onto the same query shape.
          //
          // Built here rather than memoised at render scope so this effect goes
          // on reading only the primitive fields objectui#6592 named
          // (`dataProvider`, `dataItems`): no dependency is added or removed,
          // so nothing about WHEN this effect re-runs changes with this repair.
          //
          // `ValueDataSource` ignores the resource name — it queries its own
          // array — so this branch needs none of the object-name ladder the
          // `object` arm below resolves.
          const inlineSource = new ValueDataSource<any>({ items: (dataItems as any[]) ?? [] });
          const result = await inlineSource.find('', {
            $filter: schema.filter,
            $orderby: convertSortToQueryParams(schema.sort),
            // The same platform ceiling the `object` arm sends, on the same
            // probe-row convention (objectui#7210, ruling a′). The ruling's
            // budget is measured in DOM elements PER RECORD and its own
            // measurement table was taken over the inline `value` provider, so
            // an inline event costs the browser exactly what a fetched one
            // costs and the ruling text carves out no provider.
            // ⛔ Still not authorable: no view key reaches this `$top`.
            $top: NON_GRID_ROW_CEILING_TOP,
          });
          // Filter first, ceiling second — `ValueDataSource` applies `$filter`
          // before `$top`, which is what the fetching path gets for free from
          // every backend. A large inline array that an authored `filter` cuts
          // below the ceiling therefore draws every matching row and stays
          // quiet.
          const capped = applyNonGridRowCeiling(result);
          if (isMounted) {
            setData(capped.rows);
            setRowCeiling({ truncated: capped.truncated, total: capped.total });
            setLoading(false);
          }
          return;
        }

        if (!dataSource || typeof dataSource.find !== 'function') {
          throw new Error('DataSource required for object/api providers');
        }

        if (dataProvider === 'object') {
          // `schemaObjectName` already resolves this same 'object' branch's
          // `dataConfig.object` (required on that discriminated-union
          // variant), computed once above for the schema-fetch gate too.
          const objectName = schemaObjectName as string;
          // Auto-inject $expand for lookup/master_detail fields
          // Reached only with the schema resolved (the gate above), so a
          // calendar whose object declares relations queries WITH its
          // expansion the first time. `objectSchema` is `null` here only
          // when there was nothing to resolve it from.
          //
          // [objectui#7230] FIELD-LEVEL SECURITY ON `$expand` — the same gate
          // objectui#7215 / PR #7229 put on the two projection sites in its
          // scope, brought to this one. `$select` on a denied lookup asks the
          // server for a bare foreign key; `$expand` asks it to RESOLVE the
          // relation and return the related record, which is the larger of the
          // two requests.
          //
          // ⚠️ THIS SITE PASSES NO COLUMN LIST, which makes it the sharp one:
          // `buildExpandFields` reads an absent column list as "no column
          // restriction" and falls back to EVERY declared relation on the
          // object, denied ones included. A standalone calendar therefore asks
          // for the maximum possible set by default, not by configuration.
          //
          // Graded as objectui#7215 graded it, by measurement rather than
          // assumption: against ObjectStack this is defence-in-depth, because
          // `plugin-security`'s `FieldMasker.maskRecord` does
          // `delete result[field]` on every unreadable key and objectql's
          // expand path writes the resolved record back under THAT SAME KEY, so
          // one statement removes the expanded object and the bare id alike;
          // the expansion sub-read itself takes the referenced object's full
          // CRUD + RLS + FLS treatment (objectstack#7626). It is load-bearing
          // for a backend that does not strip.
          //
          // ⭐ THE GATE IS ON THE HELPER'S OUTPUT, and on this site the
          // alternative is not merely unsound but unreachable — the call passes
          // `undefined`, so there is no input to gate. Gating the output also
          // gives the required ordering structurally: `buildExpandFields`
          // returns a subset of the object's DECLARED reference-bearing fields,
          // so every name judged here is declared by construction and the
          // "`checkField` answers false for an undeclared key" trap cannot be
          // reached. Pinned in `__tests__/ObjectCalendar.expandFls-7230.test.tsx`.
          //
          // Deferral matches every other gate on this path: an unanswered
          // policy filters nothing, and `perms` is in this effect's dependency
          // list, so the expansion is rebuilt the moment the answer arrives.
          const expandable = buildExpandFields(objectSchema?.fields);
          const expand = !perms?.isLoaded
            ? expandable
            : expandable.filter((f) => perms.checkField(objectName, f, 'read'));
          const result = await dataSource.find(objectName, {
            $filter: schema.filter,
            $orderby: convertSortToQueryParams(schema.sort),
            // The platform ceiling (objectui#7210, ruling a′). A calendar
            // still fetches the whole FILTERED set — it cannot lay out a month
            // from a page whose rows all fall in one week — but the fetch now
            // stops at a number. The one probe row past the ceiling is what
            // makes the cut detectable; `applyNonGridRowCeiling` slices it off.
            // ⛔ Not authorable: no view key reaches this `$top`.
            $top: NON_GRID_ROW_CEILING_TOP,
            ...(expand.length > 0 ? { $expand: expand } : {}),
          });

          const capped = applyNonGridRowCeiling(result);

          if (isMounted) {
            setData(capped.rows);
            setRowCeiling({ truncated: capped.truncated, total: capped.total });
          }
        } else if (dataProvider === 'api') {
          console.warn('API provider not yet implemented for ObjectCalendar');
          if (isMounted) setData([]);
        }
        
        if (isMounted) setLoading(false);
      } catch (err) {
        console.error('[ObjectCalendar] Error fetching data:', err);
        if (isMounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [hasExternalData, dataProvider, schemaObjectName, dataItems, dataSource, hasInlineData,
      schema.filter, schema.sort, refreshKey, objectSchemaReady, objectSchema, perms]);

  // Transform data to calendar events, and separate out the records that have
  // no date to be placed on at all (objectui#7071 — see the early return in the
  // loop below). ONE pass, so the two lists are always answers about the same
  // dataset and the count under the calendar can never disagree with the grid.
  const { events, unscheduledRecords } = useMemo(() => {
    if (!calendarConfig || !data.length) {
      return { events: [] as CalendarViewEvent[], unscheduledRecords: [] as UnscheduledRecord[] };
    }

    const { startDateField, endDateField, titleField, colorField, allDayField } = calendarConfig;
    // `colorField` NAMES A FIELD to derive a colour from (objectui#7243). The
    // shared ladder answers the two rungs that depend only on the field's own
    // metadata — the option `color` the author declared for this value, then
    // the value itself when it already IS a colour literal. Built once for the
    // whole dataset, not per record.
    const resolveColorFieldValue = createFieldColorResolver(
      (objectSchema?.fields as Record<string, any> | undefined)?.[colorField ?? ''],
    );
    const resolveTitle = (record: Record<string, any>): string => {
      // 1. Explicit titleField wins when present on the record.
      if (titleField) {
        const v = record[titleField];
        const s = typeof v === 'string' ? v.trim() : v;
        if (s) return String(s);
      }
      // 2-4. Unified object-level resolver (ADR-0079): objectSchema.titleFormat
      //   → objectSchema.displayNameField → type-aware field derivation →
      //   `Record #<id>` floor. Replaces the old per-view chain (template render
      //   → NAME_FIELD_KEY → hard-coded name list → "Untitled") so an event
      //   object whose name lives in e.g. `activity_name` shows the real name.
      return getRecordDisplayName(objectSchema, record);
    };

    const scheduled: CalendarViewEvent[] = [];
    const unscheduled: UnscheduledRecord[] = [];

    data.forEach((record, index) => {
      const startDate = record[startDateField];
      const endDate = endDateField ? record[endDateField] : null;
      const title = resolveTitle(record);
      // Last rung stays where it was: a value no option colours is handed on
      // RAW, so `CalendarView.resolveEventColor` still recognises a Tailwind
      // utility string and still hashes a plain category label onto its
      // theme-aware 8-stop palette. Retiring that would repaint every existing
      // calendar whose `colorField` points at a plain categorical field, which
      // is well beyond this fix.
      const colorRaw = colorField ? record[colorField] : undefined;
      const color = resolveColorFieldValue(colorRaw) ?? colorRaw;
      const id = record.id || record._id || `event-${index}`;

      // NO VALUE in the declared start field means the record has no date —
      // full stop (objectui#7071, ruled 2026-09-01, re-confirmed 2026-09-02).
      // This line used to read `startDate ? new Date(startDate) : new Date()`,
      // so a record missing its date was handed THE CURRENT MOMENT and drawn on
      // today's cell as an ordinary event. The `isNaN` guard below could not
      // catch that by construction: a no-argument `new Date()` is always valid,
      // so the absent-value case was converted into a well-formed lie *before*
      // the check that would have caught it. `end`, three lines down, has
      // always been honest about the same absence (`undefined`); this is
      // `start` catching up. The record leaves the grid entirely and is counted
      // in the "unscheduled" area below the calendar instead: nothing is
      // invented, and nothing disappears without a count.
      if (!startDate) {
        unscheduled.push({ id, title });
        return;
      }

      const start = new Date(startDate);
      // The guard keeps its ORIGINAL job, on a DIFFERENT fact from the one
      // above: a value that is PRESENT but unparseable ('not a date') is
      // dropped here, never bucketed as unscheduled. Absent and malformed are
      // two distinct defects and the two paths stay distinguishable.
      if (isNaN(start.getTime())) return; // Filter out invalid dates

      scheduled.push({
        id,
        title,
        start,
        end: endDate ? new Date(endDate) : undefined,
        color,
        // ⭐ objectui#8026 — the DECLARED key is the answer when there is one.
        // `allDayField` was resolved into the config above and named in the
        // memo dependency list, and then read by nothing: a record with a real
        // end date that IS flagged all-day drew as an ordinary timed event,
        // with no diagnostic. The value was arriving, too — `ListView`'s
        // `collectViewFields` already puts this field into the fetch and
        // `ObjectView`'s `calendarViewOptions` forwards the authored `calendar`
        // block verbatim — so the flag was fetched and dropped right here.
        //
        // ⛔ NO `|| 'allDay'` DEFAULT. That is the one deliberate divergence
        // from the `calendar-view` sibling, which spells `schema.allDayField ||
        // 'allDay'`, and it is measured rather than stylistic: this component
        // honours NONE of that sibling's five field-name defaults. `titleField`
        // / `endDateField` / `colorField` all read the authored name or nothing,
        // and an absent `startDateField` reaches the refusal screen rather than
        // a guess — objectui#7029, ruled objectstack#13748 batch #19 option A,
        // whose whole content was deleting fabricated field bindings upstream.
        // The sibling's defaults describe the canonical AUTHORED EVENT shape
        // `{ title, start, end, allDay, color }`, which is what a `calendar-view`
        // node literally carries in its `data`; this component's records are
        // ObjectQL records of a business object, where nothing makes `allDay` a
        // field name. Importing one of five defaults would put the last guess
        // back into the one file whose refusal screen exists to refuse guessing.
        //
        // ⇒ DECLARED means that field is the answer, absolutely: a record whose
        // flag is absent or false is NOT all-day. Letting the inference run
        // behind a declared key would silently overrule the author, which is
        // this card's own defect inverted. UNDECLARED means nothing changes —
        // every calendar that never authored the key renders as it did before.
        //
        // The `!endDate` arm keeps its objectui#7071 reading unchanged: only a
        // record that HAS a start reaches this line, so one absent field can no
        // longer set two rendered properties. A record without a start is
        // unscheduled, not all-day.
        allDay: allDayField ? Boolean(record[allDayField]) : !endDate,
        data: record,
      });
    });

    return { events: scheduled, unscheduledRecords: unscheduled };
  }, [data, calendarConfig, objectSchema]);

  // Get days in current month view - REMOVED (Handled by CalendarView)
  
  const handleCreate = useCallback(() => {
    // Standard "Create" action trigger
    const today = new Date();
    onDateClick?.(today);
  }, [onDateClick]);

  // --- NavigationConfig support ---
  // Must be called before any early returns to satisfy React hooks rules
  // When the local navigation mode is an overlay (drawer/modal), ignore the
  // inherited onRowClick so the local overlay wins over parent page-nav.
  // No width is spelled here on purpose (objectui#6303, converging the calendar
  // on the shape #6305 gave ObjectGantt). `width` is `@deprecated [#2578 ->
  // size]` in the spec that owns this shape, and `resolveOverlayWidth` gives an
  // explicit `width` priority OVER `size` — so spelling it kept the deprecated
  // branch load-bearing on the path most calendars take (no declared
  // `navigation`), and made the size buckets unreachable there. Omitting both
  // leaves `resolveOverlayWidth` returning `undefined`, which is what
  // RecordDetailDrawer's own `width` default is for; that default is the
  // identical `min(960px, 60vw)`, so this is a zero-pixel change on every
  // viewport. The absent width is deliberate, not an oversight — do not
  // "restore" it. Pinned by `ObjectCalendar.navWidthDefault.test.tsx`, both
  // halves, because the equivalence now depends on the drawer's default too.
  //
  // Deliberately NOT converged on `size: 'lg'` either: that bucket is
  // `min(92vw, 960px)`, which agrees with the above only at viewport >= 1600px
  // and is up to 53% wider below it. That move is a real behaviour change, and
  // it was RULED AGAINST: objectui#6584, 2026-08-27 — stays on the CSS
  // literal; no bucket convergence. All four surfaces (gantt, kanban,
  // calendar, RecordDetailDrawer) keep today's pixels. The question is
  // CLOSED, not open — do not re-open it as a cleanup. If bucket-vocabulary
  // unification ever becomes a product direction that is a fresh ruling,
  // with visual-regression evidence across all four surfaces in one stroke.
  // ⛔ The ONE cast objectui#8651 left standing, deliberately. `navigation` is
  // objectui#8652's key: the maintainer ruled B there — declare it on the
  // platform element schemas first, then mirror — and that card is `pm:blocked`
  // on objectstack#17987. Its declaredness verdict at this read site is
  // UNCHANGED by this card: through the retired union it was undeclared too,
  // and it is undeclared on `ObjectCalendarSchema`. The rule that makes that
  // come out right is NOT "declared on every arm". In the checker reading
  // recorded above, five keys ride the union although only ONE arm declares
  // them — `colorField`, `dateField`, `defaultView`, `endField` and
  // `titleField` — because `ObjectGridSchema`'s index signature supplies them.
  // The rule is: a union
  // member is available only when EVERY arm supplies it — by its own
  // declaration OR through an applicable index signature. `CalendarSchema` has
  // neither for `navigation`, so the union does not carry it. Ledgered by name, and
  // asserted to be STILL READ, in `__tests__/calendarUnionReads-8651.test.tsx`.
  const navConfig = (schema as any).navigation ?? { mode: 'drawer' };
  const navIsOverlay = navConfig.mode === 'drawer' || navConfig.mode === 'modal' || navConfig.mode === 'split' || navConfig.mode === 'popover';
  const navigation = useNavigationOverlay({
    navigation: navConfig,
    // The record-page URL follows the RECORD SOURCE (objectui#7638): the very
    // `schemaObjectName` resolved above, which already keys this calendar's
    // record query and which the detail drawer at the bottom of this file
    // resolves the same way. Before this it read the bare `schema.objectName`,
    // so ONE click resolved the drawer through the objectui#6939 ladder and the
    // navigation URL through the top-level key — two receivers, one gesture,
    // two different objects.
    //
    // The `?? schema.objectName` tail is NOT the shared rung repeated: it is
    // this site's own coercion of the OFF-CONTRACT `data: { provider: 'object' }`
    // that carries no `object` (`ViewDataSchema` declares it required), and it
    // is here so this conversion changes nothing this component navigates to
    // today EXCEPT the divergence it closes. `ObjectTree`'s converted site and
    // `headerObjectName` both keep the same tail for the same reason.
    objectName: schemaObjectName ?? schema.objectName,
    onRowClick: navIsOverlay ? undefined : onRowClick,
  });

  // objectui#9299 item 3 — `popover` anchors to the EVENT the user clicked.
  // `CalendarView` hands `onEventClick` a calendar event object, not a DOM
  // event, so the anchor is recorded by a capture listener on this component's
  // own container instead.
  const { anchorRef, anchorCaptureProps } = useOverlayAnchor();

  // Default drag-to-reschedule handler. When the caller hasn't provided an
  // `onEventDrop`, persist the new dates back to the data source so dragging
  // an event in the month view actually changes the record. Optimistic
  // update local state first for snappy feedback; revert on failure.
  // NOTE: This hook (and the quick-create hooks below) MUST be declared
  // before the early returns for `loading` / `error` / `!calendarConfig`,
  // otherwise React detects a hook-order change when those conditions
  // flip across re-renders (e.g. tab switching between board → calendar).
  const handleEventDropDefault = useCallback(async (record: any, newStart: Date, newEnd?: Date) => {
    if (!calendarConfig) return;
    const { startDateField, endDateField } = calendarConfig;
    const id = record?.id ?? record?._id;
    if (!id || !schema.objectName || !dataSource?.update) return;

    const patch: Record<string, string> = {
      [startDateField]: newStart.toISOString(),
    };
    if (endDateField && newEnd) {
      patch[endDateField] = newEnd.toISOString();
    }

    // Optimistic UI update
    const prevData = data;
    setData(prev =>
      prev.map(r => ((r?.id ?? r?._id) === id ? { ...r, ...patch } : r))
    );

    try {
      await dataSource.update(schema.objectName, id, patch);
      // Parent (e.g. ObjectView) listens on onMutation and will refetch.
      // In standalone mode the mutation subscription bumps refreshKey.
    } catch (err) {
      // Roll back optimistic state
      setData(prevData);
      console.error('[ObjectCalendar] Failed to persist drag-and-drop reschedule:', err);
      // Surface the failure — never silently snap the event back. A row-level
      // security denial (403) is the common case: the user lacks permission to
      // reschedule this record. (cloud#864)
      // …unless the AUTHOR opted in. `userMessage` (objectstack#9934) is the
      // producer-side marking: a field set at throw time to say "this text is
      // for the end user". It is a SEPARATE field from `message`, so nothing
      // unmarked can reach here — the substitution below still governs every
      // platform diagnostic and #3821 holds by construction rather than by us
      // guessing what a body contains. Status-agnostic on purpose: 403 is
      // where this was reported (objectui#5210/#5902), not a fence the
      // contract draws — a marked 409 or 400 renders identically.
      toast.error(
        declaredUserMessage(err) ??
          (isPermissionError(err)
            ? tt('errors.unauthorized', 'You are not authorized to perform this action.')
            : extractWriteErrorMessage(err) ?? tt('table.saveFailed', 'Save failed')),
      );
    }
  }, [calendarConfig, schema.objectName, dataSource, data, tt]);

  // Quick-create state: clicking an empty day cell opens a small dialog
  // pre-filled with that date. On submit, dataSource.create() inserts a
  // record and the mutation event triggers a refetch.
  // `start` always set; `end` set for time-range drags from week/day grid.
  // For month-cell click, `end` equals `start` and the dialog shows date-only.
  const [quickCreate, setQuickCreate] = useState<{ start: Date; end?: Date; title: string; submitting: boolean; error?: string } | null>(null);

  const handleDateClickDefault = useCallback((day: Date) => {
    if (!calendarConfig || !schema.objectName || !dataSource?.create) return;
    setQuickCreate({ start: day, title: '', submitting: false });
  }, [calendarConfig, schema.objectName, dataSource]);

  const handleTimeRangeSelectDefault = useCallback((start: Date, end: Date) => {
    if (!calendarConfig || !schema.objectName || !dataSource?.create) return;
    setQuickCreate({ start, end, title: '', submitting: false });
  }, [calendarConfig, schema.objectName, dataSource]);

  const submitQuickCreate = useCallback(async () => {
    if (!quickCreate || !calendarConfig) return;
    const title = quickCreate.title.trim();
    if (!title) {
      setQuickCreate(qc => qc ? { ...qc, error: 'Title is required' } : qc);
      return;
    }
    if (!schema.objectName || !dataSource?.create) return;

    setQuickCreate(qc => qc ? { ...qc, submitting: true, error: undefined } : qc);
    const { startDateField, endDateField, titleField } = calendarConfig;
    const payload: Record<string, any> = {
      [titleField || 'name']: title,
      [startDateField]: quickCreate.start.toISOString(),
    };
    // Default end_date to range end (or same as start if not provided).
    if (endDateField) {
      payload[endDateField] = (quickCreate.end ?? quickCreate.start).toISOString();
    }
    // Auto-fill required fields the user hasn't provided (e.g. select
    // status, autonumber). Without this the server would 400 on
    // NOT NULL constraint. Uses first option for picklists; falls back
    // to defaultValue or sensible empty string for text.
    const fieldsMeta = objectSchema?.fields;
    if (fieldsMeta && typeof fieldsMeta === 'object') {
      const entries: [string, any][] = Array.isArray(fieldsMeta)
        ? fieldsMeta.map((f: any) => [f.name ?? f.apiName, f] as [string, any])
        : Object.entries(fieldsMeta);
      for (const [name, def] of entries) {
        if (!name || name in payload) continue;
        if (!def?.required) continue;
        if (def.defaultValue !== undefined && def.defaultValue !== null) {
          payload[name] = def.defaultValue;
          continue;
        }
        const t = def.type;
        if (t === 'select' || t === 'picklist' || t === 'status') {
          const opts = (def.options || def.choices || []) as any[];
          const first = opts[0];
          if (first !== undefined) {
            payload[name] = typeof first === 'object' ? (first.value ?? first.id) : first;
          }
        } else if (t === 'boolean' || t === 'checkbox') {
          payload[name] = false;
        } else if (t === 'number' || t === 'integer' || t === 'decimal' || t === 'currency' || t === 'percent') {
          payload[name] = 0;
        }
        // autonumber/text/date that are required but not provided will fall
        // through; the server will surface a clear error which we display.
      }
    }
    try {
      const created = await dataSource.create(schema.objectName, payload);
      // Optimistically insert into local state so the new event appears
      // immediately. Different DataSource implementations may return the
      // record directly, wrapped in `{record}`, or wrapped in `{data}`.
      const c: any = created;
      const newRecord = (c && (c.record || c.data || c)) ?? null;
      if (newRecord && (newRecord.id !== undefined || newRecord._id !== undefined)) {
        setData(prev => [...prev, newRecord]);
      }
      setQuickCreate(null);
    } catch (err: any) {
      const msg = err?.message || String(err);
      setQuickCreate(qc => qc ? { ...qc, submitting: false, error: msg } : qc);
      console.error('[ObjectCalendar] Quick-create failed:', err);
    }
  }, [quickCreate, calendarConfig, schema.objectName, dataSource, objectSchema]);

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading calendar...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-96">
          <div className="text-destructive">Error: {error.message}</div>
        </div>
      </div>
    );
  }

  if (!calendarConfig) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">
            Calendar configuration required. Please specify startDateField and titleField.
          </div>
        </div>
      </div>
    );
  }

  /**
   * The record overlay — ONE payload in whichever shell the author declared.
   *
   * ⭐ objectui#9299. This used to be `<RecordDetailDrawer>`, which brought its
   * own `Sheet` and had no `mode` parameter, so an authored `modal`, `split` or
   * `popover` silently rendered the drawer (measured on PR objectui#9296). The
   * payload now mounts through the shared `NavigationOverlay` — the same shell
   * `ObjectGrid` and `ObjectTree` use — so the four declared modes mean the
   * same thing on every view type.
   *
   * `mainContent` is what `split` needs: the calendar itself goes in the left
   * panel beside the record panel (item 2). `popoverAnchorRef` is what
   * `popover` needs: the event the user clicked (item 3).
   */
  const renderRecordOverlay = (mainContent?: React.ReactNode): React.ReactNode => {
    if (!navigation.isOverlay || !navigation.isOpen || !navigation.selectedRecord) return null;
    const objectName = resolveRecordSourceObjectName(schema, dataConfig);
    const rec = navigation.selectedRecord as Record<string, any>;
    const recordId = rec.id ?? rec._id;
    if (!objectName || recordId == null) return null;
    const titleText = calendarConfig?.titleField
      ? String(rec[calendarConfig.titleField] ?? 'Event Details')
      : 'Event Details';
    return (
      <NavigationOverlay
        {...navigation}
        title={titleText}
        mainContent={mainContent}
        popoverAnchorRef={anchorRef}
        // One drag-resize implementation, one key, and a width the user had
        // already chosen under the retired `objectui.drawerWidth.OBJECT`
        // carries over rather than resetting (item 4).
        storageKey={recordOverlayWidthStorageKey(objectName)}
        legacyStorageKey={legacyRecordDrawerWidthKey(objectName)}
        // ⛔ Not `navigation.width` alone: an unauthored width has to land on
        // the ruled default (objectui#6584 / #6303) rather than on the shell's
        // own `42rem` floor, which would narrow this surface.
        width={navigation.width ?? RECORD_OVERLAY_DEFAULT_WIDTH}
      >
        {() => (
          <div className="px-6 pt-6 pb-6">
            <RecordDetailPanel
              record={rec}
              objectName={objectName}
              recordId={recordId}
              dataSource={dataSource}
              objectSchema={objectSchema as any}
              onClose={navigation.close}
              fullPageHref={deriveRecordPageHref(objectName, recordId) ?? undefined}
              onFieldSave={async (field, value) => {
                if (!dataSource?.update) return;
                await dataSource.update(objectName, String(recordId), { [field]: value });
                setData((prev) => prev.map((r) =>
                  String(r.id ?? r._id) === String(recordId)
                    ? { ...r, [field]: value }
                    : r,
                ));
              }}
              onDelete={async () => {
                if (!dataSource?.delete) return;
                await dataSource.delete(objectName, String(recordId));
                setData((prev) => prev.filter((r) =>
                  String(r.id ?? r._id) !== String(recordId),
                ));
              }}
            />
          </div>
        )}
      </NavigationOverlay>
    );
  };

  const calendarView = (
    <div ref={pullRef} className={className} {...anchorCaptureProps}>
      {pullDistance > 0 && (
        <div
          className="flex items-center justify-center text-xs text-muted-foreground"
          style={{ height: pullDistance }}
        >
          {isRefreshing ? 'Refreshing…' : 'Pull to refresh'}
        </div>
      )}
      <div className="bg-background h-[calc(100vh-120px)] sm:h-[calc(100vh-160px)] md:h-[calc(100vh-200px)] min-h-[400px] sm:min-h-[600px]">
        <CalendarView
          events={events}
          currentDate={currentDate}
          view={view}
          locale={locale}
          onEventClick={(event) => {
            navigation.handleClick(event.data);
            // When the local navigation is an overlay, the drawer wins —
            // don't also fire parent's onEventClick (which would page-navigate).
            if (!navIsOverlay) {
              onEventClick?.(event.data);
            }
          }}
          // Quick-create on empty-day click. Caller-supplied onDateClick
          // wins; otherwise open the quick-create dialog.
          onDateClick={(day) => {
            if (onDateClick) {
              onDateClick(day);
            } else {
              handleDateClickDefault(day);
            }
          }}
          onNavigate={(date) => {
            setCurrentDate(date);
            onNavigate?.(date);
          }}
          onViewChange={(v) => {
            setView(v);
            onViewChange?.(v);
          }}
          onAddClick={undefined}
          // Wire drag-to-reschedule: caller-supplied handler wins, otherwise
          // fall back to persisting via dataSource.update().
          onEventDrop={(event, newStart, newEnd) => {
            if (onEventDrop) {
              onEventDrop(event.data, newStart, newEnd);
            } else {
              void handleEventDropDefault(event.data, newStart, newEnd);
            }
          }}
          onTimeRangeSelect={handleTimeRangeSelectDefault}
        />
      </div>
      {/* objectui#7210 — a month drawn from the first N rows of a larger set
          still reads as a complete month; the note is the only thing that says
          otherwise. Placement follows objectui#7148's chart footnote. */}
      <NonGridRowCeilingNote
        drawn={NON_GRID_ROW_CEILING}
        total={rowCeiling.total}
        truncated={rowCeiling.truncated}
      />

      {/* The "unscheduled" containment area (objectui#7071, ruled 2026-09-01 and
          re-confirmed 2026-09-02). Records with no value in the declared start
          field are no longer given a fabricated date, so they are not on the
          grid above — they are counted here and listed on demand, which is what
          makes their absence from the grid honest rather than silent.

          Rendered only when there is something to report: a calendar whose
          records all carry a date looks exactly as it did before.

          ⛔ Deliberately inert, and that is the ruling, not an omission: no
          drag-to-schedule, no date picker, no way to assign a date from here.
          The ruled affordance is a visible count and an expandable list, and
          nothing more. Do not grow this into a scheduling surface without a
          fresh ruling. */}
      {unscheduledRecords.length > 0 && (
        <div className="mt-2 border-t pt-2" data-calendar-unscheduled="">
          <button
            type="button"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            aria-expanded={unscheduledOpen}
            onClick={() => setUnscheduledOpen((open) => !open)}
          >
            <ChevronRight
              aria-hidden="true"
              className={cn('h-4 w-4 transition-transform', unscheduledOpen && 'rotate-90')}
            />
            {t('calendar.unscheduled', {
              count: unscheduledRecords.length,
              defaultValue: 'Unscheduled ({{count}})',
            })}
          </button>
          {unscheduledOpen && (
            <ul className="mt-1 space-y-1 pl-6" data-calendar-unscheduled-list="">
              {unscheduledRecords.map((record) => (
                <li key={record.id} className="truncate text-sm">
                  {record.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Quick-create dialog: opens when the user clicks an empty day cell.
          Pre-fills start_date (and end_date) with the clicked day; only the
          title is required. The full record can be edited afterward via the
          standard detail page. */}
      <Dialog open={!!quickCreate} onOpenChange={(open) => {
        if (!open) setQuickCreate(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New event</DialogTitle>
            <DialogDescription>
              {quickCreate && (() => {
                const hasRange = quickCreate.end && quickCreate.end.getTime() !== quickCreate.start.getTime();
                const datePart = quickCreate.start.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
                if (hasRange) {
                  const fmt = (d: Date) => d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
                  return <>{datePart} · {fmt(quickCreate.start)} – {fmt(quickCreate.end!)}</>;
                }
                return <>On {datePart}</>;
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="quick-create-title">Title</Label>
            <Input
              id="quick-create-title"
              autoFocus
              value={quickCreate?.title ?? ''}
              onChange={(e) => setQuickCreate(qc => qc ? { ...qc, title: e.target.value, error: undefined } : qc)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !quickCreate?.submitting) {
                  e.preventDefault();
                  void submitQuickCreate();
                }
              }}
              placeholder="What's this event about?"
              disabled={quickCreate?.submitting}
            />
            {quickCreate?.error && (
              <p className="text-sm text-destructive">{quickCreate.error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setQuickCreate(null)}
              disabled={quickCreate?.submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void submitQuickCreate()}
              disabled={quickCreate?.submitting || !quickCreate?.title.trim()}
            >
              {quickCreate?.submitting ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );

  // `split` (item 2): the calendar IS the main content — it moves into the
  // overlay's left panel with the record panel beside it, rather than being
  // covered by a drawer. Guarded on an OPEN overlay because the split shell
  // renders nothing when closed; with nothing open the calendar renders alone,
  // exactly as before.
  if (
    navigation.isOverlay
    && navigation.mode === 'split'
    && navigation.isOpen
    && navigation.selectedRecord
  ) {
    const splitOverlay = renderRecordOverlay(calendarView);
    // `null` means this record has no overlay at all (no object name / no id)
    // — the calendar still has to render.
    if (splitOverlay) return <>{splitOverlay}</>;
  }

  return (
    <>
      {calendarView}
      {renderRecordOverlay()}
    </>
  );
};
