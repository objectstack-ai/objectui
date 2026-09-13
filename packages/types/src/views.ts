/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @object-ui/types - View Component Schemas
 * 
 * Type definitions for various view components (List, Detail, Grid, Kanban, Calendar).
 * These schemas enable building different data visualization interfaces.
 * 
 * @module views
 * @packageDocumentation
 */

import type { BaseSchema, SchemaNode } from './base.js';
import type { ActionSchema } from './crud.js';
import type { SelectOptionMetadata } from './field-types.js';
import type { ListView as SpecListView } from '@objectstack/spec/ui';

/**
 * View Type — the list-view types `@objectstack/spec` publishes, plus the two
 * objectui view CATEGORIES that are not list-view types at all.
 *
 * DERIVED from `@objectstack/spec/ui` `ListView['type']`, never re-declared
 * (objectui#8127). The eleven-arm hand-written union this replaces was total
 * over a copy of the spec's list of 17.2.0, and `@objectstack/spec@17.3.0`
 * added `page` to that list. Nothing went red, because every structure keyed
 * on this union was total over the COPY — a total map is only as honest as the
 * union it is total over, and a locally re-declared union silently converts an
 * exhaustiveness guarantee into a no-op. Deriving is what makes the next
 * addition to the spec's list fail the build in every one of those structures.
 *
 * ⚠️ Not every member here is a VISUALIZATION. `@objectstack/spec/ui` models
 * those separately as `VisualizationType`, and that is the union
 * `AppearanceConfig.allowedVisualizations` is typed on — it does NOT contain
 * `page`, because a `type: 'page'` list view mounts a published page (bound
 * through `pageName`) in place of rows rather than drawing records. Structures
 * that enumerate what a renderer DRAWS must therefore derive from the
 * visualization union, not from this one; `@object-ui/core`'s
 * `ListViewVisualization` is that derivation.
 *
 *  - `list` is the view CATEGORY, not a list-view type.
 *  - `detail` is a different renderer (`plugin-detail`) entirely.
 *
 * Both are objectui vocabulary with no spec counterpart, so they are unioned
 * on here rather than pushed upstream.
 */
export type ViewType = NonNullable<SpecListView['type']> | 'list' | 'detail';

/**
 * Per-view `tree` configuration — the HOST-composition contract
 * (objectui#8253), DERIVED from `@objectstack/spec` rather than re-declared
 * (objectui#8841).
 *
 * This is the block a host writes as `tree` on a `views` entry
 * (`ObjectViewProps.views[n].tree`, or `options.tree` on a stored view record).
 * ⛔ Do not re-derive a private copy of it: the module-local `TreeConfig` in
 * `plugin-tree/src/ObjectTree.tsx` that used to be the only description of these
 * keys is now an import of this type, and objectui#7646 is the shape a second
 * copy takes.
 *
 * ## Why this is an ALIAS and not an interface (objectui#8841)
 *
 * The spec owns this block. `@objectstack/spec` declares it as `TreeConfig` and
 * hangs it on `ListView.tree`, and this package already publishes that same
 * block derived — `zod/objectql.zod.ts` extends `SpecListViewSchema.shape` by
 * reference and `tree` is not in `LIST_VIEW_LOCAL_OVERRIDES`. objectui#8253
 * shipped this name as a hand-written INTERFACE instead: a faithful copy of a
 * spec object under a second name. That is objectui#4592's blind spot stated
 * exactly — `scripts/check-spec-symbol-derivation.mjs` matches BY NAME, so a
 * hand copy RENAMED away from the spec's symbol has nothing for rule 1 to
 * match, and it passes every run while it drifts.
 *
 * It had already drifted when it landed. The copy declared a fifth key,
 * `titleField`, which `@objectstack/spec@17.4.0` REFUSES on `ListView.tree` by
 * name — `TreeConfigSchema` is a `strictObject` since spec #15469 closed the
 * `.passthrough()` window 17.3.0 left open. So this package's published face
 * accepted what the protocol rejects, and an author who followed this type was
 * refused at publish. 协议为基准: this type now IS the spec's, so the next key
 * the protocol adds, renames or retypes arrives here without an edit, and a key
 * the protocol never declared cannot be added here at all.
 *
 * ⛔ Not a `Pick` of the spec's keys. A `Pick` restates the key list, and a
 * restated key list is exactly what let `titleField` through. The `Pick`
 * interim objectui#8841 offered was conditional on the 17.4.0 bump not having
 * happened yet — it landed on `main` before this change (`chore(deps): take the
 * 17.4.0 @objectstack/* line`), so the pinned spec is already strict and the
 * plain alias is available.
 *
 * ## `titleField` is NOT declared here; the reads that survive are tolerance
 *
 * objectui#8253's own ruling put the key to a measurement — declare it if the
 * console WRITES it, else delete the read — and the measured answer is no: the
 * console's create-view dialog collects `parentField` alone in its `tree` slot
 * (`app-shell/src/views/CreateViewDialog.tsx`), while `titleField` is what its
 * calendar / timeline / gantt slots collect. The `schema.titleField` rung in
 * `getTreeConfig` goes with this change; the three `labelField || titleField`
 * dual-reads (`plugin-view`, `plugin-list`, `app-shell`) stay as ⛔ UNDECLARED
 * tolerant fallbacks, reading through `any` and declared by nothing on either
 * side. They are recorded for a follow-up, ⛔ not re-declared: fossilising a
 * renderer-side alias into a second contract is what AGENTS.md #0.1 bans, and
 * it is what this change undoes.
 *
 * ## Why it is a contract at all (objectui#8253, ruling batch #78, 2026-09-07)
 *
 * Maintainer 「同意」 on option (a): a configuration a real host STORES and
 * RE-WRITES is a contract and has a type. The live host is the console — it
 * passes stored view records to `ObjectView` as `views`, and its create-view
 * dialog offers `tree`. Until this declaration existed a console user's
 * misspelled `parentFeild` was admitted by the `[key: string]: any` on the
 * views entry, read by nobody, and reported by nothing: declared ≠ enforced on
 * a surface a non-author re-writes.
 *
 * ## Why the name is aliased here, and what it is NOT
 *
 * `tree` is a HOST-COMPOSITION-ONLY view type, ruled deliberate on objectui#5321
 * (maintainer ruling B, 2026-08-20): it is a member of neither
 * `ObjectViewSchema.defaultViewType` nor `NamedListView.type`, so no AUTHORED
 * document selects a tree view and the branch runs only when a host passes a
 * `views` prop. ⛔ That ruling is untouched — aliasing the host path does not
 * put `tree` on an authored union, and this type is NOT the `object-tree` NODE
 * schema. The node an author writes is `ObjectTreeSchema` (`./objectql.ts`),
 * whose keys sit FLAT on the node; this block sits nested under a view entry
 * and is written by a host, never by a document author.
 *
 * ## The reader census this alias is exactly total over
 *
 * Every key is read, and every read of this BLOCK is of a key the spec declares:
 *
 *   - `plugin-tree/src/ObjectTree.tsx`      `getTreeConfig` — the resolver
 *   - `plugin-view/src/ObjectView.tsx`      the `'tree'` branch of `generateViewSchema`
 *   - `plugin-list/src/ListView.tsx`        the `'tree'` branch
 *   - `app-shell/src/views/ObjectView.tsx`  `options.tree`, the console's own composition
 *
 * ⚠️ `fields` is `string[]`, matching `ObjectTreeSchema.fields`, even though
 * `ObjectTree`'s `fieldKey` also normalises a column OBJECT
 * (`{ name | fieldName | field | key }`). That tolerance exists because hosts
 * like `ListView` forward their own already-resolved column entries into the
 * same slot; it is a reader's resilience, ⛔ not an invitation to write column
 * objects here — and it is now the SPEC that refuses the wider form, not a
 * local choice.
 */
