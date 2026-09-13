/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#9256 — FAMILY D of the measured table: the components whose renderer
 * reads NEITHER content channel. Both `body` and `children` are tombstoned on
 * both published faces, in the shape PR objectui#9254 established for families
 * A and B (maintainer ruling, summon #17 decision batch #2, 2026-09-07,
 * verbatim 「同意」: every component schema narrows to the channel its renderer
 * actually reads and tombstones the other).
 *
 * ## Why a NEITHER verdict needed a bigger instrument than families A+B did
 *
 * objectui#9254 measured `packages/components` only. A verdict of ABSENCE is
 * not sound over a subset: any of the other 23 registering packages, or a
 * generic traverser that is not a component at all, could have been the reader.
 * The sweep behind this file runs the same TypeScript type-checker instrument
 * over 46 programs — every workspace package plus the apps and examples, 1,604
 * source files — and files every `body` / `children` read under the TYPE of the
 * object it is read from. The extended table is objectui#9256 comment
 * 5644340762; the numbers moved (77 family-D registrations, not the card's ~60,
 * and 20 of them outside `packages/components`).
 *
 * Two readers decide a NEITHER verdict and neither is a component:
 *
 *   - `SchemaRenderer` (`packages/react`) destructures `children` and `body`
 *     OUT of the props bag it spreads, so the channels cannot reach a renderer
 *     by any route except that renderer reading `schema.body` / `schema.children`
 *     itself. That is what makes "reads neither" mean "renders nothing".
 *   - `validateSchema` (`packages/core`) reads `schema.children` else
 *     `schema.body` for EVERY node, but only to RECURSE into authored content
 *     and validate it. It renders nothing, so it does not make a channel live.
 *
 * ## What is held OUT of this file, and why — each is a measurement, not appetite
 *
 *   - the nine `type` names carrying 2+ registrations with different
 *     declarations (`accordion`, `tabs`, `text`, `image`, `icon`, `list`,
 *     `calendar`, `timeline`, and the `UIActionSchema` arm of `button`):
 *     `ComponentRegistry.register` writes a bare-name fallback LAST-ONE-WINS, so
 *     which declaration governs an authored node depends on import order.
 *   - `InputSchema`: `InputShorthandSchema` is declared as an `Omit` of it, so a
 *     tombstone here would propagate onto the `email` / `password` shorthand
 *     face, whose registrations are `any`-typed — family E, frozen.
 *   - `AppComponentSchema`: it declares the `app` type literal, and `app` is
 *     served by `PageNodeSchema`, which reads BOTH channels — family C, with the
 *     maintainer.
 *   - `DetailViewSchema`: its own literal is `detail-view`, and that name is
 *     registered with an `any`-typed renderer whose reads are unattributable.
 *   - the `body` channel of the three chatbot faces: the parity ledger already
 *     records that key as "two different meanings of one key — a naming
 *     collision to rule on". Their `children` channel is narrowed here, and the
 *     LIVE CONTROL below proves `body` still parses there.
 *
 * ## ⚠️ Half of this file is a COMPILE-TIME assertion and vitest CANNOT read it
 *
 * `?: never` narrowings are erased before a test runs. The `@ts-expect-error`
 * lines in the last block are read by `tsc -p tsconfig.test.json` (the
 * `type-check` script), NOT by this runner: under vitest alone, deleting a
 * tombstone from the TypeScript face leaves every case here GREEN. Both readers
 * are the gate; either one alone reports NOT MEASURED.
 */