export type TreeViewConfig = NonNullable<SpecListView['tree']>;

/**
 * Detail View Field Configuration
 */
export interface DetailViewField {
  /**
   * Field name/path
   */
  name: string;
  /**
   * Display label
   */
  label?: string;
  /**
   * Field type for rendering.
   * Supports both display-oriented types (image, link, badge, json, html, markdown, custom)
   * and data-oriented types (number, currency, percent, boolean, select, lookup, master_detail,
   * email, url, phone, user) for type-aware cell rendering via getCellRenderer.
   */
  type?: 'text' | 'number' | 'currency' | 'percent' | 'boolean' | 'select' | 'lookup' | 'master_detail'
    | 'email' | 'url' | 'phone' | 'user'
    | 'image' | 'link' | 'badge' | 'date' | 'datetime' | 'json' | 'html' | 'markdown' | 'custom';
  /**
   * Format string (e.g., date format)
   */
  format?: string;
  /**
   * Custom renderer
   */
  render?: SchemaNode;
  /**
   * Field value
   */
  value?: any;
  /**
   * Whether field is read-only
   */
  readonly?: boolean;
  /**
   * Field visibility condition
   */
  visible?: boolean | string;
  /**
   * Span across columns (for grid layout)
   */
  span?: number;
  /**
   * Options for select/lookup fields
   */
  options?: SelectOptionMetadata[];
  /**
   * Referenced object name for lookup/master_detail fields
   */
  reference_to?: string;
  /**
   * Display field on the referenced object for lookup/master_detail fields
   */
  reference_field?: string;
  /**
   * Currency code for currency fields (e.g. 'USD', 'EUR')
   */
  currency?: string;
}

/**
 * Collapsible Section Group — groups multiple DetailViewSections under
 * a single collapsible header.
 */
export interface SectionGroup {
  /**
   * Group title
   */
  title: string;
  /**
   * Group description
   */
  description?: string;
  /**
   * Group icon
   */
  icon?: string;
  /**
   * Whether the group is collapsible
   * @default true
   */
  collapsible?: boolean;
  /**
   * Default collapsed state
   */
  defaultCollapsed?: boolean;
  /**
   * Sections in this group
   */
  sections: DetailViewSection[];
}

/**
 * Header Highlight Field — a key field to display prominently in the header area.
 */
export interface HighlightField {
  /** Field name from the record data */
  name: string;
  /** Display label */
  label: string;
  /** Optional field type for formatting */
  type?: DetailViewField['type'];
  /** Optional icon */
  icon?: string;
  /**
   * Whether the chip is read-only — no inline-edit affordance, ever.
   *
   * Mirrors `DetailViewField.readonly` so the highlights strip and the details
   * body take the same declaration. The strip's editability gate has always
   * read this key; it is declared here so it is a typed part of the surface
   * rather than an `any` cast (objectstack#5077).
   *
   * Use it for columns whose value is owned by the platform rather than the
   * user — hook-maintained rollups, approval-written grades — where marking
   * the OBJECT field `readonly` is not an option because that would also strip
   * the hook's own write-back.
   */
  readonly?: boolean;
}

/**
 * Detail View Section/Group
 */
export interface DetailViewSection {
  /**
   * Stable identifier for i18n key resolution.
   * Used to look up translated section labels via
   * `{ns}.objects.{objectName}._sections.{name}.label`.
   */
  name?: string;
  /**
   * Section title
   */
  title?: string;
  /**
   * Section description
   */
  description?: string;
  /**
   * Section icon
   */
  icon?: string;
  /**
   * Fields in this section
   */
  fields: DetailViewField[];
  /**
   * Collapsible section
   */
  collapsible?: boolean;
  /**
   * Default collapsed state
   */
  defaultCollapsed?: boolean;
  /**
   * Grid columns for field layout
   */
  columns?: number;
  /**
   * Section visibility condition
   */
  visible?: boolean | string;
  /**
   * Show border around section
   * @default true
   */
  showBorder?: boolean;
  /**
   * Header background tint, as one of six design-system tokens.
   *
   * Closed vocabulary — the same six `@object-ui/plugin-detail`'s
   * `HEADER_COLOR_CLASSES` resolves, and the same six `@objectstack/spec`
   * declares on its strict `record:details` section schema (maintainer ruling
   * A, 2026-08-26, objectstack#12126). A value outside them is refused by the
   * `DetailViewSectionSchema` mirror in `./zod/views.zod.ts`, whose `z.enum`
   * is pinned one-to-one against that renderer module.
   *
   * The renderer additionally hands a value that is ALREADY a complete `bg-*`
   * class straight through to the DOM. That pass-through is deliberately NOT
   * declared here: it renders on the same terms as any `className` a schema
   * carries — only if the host app's Tailwind build happens to emit that class
   * — so declaring it would promise a capability the contract cannot keep
   * (the ruling rejected declaring it for exactly that reason).
   *
   * @example 'muted', 'primary/10'
   */
  headerColor?:
    | 'muted'
    | 'muted/50'
    | 'accent'
    | 'primary/10'
    | 'secondary/10'
    | 'destructive/10';
  /*
   * RETIRED — `hideEmpty?: boolean` (objectui#7129, maintainer 2026-09-01).
   *
   * ⛔ Do not re-add it. The key was declared here, REFUSED by
   * `@objectstack/spec` `RecordDetailsProps` (`unrecognized_keys` on the
   * `sections[]` element, measured on 17.2.0), absent from the
   * `DetailViewSectionSchema` mirror in `./zod/views.zod.ts`, and honoured by
   * `RecordDetailsRenderer` — one key, four parties, three different answers,
   * and the only one that let an author write it was this declaration.
   *
   * The ruling converged the four on the spec's answer: emptiness on a
   * `record:details` section is decided by `DetailSection`'s auto-hide
   * heuristic (4 fields / 25% empty; 3 / 20% on mobile) and by the reader's
   * own "Show N empty fields" toggle. That heuristic is now the WHOLE
   * contract, which also dissolves the paradox this key carried: an authored
   * `hideEmpty: false` was tested as `!section.hideEmpty`, so it was
   * indistinguishable from unauthored and overrode nothing.
   *
   * The retirement is pinned four ways at
   * `packages/plugin-detail/src/renderers/__tests__/record-details.hideEmptyRetired-7129.test.tsx`.
   *
   * ⚠️ NOT the same key as `record:reference_rail`'s own `hideEmpty`
   * (`packages/plugin-detail/src/renderers/record-reference-rail.tsx`), which
   * is a different surface and is untouched, nor the `detail.hideEmptyFields`
   * i18n label, which is the toggle's own copy.
   */
}

/**
 * Detail View Tab
 */
export interface DetailViewTab {
  /**
   * Tab key/identifier
   */
  key: string;
  /**
   * Tab label
   */
  label: string;
  /**
   * Tab icon
   */
  icon?: string;
  /**
   * Tab content
   */
  content: SchemaNode | SchemaNode[];
  /**
   * Tab visibility condition
   */
  visible?: boolean | string;
  /**
   * Badge count
   */
  badge?: string | number;
}

/**
 * Comment Entry - represents a single comment on a record
 */
export interface CommentEntry {
  /** Unique identifier */
  id: string | number;
  /** Comment text */
  text: string;
  /** Author display name */
  author: string;
  /** Avatar URL (optional) */
  avatarUrl?: string;
  /** Timestamp when the comment was created */
  createdAt: string;
  /** Whether this comment is pinned/starred */
  pinned?: boolean;
  /** Mentioned user IDs extracted from the comment text */
  mentions?: string[];
  /** Object/record this comment belongs to (for cross-record search) */
  objectName?: string;
  /** Record ID this comment belongs to (for cross-record search) */
  recordId?: string | number;
}

/**
 * Mention notification - delivered when a user is @mentioned in a comment
 */
export interface MentionNotification {
  /** Unique notification ID */
  id: string;
  /** Type of notification */
  type: 'mention';
  /** ID of the user being notified */
  recipientId: string;
  /** The comment that contains the mention */
  commentId: string | number;
  /** Author who mentioned the recipient */
  mentionedBy: string;
  /** The comment text (or excerpt) */
  commentText: string;
  /** Object name the comment belongs to */
  objectName?: string;
  /** Record ID the comment belongs to */
  recordId?: string | number;
  /** When the mention was created */
  createdAt: string;
  /** Whether the notification has been read */
  read?: boolean;
  /** Delivery channels */
  channels?: Array<'in_app' | 'email' | 'push'>;
}