import { describe, it, expect } from 'vitest';
import type { z } from 'zod';
import {
  SeparatorSchema as SeparatorMirror,
  ResizableSchema as ResizableMirror,
} from '../zod/layout.zod';
import {
  HtmlSchema as HtmlMirror,
  AvatarSchema as AvatarMirror,
  TreeViewSchema as TreeViewMirror,
  StatisticSchema as StatisticMirror,
  KbdSchema as KbdMirror,
  TableSchema as TableMirror,
  DataTableSchema as DataTableMirror,
} from '../zod/data-display.zod';
import {
  ButtonGroupSchema as ButtonGroupMirror,
  PaginationSchema as PaginationMirror,
  NavigationMenuSchema as NavigationMenuMirror,
  HeaderBarSchema as HeaderBarMirror,
  BreadcrumbSchema as BreadcrumbMirror,
} from '../zod/navigation.zod';
import {
  LabelSchema as LabelMirror,
  TextareaSchema as TextareaMirror,
  CheckboxSchema as CheckboxMirror,
  SwitchSchema as SwitchMirror,
  SelectSchema as SelectMirror,
  RadioGroupSchema as RadioGroupMirror,
  SliderSchema as SliderMirror,
  InputOTPSchema as InputOTPMirror,
  DatePickerSchema as DatePickerMirror,
  FileUploadSchema as FileUploadMirror,
  ComboboxSchema as ComboboxMirror,
  CommandSchema as CommandMirror,
} from '../zod/form.zod';
import {
  ProgressSchema as ProgressMirror,
  SkeletonSchema as SkeletonMirror,
  ToasterSchema as ToasterMirror,
  LoadingSchema as LoadingMirror,
  ToastSchema as ToastMirror,
  SpinnerSchema as SpinnerMirror,
  EmptySchema as EmptyMirror,
  SonnerSchema as SonnerMirror,
} from '../zod/feedback.zod';
import {
  DialogSchema as DialogMirror,
  SheetSchema as SheetMirror,
  PopoverSchema as PopoverMirror,
  AlertDialogSchema as AlertDialogMirror,
  DrawerSchema as DrawerMirror,
  HoverCardSchema as HoverCardMirror,
  DropdownMenuSchema as DropdownMenuMirror,
  ContextMenuSchema as ContextMenuMirror,
  MenubarSchema as MenubarMirror,
} from '../zod/overlay.zod';
import {
  CollapsibleSchema as CollapsibleMirror,
  ToggleGroupSchema as ToggleGroupMirror,
} from '../zod/disclosure.zod';
import {
  CarouselSchema as CarouselMirror,
  FilterBuilderSchema as FilterBuilderMirror,
  CalendarViewSchema as CalendarViewMirror,
  ChatbotSchema as ChatbotMirror,
  ChatbotEnhancedSchema as ChatbotEnhancedMirror,
  ChatbotFloatingSchema as ChatbotFloatingMirror,
  DashboardComponentSchema as DashboardComponentMirror,
} from '../zod/complex.zod';
import {
  ObjectDataTableSchema as ObjectDataTableMirror,
  ObjectGallerySchema as ObjectGalleryMirror,
} from '../zod/objectql.zod';
import {
  ReportViewerSchema as ReportViewerMirror,
} from '../zod/reports.zod';
import {
  ViewSwitcherSchema as ViewSwitcherMirror,
  FilterUISchema as FilterUIMirror,
  SortUISchema as SortUIMirror,
} from '../zod/views.zod';
import { ChatbotSchema as ChatbotBodyControl } from '../zod/complex.zod';
import { AnyComponentSchema } from '../zod/index.zod';
import type { CollapsibleSchema } from '../disclosure';
import type { DialogSchema } from '../overlay';
import type { SeparatorSchema } from '../layout';
import type { CheckboxSchema } from '../form';
import type { KbdSchema, PivotTableSchema } from '../data-display';
import type { SkeletonSchema } from '../feedback';
import type { PaginationSchema } from '../navigation';
import type { ObjectGallerySchema } from '../objectql';
import type { CarouselSchema, ChatbotSchema } from '../complex';
import type { ReportViewerSchema } from '../reports';
import type { ViewSwitcherSchema } from '../views';
import type { NLQuerySchema } from '../ai';

type Mirror = {
  safeParse: (v: unknown) => { success: boolean; error?: z.ZodError };
  shape: Record<string, { description?: string } | undefined>;
};

/**
 * One row of family D: the registered `type`, its mirror, the channels
 * tombstoned on it, and the node's OTHER required members — `table` requires
 * `columns` and `data`, so a bare `{ type: 'table' }` is refused for a reason
 * that has nothing to do with this change and would read here as a false
 * positive. Both channels are dead on every row except the three chatbot faces,
 * whose `body` is held out (see the header).
 */