/**
 * Comment search result - returned when searching comments across records
 */
export interface CommentSearchResult {
  /** The matching comment */
  comment: CommentEntry;
  /** Object name the comment belongs to */
  objectName: string;
  /** Record ID the comment belongs to */
  recordId: string | number;
  /** Highlighted text snippet with search term marked */
  highlight?: string;
}

/**
 * Activity Entry - represents a single activity/field change on a record
 */
export interface ActivityEntry {
  /** Unique identifier */
  id: string | number;
  /** Activity type */
  type: 'field_change' | 'create' | 'delete' | 'comment' | 'status_change';
  /** Field that was changed (for field_change type) */
  field?: string;
  /** Previous value */
  oldValue?: any;
  /** New value */
  newValue?: any;
  /** User who made the change */
  user: string;
  /** Timestamp of the change */
  timestamp: string;
  /** Human-readable description of the change */
  description?: string;
}

// ============================================================================
// Feed / Chatter timeline types
//
// Provenance (objectui#4597): `@objectstack/spec/data` exported `FeedItemSchema`,
// `MentionSchema`, `ReactionSchema`, `FieldChangeEntrySchema` and
// `RecordSubscriptionSchema` through 15.1.1. The 16.0.0 major removed the whole
// feed surface, directing consumers to the data API over `sys_comment` /
// `sys_activity` — reactions and threaded replies are fields on `sys_comment`.
// `FeedItemType` and `FeedFilterMode` were deliberately KEPT as live activity-
// timeline config, which is why the import below still resolves.
//
// So the interfaces in this section are shapes this package owns: the protocol
// no longer models them, and there is nothing upstream left to derive from.
// ============================================================================

/**
 * Feed item type — determines rendering style in the activity timeline.
 * Re-exported from `@objectstack/spec/data` rather than restated
 * (objectstack#4115).
 *
 * The hand-written union this replaces carried 7 of the spec's 13 members —
 * `file`, `sharing`, `note`, `record_create`, `record_delete` and `approval`
 * were all missing, so a server emitting any of them produced a feed item the
 * timeline could not type, let alone render.
 */
import type { FeedItemType } from '@objectstack/spec/data';
export type { FeedItemType };

/**
 * FeedItem — A single item in the unified activity feed.
 *
 * Local shape; its cited `FeedItemSchema` went with the 16.0.0 feed removal
 * (see the section banner). Only `type` is still protocol-bound, through the
 * `FeedItemType` import above.
 */
export interface FeedItem {
  /** Unique identifier */
  id: string | number;
  /** Feed item type */
  type: FeedItemType;
  /** Actor / author display name */
  actor: string;
  /** Actor avatar URL */
  actorAvatarUrl?: string;
  /** Main body / text content (may contain Markdown) */
  body?: string;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last update timestamp (ISO 8601) */
  updatedAt?: string;
  /** Source of the feed item (e.g., 'manual', 'api', 'automation') */
  source?: string;
  /** Parent feed item ID (for threading) */
  parentId?: string | number;
  /** Number of replies (if this is a root comment) */
  replyCount?: number;
  /** Field change entries (for field_change type) */
  fieldChanges?: FieldChangeEntry[];
  /** Mentions within this feed item */
  mentions?: Mention[];
  /** Reactions on this feed item */
  reactions?: Reaction[];
  /** Whether this item is pinned */
  pinned?: boolean;
  /** Whether this item has been edited */
  edited?: boolean;
  /**
   * Source rich-entity pointer (ADR-0052 ActivityPointer). When the activity
   * was derived from a separate record — an email in `sys_email`, a call/meeting
   * task — these identify it so the timeline can drill from the one-line summary
   * to the full record. Distinct from `source` (the origin channel).
   */
  sourceObject?: string;
  sourceId?: string | number;
}

/**
 * FieldChangeEntry — A single field change within a feed item.
 *
 * Local shape; its cited `FieldChangeEntrySchema` went with the 16.0.0 feed
 * removal (see the section banner). The pinned protocol's nearest surviving
 * shape is `FieldChangeSchema` in `@objectstack/spec/kernel`, but that is a
 * different thing — change tracking keyed `path` / `originalValue` /
 * `currentValue` / `changedBy` / `changedAt`, with none of the display keys a
 * timeline row needs. Do not re-point this at it.
 */
export interface FieldChangeEntry {
  /** Field API name */
  field: string;
  /** Field display label */
  fieldLabel?: string;
  /** Previous raw value */
  oldValue?: unknown;
  /** New raw value */
  newValue?: unknown;
  /** Previous human-readable display value */
  oldDisplayValue?: string;
  /** New human-readable display value */
  newDisplayValue?: string;
}

/**
 * Mention — An @mention within a feed item.
 *
 * Local shape; its cited `MentionSchema` went with the 16.0.0 feed removal (see
 * the section banner), and no shape of this meaning survives under any other
 * name in the pinned protocol.
 */
export interface Mention {
  /** Mention target type */
  type: 'user' | 'team' | 'group';
  /** Mentioned entity ID */
  id: string;
  /** Display name */
  name: string;
  /** Offset in the body text */
  offset?: number;
  /** Length of the mention text */
  length?: number;
}

/**
 * Reaction — An emoji reaction on a feed item.
 *
 * Local shape; its cited `ReactionSchema` went with the 16.0.0 feed removal
 * (see the section banner). Reactions are now persisted as fields on
 * `sys_comment` rather than modelled as their own protocol shape.
 */
export interface Reaction {
  /** Emoji identifier (e.g. '👍', '❤️', '🎉') */
  emoji: string;
  /** Number of users who reacted with this emoji */
  count: number;
  /** Whether the current user reacted with this emoji */
  reacted?: boolean;
  /** IDs of users who reacted */
  userIds?: string[];
}

/**
 * RecordSubscription — Notification subscription state for a record.
 *
 * Local shape; its cited `RecordSubscriptionSchema` went with the 16.0.0 feed
 * removal (see the section banner). The `Subscription` shapes the pinned
 * protocol still exports are unrelated — realtime transport channels, event
 * subscriptions and app billing — so none of them is a replacement.
 */
export interface RecordSubscription {
  /** Record ID */
  recordId: string | number;
  /** Whether the current user is subscribed */
  subscribed: boolean;
  /** Notification channels */
  channels?: Array<'in_app' | 'email' | 'push'>;
}

/**
 * Detail View Schema - Display detailed information about a single record
 * Enhanced in Phase 2 with better organization and features
 */