const ROWS: ReadonlyArray<readonly [
  type: string, mirror: Mirror, dead: ReadonlyArray<'body' | 'children'>, required: Record<string, unknown>,
]> = [
  ['separator', SeparatorMirror as unknown as Mirror, ['body', 'children'], {}],
  ['html', HtmlMirror as unknown as Mirror, ['body', 'children'], {"html":"x"}],
  ['button-group', ButtonGroupMirror as unknown as Mirror, ['body', 'children'], {}],
  ['pagination', PaginationMirror as unknown as Mirror, ['body', 'children'], {"totalPages":1}],
  ['navigation-menu', NavigationMenuMirror as unknown as Mirror, ['body', 'children'], {}],
  ['label', LabelMirror as unknown as Mirror, ['body', 'children'], {}],
  ['textarea', TextareaMirror as unknown as Mirror, ['body', 'children'], {}],
  ['checkbox', CheckboxMirror as unknown as Mirror, ['body', 'children'], {}],
  ['switch', SwitchMirror as unknown as Mirror, ['body', 'children'], {}],
  ['select', SelectMirror as unknown as Mirror, ['body', 'children'], {"options":[]}],
  ['radio-group', RadioGroupMirror as unknown as Mirror, ['body', 'children'], {"options":[]}],
  ['slider', SliderMirror as unknown as Mirror, ['body', 'children'], {}],
  ['input-otp', InputOTPMirror as unknown as Mirror, ['body', 'children'], {}],
  ['date-picker', DatePickerMirror as unknown as Mirror, ['body', 'children'], {}],
  ['file-upload', FileUploadMirror as unknown as Mirror, ['body', 'children'], {}],
  ['combobox', ComboboxMirror as unknown as Mirror, ['body', 'children'], {"options":[]}],
  ['command', CommandMirror as unknown as Mirror, ['body', 'children'], {"groups":[]}],
  ['header-bar', HeaderBarMirror as unknown as Mirror, ['body', 'children'], {}],
  ['avatar', AvatarMirror as unknown as Mirror, ['body', 'children'], {}],
  ['tree-view', TreeViewMirror as unknown as Mirror, ['body', 'children'], {}],
  ['statistic', StatisticMirror as unknown as Mirror, ['body', 'children'], {"value":1}],
  ['breadcrumb', BreadcrumbMirror as unknown as Mirror, ['body', 'children'], {"items":[]}],
  ['kbd', KbdMirror as unknown as Mirror, ['body', 'children'], {}],
  ['progress', ProgressMirror as unknown as Mirror, ['body', 'children'], {}],
  ['skeleton', SkeletonMirror as unknown as Mirror, ['body', 'children'], {}],
  ['toaster', ToasterMirror as unknown as Mirror, ['body', 'children'], {}],
  ['loading', LoadingMirror as unknown as Mirror, ['body', 'children'], {}],
  ['toast', ToastMirror as unknown as Mirror, ['body', 'children'], {}],
  ['spinner', SpinnerMirror as unknown as Mirror, ['body', 'children'], {}],
  ['empty', EmptyMirror as unknown as Mirror, ['body', 'children'], {}],
  ['sonner', SonnerMirror as unknown as Mirror, ['body', 'children'], {}],
  ['dialog', DialogMirror as unknown as Mirror, ['body', 'children'], {}],
  ['sheet', SheetMirror as unknown as Mirror, ['body', 'children'], {}],
  ['popover', PopoverMirror as unknown as Mirror, ['body', 'children'], {"content":{"type":"text"},"trigger":{"type":"button"}}],
  ['alert-dialog', AlertDialogMirror as unknown as Mirror, ['body', 'children'], {}],
  ['drawer', DrawerMirror as unknown as Mirror, ['body', 'children'], {}],
  ['hover-card', HoverCardMirror as unknown as Mirror, ['body', 'children'], {"content":{"type":"text"},"trigger":{"type":"button"}}],
  ['dropdown-menu', DropdownMenuMirror as unknown as Mirror, ['body', 'children'], {"items":[],"trigger":{"type":"button"}}],
  ['context-menu', ContextMenuMirror as unknown as Mirror, ['body', 'children'], {"items":[]}],
  ['menubar', MenubarMirror as unknown as Mirror, ['body', 'children'], {}],
  ['collapsible', CollapsibleMirror as unknown as Mirror, ['body', 'children'], {"trigger":{"type":"button"},"content":{"type":"text"}}],
  ['toggle-group', ToggleGroupMirror as unknown as Mirror, ['body', 'children'], {}],
  ['carousel', CarouselMirror as unknown as Mirror, ['body', 'children'], {"items":[]}],
  ['filter-builder', FilterBuilderMirror as unknown as Mirror, ['body', 'children'], {"fields":[]}],
  ['resizable', ResizableMirror as unknown as Mirror, ['body', 'children'], {"panels":[]}],
  ['table', TableMirror as unknown as Mirror, ['body', 'children'], {"data":[],"columns":[]}],
  ['data-table', DataTableMirror as unknown as Mirror, ['body', 'children'], {"data":[],"columns":[]}],
  ['calendar-view', CalendarViewMirror as unknown as Mirror, ['body', 'children'], {}],
  ['chatbot', ChatbotMirror as unknown as Mirror, ['children'], {"messages":[]}],
  ['chatbot-enhanced', ChatbotEnhancedMirror as unknown as Mirror, ['children'], {"messages":[]}],
  ['chatbot-floating', ChatbotFloatingMirror as unknown as Mirror, ['children'], {"messages":[]}],
  ['dashboard', DashboardComponentMirror as unknown as Mirror, ['body', 'children'], {"widgets":[]}],
  ['object-data-table', ObjectDataTableMirror as unknown as Mirror, ['body', 'children'], {}],
  ['object-gallery', ObjectGalleryMirror as unknown as Mirror, ['body', 'children'], {}],
  ['report-viewer', ReportViewerMirror as unknown as Mirror, ['body', 'children'], {}],
  ['view-switcher', ViewSwitcherMirror as unknown as Mirror, ['body', 'children'], {"views":[]}],
  ['filter-ui', FilterUIMirror as unknown as Mirror, ['body', 'children'], {"filters":[]}],
  ['sort-ui', SortUIMirror as unknown as Mirror, ['body', 'children'], {"fields":[]}],
];