export interface DetailViewSchema extends BaseSchema {
  type: 'detail-view';
  /**
   * Detail title
   */
  title?: string;
  /**
   * API endpoint to fetch detail data
   */
  api?: string;
  /**
   * Resource ID to display
   */
  resourceId?: string | number;
  /**
   * Object name (for ObjectQL integration)
   */
  objectName?: string;
  /**
   * Data to display (if not fetching from API)
   */
  data?: any;
  /**
   * Primary field name whose value is displayed as the record title in the header.
   * Falls back to `title` when not set or when the field value is empty.
   */
  primaryField?: string;
  /**
   * Field names whose values are rendered as summary Badges next to the header title.
   */
  summaryFields?: string[];
  /**
   * Layout mode
   */
  layout?: 'vertical' | 'horizontal' | 'grid';
  /**
   * Grid columns (for grid layout)
   */
  columns?: number;
  /**
   * Field sections for organized display
   */
  sections?: DetailViewSection[];
  /**
   * Direct fields (without sections)
   */
  fields?: DetailViewField[];
  /**
   * Actions available in detail view
   */
  actions?: ActionSchema[];
  /**
   * Tabs for additional content
   */
  tabs?: DetailViewTab[];
  /**
   * Show back button
   * @default true
   */
  showBack?: boolean;
  /**
   * Back button URL
   */
  backUrl?: string;
  /**
   * Custom back action — RUNTIME SLOT (objectui#7344, the objectui#6124 shape):
   * a host-supplied function, NOT authorable metadata. `detail-view` spreads the
   * node's keys onto `DetailView`, whose `handleBack` CALLS `onBack()` when it is
   * set, so this declares the callable the renderer invokes. It used to declare
   * the handler-expression STRING, which objectui#6182 ruled is not an authoring
   * form and which threw `onBack is not a function` at click. The zod twin
   * refuses the key by name; supply it from a React host
   * (`<SchemaRenderer … onBack={fn} />`).
   */
  onBack?: () => void;
  /**
   * Show edit button
   */
  showEdit?: boolean;
  /**
   * Edit button URL
   */
  editUrl?: string;
  /**
   * Show delete button
   */
  showDelete?: boolean;
  /**
   * Delete confirmation message
   */
  deleteConfirmation?: string;
  /**
   * Force the loading skeleton.
   *
   * The same single reader as `DetailSchema.loading`, reached by a different
   * registration: `register('detail-view', DetailViewRenderer)`
   * (`plugin-detail/src/index.tsx:284`) is a data-source gate whose child is
   * `<DetailView schema={bound as DetailViewSchema} ...>`, so both node types
   * land on `DetailView.tsx:995` -- `if (loading || schema.loading)`, a bare
   * disjunct beside the component's own fetch state (`:269`). An omitted key is
   * `undefined` and contributes nothing to that gate, so the value applied on
   * absence is `false`. The tag published `true` from the 2026-07-13 bulk JSDoc
   * pass that copied the zod mirror's old `.default(true)` until objectui#8318
   * corrected it; the two declarations must keep agreeing, because one
   * component consumes both.
   * @default false
   */
  loading?: boolean;
  /**
   * Custom header content
   */
  header?: SchemaNode;
  /**
   * Custom footer content
   */
  footer?: SchemaNode;
  /**
   * Navigation handler for SPA-aware routing.
   * Called instead of window.location.href for back/edit navigation.
   * @param url - The URL to navigate to
   * @param options - Navigation options (replace, newTab, etc.)
   */
  onNavigate?: (url: string, options?: { replace?: boolean; newTab?: boolean }) => void;
  /**
   * RETIRED (objectui#7997, ADR-0049 enforce-or-remove; maintainer ruling
   * 2026-09-10, quoted verbatim and untranslated because a paraphrase is a
   * different ruling: 「关掉详情页那个入口（推荐）」 — "close that entry point on
   * the detail page (recommended)").
   *
   * This was objectui's own second entry to a capability the protocol already
   * governs. `@objectstack/spec` declares NO `DetailView` schema at all — every
   * `DetailView` occurrence in `packages/spec/src` is prose about this repo's
   * own `RecordDetailView.tsx` — so this array mirrored nothing and drifted
   * freely: it declared `columns` as `TableColumn[]` while the renderer it fed
   * also accepted bare field names, `{ field, label }` and the legacy
   * `{ name, label }` spellings.
   *
   * ⛔ Do NOT read the retirement as "related lists are gone". The capability
   * moves to its one DECLARED, protocol-governed entry — `record:related_list`
   * (`RecordRelatedListComponentProps`, mirroring `@objectstack/spec`
   * `RecordRelatedListProps`), whose `columns` is an array of FIELD-NAME
   * strings. Both entries always rendered through the same `RelatedList`
   * component, so nothing about the rendered result is lost — only the second
   * door.
   *
   * What was measured, and what carried the ruling: ZERO pull. No application
   * code authored this member; both internal producers of a `detail-view` node
   * (`RecordDetailDrawer`, `renderers/record-details.tsx`) pass no `related`;
   * the only in-tree authorings carrying real columns were two documents, both
   * rewritten by the same change.
   *
   * `?: never` is the twin of `zod/views.zod.ts`'s `retirementTombstone` arm,
   * and the pair is deliberate: a BARE DELETE would not refuse this key, it
   * would KEEP it. `BaseSchema` closes with an any-valued index signature and
   * `BaseSchemaCore` ends `.passthrough()`, so an undeclared member is passed
   * through silently — the mechanism objectui#7963 measured. Declared-and-
   * unwritable is what makes the refusal loud.
   *
   * @deprecated Not part of this contract. Author a `record:related_list` block.
   */
  related?: never;
  /**
   * Optional audit history feed for this record. When provided, a "History" tab
   * is rendered alongside Details/Related. The renderer treats the data as
   * read-only and never offers edit/delete affordances.
   *
   * Producers are expected to fetch only safe columns (e.g. created_at, action,
   * user_id, user name) and respect field-level permissions before populating
   * `entries`.
   */
  history?: {
    /** Pre-fetched audit-log entries, newest first. */
    entries: Array<{
      id?: string | number;
      created_at?: string | number | Date;
      action?: string;
      user_id?: string | number | null;
      user_name?: string | null;
      summary?: string | null;
      [extra: string]: unknown;
    }>;
    /** Renderer shows a skeleton when true. */
    loading?: boolean;
    /** Override the default empty-state copy. */
    emptyText?: string;
  };
  /**
   * When true, auto-discover related lists from objectSchema reference fields
   * (lookup, master_detail) when no explicit `related` is provided.
   * Requires a DataSource with getObjectSchema.
   * @default false
   */
  autoDiscoverRelated?: boolean;
  /**
   * When true, automatically generate Details/Related/Activity tabs
   * when no explicit `tabs` are configured. Sections go into the Details tab,
   * related lists go into the Related tab, and activities go into the Activity tab.
   * @default false
   */
  autoTabs?: boolean;
  /**
   * Initial active tab for `autoTabs` (`details` | `related` | `activity` |
   * `discussion` | `history`) — typically restored from the host's `?tab=`
   * URL param (objectui#2257). Ignored when it names a tab that doesn't
   * render.
   */
  defaultTab?: string;
  /** Called on every tab switch; the host persists it (e.g. writes `?tab=`). */
  onTabChange?: (value: string) => void;
  /**
   * Section groups — groups of sections rendered under a collapsible header.
   */
  sectionGroups?: SectionGroup[];
  /**
   * Key fields to display prominently in a highlight banner below the header.
   */
  highlightFields?: HighlightField[];
  /**
   * Record navigation configuration for prev/next navigation.
   * Allows navigating through a result set from within the detail view.
   */
  recordNavigation?: {
    /** All record IDs in the current view's result set */
    recordIds: Array<string | number>;
    /** Current record's index in the result set (0-based) */
    currentIndex: number;
    /** Callback to navigate to a specific record by ID */
    onNavigate: (recordId: string | number) => void;
  };
  /**
   * Comments associated with this record
   */
  comments?: CommentEntry[];
  /**
   * Callback to add a new comment
   */
  onAddComment?: (text: string) => void | Promise<void>;
  /**
   * Activity history entries for this record
   */
  activities?: ActivityEntry[];
}

/**
 * View Switcher Schema - Toggle between different view modes
 * New in Phase 2
 */
export interface ViewSwitcherSchema extends BaseSchema {
  type: 'view-switcher';
  /**
   * Available view types
   */
  views: Array<{
    /**
     * View type
     */
    type: ViewType;
    /**
     * View label
     */
    label?: string;
    /**
     * View icon
     */
    icon?: string;
    /**
     * View schema
     */
    schema?: SchemaNode;
  }>;
  /**
   * Default/active view
   */
  defaultView?: ViewType;
  /**
   * Current active view
   */
  activeView?: ViewType;
  /**
   * Switcher variant
   */
  variant?: 'tabs' | 'buttons' | 'dropdown';
  /**
   * Switcher position
   */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /**
   * Event name dispatched on `window` when the view changes
   * (`detail: { view }`) — an event NAME, not a callback or a handler
   * expression. Read at `plugin-view/src/ViewSwitcher.tsx` as
   * `new CustomEvent(schema.onViewChange, …)` (objectui#6124).
   */
  onViewChange?: string;
  /**
   * Persist view preference
   */
  persistPreference?: boolean;
  /**
   * Storage key for persisting view
   */
  storageKey?: string;
  /**
   * Show "+" button to add/create a new view
   */
  allowCreateView?: boolean;
  /**
   * Per-view action icons (e.g., share, settings, duplicate, delete)
   */
  viewActions?: Array<{
    type: 'share' | 'settings' | 'duplicate' | 'delete';
    icon?: string;
  }>;
  /**
   * REFUSED BY NAME (objectui#9256, ADR-0049) — `view-switcher` reads NEITHER
   * content channel: no renderer read consumes `body` or `children` for this
   * node.
   *
   * MEASURED with the TypeScript TYPE CHECKER and not with grep, across all 24
   * packages that register components plus the generic traversers — a docblock
   * mention is not a read, and `body: schema.requestBody` in
   * `packages/plugin-chatbot/src/renderer.tsx` is the kind of prefix hit grep
   * scores. Every read is filed under the TYPE of the object it is read from;
   * this declaration carries none. What the renderer DOES read off this node:
   * `activeView`, `allowCreateView`, `defaultView`, `id`, `onViewChange`,
   * `persistPreference`, `position`, `storageKey`, `variant`, `viewActions`,
   * `views` (in `packages/plugin-view/src/ViewSwitcher.tsx`).
   *
   * `body` and `children` are inherited-and-optional from {@link BaseSchema},
   * whose own docblock admits "some components use `children` instead of
   * `body`" without saying which — so authoring either here type-checked,
   * parsed green through `.passthrough()`, and rendered NOTHING: no error, no
   * warning, no element. `SchemaRenderer` strips both keys out of the props bag
   * it spreads, so neither reaches the component by another route either.
   *
   * @deprecated Not a channel `view-switcher` reads — nothing renders it.
   */
  body?: never;
  /**
   * REFUSED BY NAME (objectui#9256, ADR-0049) — `view-switcher` reads NEITHER
   * content channel: no renderer read consumes `body` or `children` for this
   * node.
   *
   * MEASURED with the TypeScript TYPE CHECKER and not with grep, across all 24
   * packages that register components plus the generic traversers — a docblock
   * mention is not a read, and `body: schema.requestBody` in
   * `packages/plugin-chatbot/src/renderer.tsx` is the kind of prefix hit grep
   * scores. Every read is filed under the TYPE of the object it is read from;
   * this declaration carries none. What the renderer DOES read off this node:
   * `activeView`, `allowCreateView`, `defaultView`, `id`, `onViewChange`,
   * `persistPreference`, `position`, `storageKey`, `variant`, `viewActions`,
   * `views` (in `packages/plugin-view/src/ViewSwitcher.tsx`).
   *
   * `body` and `children` are inherited-and-optional from {@link BaseSchema},
   * whose own docblock admits "some components use `children` instead of
   * `body`" without saying which — so authoring either here type-checked,
   * parsed green through `.passthrough()`, and rendered NOTHING: no error, no
   * warning, no element. `SchemaRenderer` strips both keys out of the props bag
   * it spreads, so neither reaches the component by another route either.
   *
   * @deprecated Not a channel `view-switcher` reads — nothing renders it.
   */
  children?: never;
}

/**
 * Filter UI Schema - Enhanced filter interface
 * New in Phase 2
 */
export interface FilterUISchema extends BaseSchema {
  type: 'filter-ui';
  /**
   * Available filters
   */
  filters: Array<{
    /**
     * Filter field
     */
    field: string;
    /**
     * Filter label
     */
    label?: string;
    /**
     * Filter type
     */
    type: 'text' | 'number' | 'select' | 'multi-select' | 'date' | 'date-range' | 'boolean';
    /**
     * Filter operator
     */
    operator?: 'equals' | 'contains' | 'startsWith' | 'gt' | 'lt' | 'between' | 'in';
    /**
     * Options for select filter
     */
    options?: Array<{ label: string; value: any }>;
    /**
     * Placeholder
     */
    placeholder?: string;
  }>;
  /**
   * Current filter values
   */
  values?: Record<string, any>;
  /**
   * Event name dispatched on `window` when the filters change
   * (`detail: { values }`) — an event NAME, not a callback or a handler
   * expression. Read at `plugin-view/src/FilterUI.tsx` as
   * `new CustomEvent(schema.onChange, …)` (objectui#6124).
   */
  onChange?: string;
  /**
   * Show clear button
   */
  showClear?: boolean;
  /**
   * Show apply button
   */
  showApply?: boolean;
  /**
   * Filter layout
   */
  layout?: 'inline' | 'popover' | 'drawer';
  /**
   * REFUSED BY NAME (objectui#9256, ADR-0049) — `filter-ui` reads NEITHER
   * content channel: no renderer read consumes `body` or `children` for this
   * node.
   *
   * MEASURED with the TypeScript TYPE CHECKER and not with grep, across all 24
   * packages that register components plus the generic traversers — a docblock
   * mention is not a read, and `body: schema.requestBody` in
   * `packages/plugin-chatbot/src/renderer.tsx` is the kind of prefix hit grep
   * scores. Every read is filed under the TYPE of the object it is read from;
   * this declaration carries none. What the renderer DOES read off this node:
   * `filters`, `layout`, `onChange`, `showApply`, `showClear`, `values` (in
   * `packages/plugin-view/src/FilterUI.tsx`).
   *
   * `body` and `children` are inherited-and-optional from {@link BaseSchema},
   * whose own docblock admits "some components use `children` instead of
   * `body`" without saying which — so authoring either here type-checked,
   * parsed green through `.passthrough()`, and rendered NOTHING: no error, no
   * warning, no element. `SchemaRenderer` strips both keys out of the props bag
   * it spreads, so neither reaches the component by another route either.
   *
   * @deprecated Not a channel `filter-ui` reads — nothing renders it.
   */
  body?: never;
  /**
   * REFUSED BY NAME (objectui#9256, ADR-0049) — `filter-ui` reads NEITHER
   * content channel: no renderer read consumes `body` or `children` for this
   * node.
   *
   * MEASURED with the TypeScript TYPE CHECKER and not with grep, across all 24
   * packages that register components plus the generic traversers — a docblock
   * mention is not a read, and `body: schema.requestBody` in
   * `packages/plugin-chatbot/src/renderer.tsx` is the kind of prefix hit grep
   * scores. Every read is filed under the TYPE of the object it is read from;
   * this declaration carries none. What the renderer DOES read off this node:
   * `filters`, `layout`, `onChange`, `showApply`, `showClear`, `values` (in
   * `packages/plugin-view/src/FilterUI.tsx`).
   *
   * `body` and `children` are inherited-and-optional from {@link BaseSchema},
   * whose own docblock admits "some components use `children` instead of
   * `body`" without saying which — so authoring either here type-checked,
   * parsed green through `.passthrough()`, and rendered NOTHING: no error, no
   * warning, no element. `SchemaRenderer` strips both keys out of the props bag
   * it spreads, so neither reaches the component by another route either.
   *
   * @deprecated Not a channel `filter-ui` reads — nothing renders it.
   */
  children?: never;
}