const CONTENT = [{ type: 'text', content: 'measured' }];
const issues = (m: Mirror, doc: unknown) => {
  const r = m.safeParse(doc);
  return r.success ? null : r.error!.issues.map((i) => ({ code: i.code, path: i.path.join('.'), message: i.message }));
};
const CASES = ROWS.flatMap(([type, mirror, dead, required]) =>
  dead.map((key) => [`${type}.${key}`, mirror, key, required] as const));

/* ── (a) the dead channels are REFUSED BY NAME, at the key's own path ─────── */

describe('objectui#9256 — family D refuses the content channels its renderers never read', () => {
  it('the population is the measured one — a row dropped from the table fails here', () => {
    expect(ROWS).toHaveLength(58);
    // 3 fewer than 2x: the chatbot faces carry `children` only.
    expect(CASES).toHaveLength(58 * 2 - 3);
  });

  it.each(CASES)('%s is refused at that key\'s own path', (_label, mirror, key, required) => {
    const found = issues(mirror, { ...required, type: ROWS.find((r) => r[1] === mirror)![0], [key]: CONTENT });
    expect(found, `${_label} parsed green — the tombstone is not installed`).not.toBeNull();
    expect(found!.some((i) => i.path === key && i.code === 'invalid_type')).toBe(true);
  });

  it.each(CASES)('%s — the message names the key and the card, so the author is told why', (_label, mirror, key, required) => {
    const issue = issues(mirror, { ...required, type: ROWS.find((r) => r[1] === mirror)![0], [key]: CONTENT })!
      .find((i) => i.path === key)!;
    expect(issue.message).toContain(`\`${key}\``);
    expect(issue.message).toContain('objectui#9256');
    expect(issue.message).toContain('NEITHER content channel');
  });

  it.each(CASES)('%s — ONE string feeds both author-facing channels: the issue message IS the `.describe()` metadata', (_label, mirror, key, required) => {
    const issue = issues(mirror, { ...required, type: ROWS.find((r) => r[1] === mirror)![0], [key]: CONTENT })!
      .find((i) => i.path === key)!;
    expect(mirror.shape[key]?.description).toBe(issue.message);
  });

  it.each(CASES)('%s — the refusal is about the KEY, not a value domain: every value is refused', (_label, mirror, key, required) => {
    const type = ROWS.find((r) => r[1] === mirror)![0];
    for (const value of [CONTENT, 'text', 42, null, {}, []]) {
      expect(issues(mirror, { ...required, type, [key]: value })?.some((i) => i.path === key)).toBe(true);
    }
  });
});