/**
 * Sort UI Schema - Enhanced sort interface
 * New in Phase 2
 */
export interface SortUISchema extends BaseSchema {
  type: 'sort-ui';
  /**
   * Sortable fields
   */
  fields: Array<{
    /**
     * Field name
     */
    field: string;
    /**
     * Field label
     */
    label?: string;
  }>;
  /**
   * Current sort configuration
   */
  sort?: Array<{
    /**
     * Field to sort by
     */
    field: string;
    /**
     * Sort direction
     */
    direction: 'asc' | 'desc';
  }>;
  /**
   * Event name dispatched on `window` when the sort changes
   * (`detail: { sort }`) — an event NAME, not a callback or a handler
   * expression. Read at `plugin-view/src/SortUI.tsx` as
   * `new CustomEvent(schema.onChange, …)` (objectui#6124).
   */
  onChange?: string;
  /**
   * Allow multiple sort fields
   */
  multiple?: boolean;
  /**
   * UI variant
   */
  variant?: 'dropdown' | 'buttons';
  /**
   * REFUSED BY NAME (objectui#9256, ADR-0049) — `sort-ui` reads NEITHER content
   * channel: no renderer read consumes `body` or `children` for this node.
   *
   * MEASURED with the TypeScript TYPE CHECKER and not with grep, across all 24
   * packages that register components plus the generic traversers — a docblock
   * mention is not a read, and `body: schema.requestBody` in
   * `packages/plugin-chatbot/src/renderer.tsx` is the kind of prefix hit grep
   * scores. Every read is filed under the TYPE of the object it is read from;
   * this declaration carries none. What the renderer DOES read off this node:
   * `fields`, `multiple`, `onChange`, `sort`, `variant` (in
   * `packages/plugin-view/src/SortUI.tsx`).
   *
   * `body` and `children` are inherited-and-optional from {@link BaseSchema},
   * whose own docblock admits "some components use `children` instead of
   * `body`" without saying which — so authoring either here type-checked,
   * parsed green through `.passthrough()`, and rendered NOTHING: no error, no
   * warning, no element. `SchemaRenderer` strips both keys out of the props bag
   * it spreads, so neither reaches the component by another route either.
   *
   * @deprecated Not a channel `sort-ui` reads — nothing renders it.
   */
  body?: never;
  /**
   * REFUSED BY NAME (objectui#9256, ADR-0049) — `sort-ui` reads NEITHER content
   * channel: no renderer read consumes `body` or `children` for this node.
   *
   * MEASURED with the TypeScript TYPE CHECKER and not with grep, across all 24
   * packages that register components plus the generic traversers — a docblock
   * mention is not a read, and `body: schema.requestBody` in
   * `packages/plugin-chatbot/src/renderer.tsx` is the kind of prefix hit grep
   * scores. Every read is filed under the TYPE of the object it is read from;
   * this declaration carries none. What the renderer DOES read off this node:
   * `fields`, `multiple`, `onChange`, `sort`, `variant` (in
   * `packages/plugin-view/src/SortUI.tsx`).
   *
   * `body` and `children` are inherited-and-optional from {@link BaseSchema},
   * whose own docblock admits "some components use `children` instead of
   * `body`" without saying which — so authoring either here type-checked,
   * parsed green through `.passthrough()`, and rendered NOTHING: no error, no
   * warning, no element. `SchemaRenderer` strips both keys out of the props bag
   * it spreads, so neither reaches the component by another route either.
   *
   * @deprecated Not a channel `sort-ui` reads — nothing renders it.
   */
  children?: never;
}

/**
 * Union type of all view schemas
 */
export type ViewComponentSchema =
  | DetailViewSchema
  | ViewSwitcherSchema
  | FilterUISchema
  | SortUISchema;