/* ── (b) CONTROLS — nothing that rendered before stops parsing ────────────── */

describe('objectui#9256 — CONTROLS: the node itself, and the held-out channel, are untouched', () => {
  it.each(ROWS)('`%s` still parses with its own required members and a `className`', (type, mirror, _dead, required) => {
    expect(issues(mirror, { ...required, type })).toBeNull();
    expect(issues(mirror, { ...required, type, className: 'p-4' })).toBeNull();
  });

  it.each(CASES)('%s — the tombstone is a MEMBER of the mirror shape, so the parity ratchet\'s key sets stay equal', (_label, mirror, key) => {
    expect(Object.keys(mirror.shape)).toContain(key);
  });

  it('LIVE CONTROL — `chatbot` still accepts `body`, the key held out of this card', () => {
    // The parity ledger records `body` here as "two different meanings of one
    // key — a naming collision to rule on": the mirror declares it as API
    // request params, the declaration inherits the base's content channel.
    // Refusing it would have been a guess, so it is untouched — and this line
    // is what keeps the row above a reading about `children`.
    const r = (ChatbotBodyControl as unknown as Mirror)
      .safeParse({ type: 'chatbot', messages: [], body: { temperature: 0.2 } });
    expect(r.success).toBe(true);
  });

  it('LIVE CONTROL — family C is NOT narrowed: a `div` still accepts both channels', () => {
    // `div` reads `children || body` (a live fallback). Removing a live read is
    // a behaviour change and is with the maintainer, so this line must stay
    // green for this card to be a declaration repair rather than a behaviour
    // change.
    expect(AnyComponentSchema.safeParse({ type: 'div', children: CONTENT }).success).toBe(true);
    expect(AnyComponentSchema.safeParse({ type: 'div', body: CONTENT }).success).toBe(true);
  });
});

/* ── (c) the refusal reaches NESTED nodes, not only the root ──────────────── */

describe('objectui#9256 — a nested family-D node is refused too', () => {
  it('a `skeleton` authoring `children` INSIDE a `box`\'s `children` is REFUSED', () => {
    const r = AnyComponentSchema.safeParse({
      type: 'box',
      children: [{ type: 'skeleton', children: CONTENT }],
    });
    expect(r.success).toBe(false);
    // The child slot is a `z.union`, so what surfaces is ONE `invalid_union` at
    // `children` carrying objectui#8344's capped message — the nested path and
    // the remedy text are collapsed by that union, not by this change.
    expect(r.error!.issues.map((i) => ({ code: i.code, path: i.path.join('.') })))
      .toEqual([{ code: 'invalid_union', path: 'children' }]);
  });

  it('CONTROL — the same tree with a bare `skeleton` parses', () => {
    expect(AnyComponentSchema.safeParse({
      type: 'box',
      children: [{ type: 'skeleton' }],
    }).success).toBe(true);
  });
});

/* ── (d) the TypeScript face — ⚠️ READ BY `tsc`, NOT BY VITEST ────────────── */

describe('objectui#9256 — the TypeScript face refuses both channels at the AUTHORING site', () => {
  it('the `@ts-expect-error` lines in this block are the assertion; vitest only proves they are reachable', () => {
    // One pair per declaration FILE this card edits, so no edited file is
    // covered by the runtime block alone.
    // @ts-expect-error objectui#9256 — `separator` reads neither channel
    const separatorBody: SeparatorSchema = { type: 'separator', body: CONTENT };
    // @ts-expect-error objectui#9256 — `separator` reads neither channel
    const separatorChildren: SeparatorSchema = { type: 'separator', children: CONTENT };
    // @ts-expect-error objectui#9256 — `kbd` reads neither channel
    const kbdBody: KbdSchema = { type: 'kbd', body: CONTENT };
    // @ts-expect-error objectui#9256 — `skeleton` reads neither channel
    const skeletonChildren: SkeletonSchema = { type: 'skeleton', children: CONTENT };
    // @ts-expect-error objectui#9256 — `checkbox` reads neither channel
    const checkboxBody: CheckboxSchema = { type: 'checkbox', body: CONTENT };
    // @ts-expect-error objectui#9256 — `pagination` reads neither channel
    const paginationChildren: PaginationSchema = { type: 'pagination', totalPages: 1, children: CONTENT };
    // @ts-expect-error objectui#9256 — `dialog` reads `content`, never `children`
    const dialogChildren: DialogSchema = { type: 'dialog', children: CONTENT };
    // @ts-expect-error objectui#9256 — `collapsible` reads `trigger` + `content`
    const collapsibleChildren: CollapsibleSchema = { type: 'collapsible', children: CONTENT };
    // @ts-expect-error objectui#9256 — `carousel` reads neither channel
    const carouselBody: CarouselSchema = { type: 'carousel', items: [], body: CONTENT };
    // @ts-expect-error objectui#9256 — `object-gallery` reads neither channel
    const galleryBody: ObjectGallerySchema = { type: 'object-gallery', body: CONTENT };
    // @ts-expect-error objectui#9256 — `view-switcher` reads neither channel
    const viewSwitcherChildren: ViewSwitcherSchema = { type: 'view-switcher', views: [], children: CONTENT };
    // @ts-expect-error objectui#9256 — `report-viewer` reads neither channel
    const reportBody: ReportViewerSchema = { type: 'report-viewer', body: CONTENT };
    // @ts-expect-error objectui#9256 — `nl-query` reads neither channel (no zod mirror exists; this face is the only gate)
    const nlQueryChildren: NLQuerySchema = { type: 'nl-query', children: CONTENT };
    // @ts-expect-error objectui#9256 — `pivot` reads neither channel (no zod mirror exists; this face is the only gate)
    const pivotBody: PivotTableSchema = { type: 'pivot', body: CONTENT };
    // @ts-expect-error objectui#9256 — `chatbot` reads neither channel; `children` is narrowed, `body` is held out
    const chatbotChildren: ChatbotSchema = { type: 'chatbot', messages: [], children: CONTENT };

    expect([
      separatorBody, separatorChildren, kbdBody, skeletonChildren, checkboxBody, paginationChildren,
      dialogChildren, collapsibleChildren, carouselBody, galleryBody, viewSwitcherChildren, reportBody,
      nlQueryChildren, pivotBody, chatbotChildren,
    ]).toHaveLength(15);
  });

  it('CONTROL — the same nodes WITHOUT a content channel compile (no `@ts-expect-error` here, and `tsc` is the reader)', () => {
    const ok = [
      { type: 'separator' } satisfies SeparatorSchema,
      { type: 'kbd' } satisfies KbdSchema,
      { type: 'skeleton' } satisfies SkeletonSchema,
      { type: 'checkbox' } satisfies CheckboxSchema,
      { type: 'dialog', content: CONTENT } satisfies DialogSchema,
      { type: 'collapsible', trigger: CONTENT, content: CONTENT } satisfies CollapsibleSchema,
    ];
    expect(ok).toHaveLength(6);
  });

  it('CONTROL — `chatbot` still TYPE-CHECKS with `body`, the held-out key', () => {
    // ⚠️ The VALUE differs from the mirror control above, and that difference
    // IS the ledgered collision: the TypeScript face inherits `body` from
    // `BaseSchema` as a content channel (`SchemaNode | SchemaNode[]`), while
    // the mirror declares it as `Record` of unknown, "additional API body
    // params". One key, two meanings, on the two published faces of one node —
    // which is why objectui#9256 refuses to tombstone it on a measurement and
    // leaves it for a ruling.
    const held = { type: 'chatbot', messages: [], body: CONTENT } satisfies ChatbotSchema;
    expect(held.type).toBe('chatbot');
  });
});
