/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * PageHeader Component
 *
 * Standardized page header used across console object/list/detail views,
 * dashboards, and console pages outside this package, which import it from
 * the package root as `ConsolePageHeader` (objectui#12526). Provides
 * consistent typography, icon framing, and action grouping so individual
 * screens don't reinvent the title row.
 *
 * Layout — ONE row from the `sm` breakpoint up (objectui#12423):
 *   [accent hairline]
 *   [icon] Title [kind] | crumb › subtitle…   [refresh] [actions...]
 * Below `sm` the subtitle is hidden, so a phone draws icon, title and actions.
 *
 * Setup posture — inside the Setup app (objectui#12606) the description sits
 * UNDER the title, so every Setup page (a `sys_*` list, a metadata type, a
 * settings namespace, a component page) draws one header whose title lands
 * at the same place:
 *   [accent hairline]
 *   [32px tile] Title (18px / 600) [kind]          [refresh] [actions...]
 *               crumb › description (13px, muted)
 * The posture is read off the route (`useInSetupApp`), not passed by the
 * page, so a console page outside Setup keeps the one-row header.
 */

import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button, cn } from '@object-ui/components';
import { useInSetupApp } from '../console/setupApp.js';

/**
 * Props of the app-shell `<PageHeader>` React component.
 *
 * Named `ConsolePageHeaderProps`, not `PageHeaderProps`:
 * `@objectstack/spec/ui` exports a `PageHeaderProps` **zod schema** describing
 * the AUTHORED SDUI page-header node — `title: string`, `subtitle`, `icon`
 * (an icon NAME), `breadcrumb`, `actions: string[]` (action ids), `aria`. This
 * interface is the runtime React contract for the same visual element:
 * `React.ReactNode` in place of every string, `actions` as rendered elements
 * rather than ids, plus render-only knobs (`accentColor`, `sticky`,
 * `className`, `data-testid`) the authored schema has no reason to model.
 * Authored layer vs. rendered layer — two layers, one name, which is the
 * objectstack#4115 defect. `__tests__/spec-symbol-parity.test.ts` pins that the spec
 * does not own this name.
 *
 * Not `PageHeaderComponentProps` either. This interface carried that name
 * until objectui#6349 (batch 8). `@object-ui/layout` publishes it for the
 * props of its own `<PageHeader>`, which is a different React component.
 * Its `title` and `subtitle` are strings with record tokens, its
 * `actions` are action definitions handed to `record:quick_actions`, and it
 * adds `showBack` and `schema` on top of every DOM attribute. (It is not the
 * `page:header` renderer either: `@object-ui/components` registers that node
 * type.) This console title row takes rendered nodes, and its
 * `actions` is one rendered node. The two shapes do not fit each other, so
 * this name cannot be re-pointed at layout's, and the console's header has the
 * specific name.
 */
export interface ConsolePageHeaderProps {
  /** Page title (required, becomes <h1>). */
  title: React.ReactNode;
  /**
   * Optional secondary line, drawn inline after the title behind a hairline
   * divider and truncated to the row (objectui#12423; it sat beneath the
   * title before). `subtitle` is the only spelling this component accepts.
   *
   * It used to be `description`, which made one concept carry two key names
   * one package apart: `@objectstack/spec/ui`'s `PageHeaderProps` declares
   * `subtitle` for the authored `page:header` node, and `@object-ui/layout`'s
   * `<PageHeader>` converged on `subtitle` in objectui#3789. This component is
   * the console's rendered layer of that same element, so it now spells the
   * secondary line the way the contract does (objectui#4761).
   *
   * The old spelling was NOT kept as an alias. When it was renamed, the
   * component was not reachable outside this package — the package root did
   * not re-export it, and the `exports` map declares no subpath that could
   * reach it — so nothing had to be tolerated, and a renderer-side alias is
   * exactly the second dialect AGENTS.md #0.1 exists to prevent.
   * `__tests__/PageHeader.subtitle.test.tsx` pins both halves.
   *
   * The package root now exports it, as `ConsolePageHeader` with these props
   * (objectui#12526), so a console page outside this package draws the same
   * header: the name is not `PageHeader`, which `@object-ui/layout` already
   * exports for its own, different component (see this interface's docblock).
   * It was published with `subtitle` as its only spelling.
   */
  subtitle?: React.ReactNode;
  /**
   * Optional leading icon (already-instantiated React element).
   * The icon is auto-sized via CSS — pass it with whatever default sizing,
   * the chip will scale child `<svg>` elements to fit.
   */
  icon?: React.ReactNode;
  /**
   * The page's kind chip, drawn right after the title (objectui#12606) — the
   * `ManagedByBadge` of a `sys_*` list, a metadata type's writability badge.
   * A rendered node, so the chip keeps its own words and its own gate.
   */
  badge?: React.ReactNode;
  /**
   * Leading crumb(s), drawn at the start of the description line — the
   * settings page's "All settings" link (objectui#12606). It never sits above
   * the title, so the title lands where every other page's does.
   */
  breadcrumb?: React.ReactNode;
  /**
   * The page's Refresh, drawn as one icon button before `actions`, so the
   * primary action stays rightmost (objectui#12606). `label` is the button's
   * accessible name and tooltip; `busy` spins the icon and disables it.
   */
  refresh?: { onRefresh: () => void; label: string; busy?: boolean };
  /** Right-aligned actions (buttons, dropdowns, etc.). */
  actions?: React.ReactNode;
  /**
   * CSS color used to tint the top hairline, icon chip background, and
   * icon stroke. Defaults to the Shadcn `--primary` token so the header
   * automatically follows the active app's branding.
   *
   * Accepts any CSS color value (e.g. `'#8b5cf6'`, `'hsl(280 70% 55%)'`,
   * `'var(--my-token)'`).
   */
  accentColor?: string;
  /**
   * When true, the header is `position: sticky; top: 0` and gains a
   * translucent backdrop blur so content scrolling underneath remains
   * partly visible. Opt-in — the default layout used by ObjectView already
   * pins the header by virtue of being the first child of a non-scrolling
   * flex column, so flipping this on there would be a no-op (or worse,
   * conflict with z-index of overlays).
   */
  sticky?: boolean;
  /** Additional className applied to the outer container. */
  className?: string;
  /** Optional data-testid for E2E selectors. */
  'data-testid'?: string;
}

/**
 * Reusable page header for the console.
 *
 * Mirrors Shadcn / Linear / Notion conventions: subtle border, comfortable
 * vertical padding, primary-tinted icon chip, monolithic action cluster on
 * the right with consistent gap.
 *
 * The accent color cascades through a CSS custom property
 * (`--page-header-accent`) so consumers can override it without rebuilding
 * Tailwind classes.
 */
export function PageHeader({
  title,
  subtitle,
  icon,
  badge,
  breadcrumb,
  refresh,
  actions,
  accentColor,
  sticky = false,
  className,
  'data-testid': testId,
}: ConsolePageHeaderProps) {
  // Resolve accent → CSS var. Falls back to the Shadcn primary token so the
  // header follows whatever brand the active app has injected.
  const accent = accentColor || 'hsl(var(--primary))';
  const style = { '--page-header-accent': accent } as React.CSSProperties;
  // objectui#12606 — Setup's posture: the description under the title.
  const setup = useInSetupApp();

  const refreshButton = refresh ? (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0"
      onClick={refresh.onRefresh}
      disabled={refresh.busy}
      aria-label={refresh.label}
      title={refresh.label}
      data-testid="page-header-refresh"
    >
      <RefreshCw className={cn('h-4 w-4', refresh.busy && 'animate-spin')} />
    </Button>
  ) : null;

  const trailing = (refreshButton || actions) && (
    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
      {refreshButton}
      {actions}
    </div>
  );

  return (
    <div
      style={style}
      className={cn(
        'relative shrink-0 border-b bg-background z-10',
        sticky &&
          'sticky top-0 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/75',
        className,
      )}
      data-testid={testId ?? 'page-header'}
      data-posture={setup ? 'setup' : 'row'}
    >
      {/* Accent hairline — a 2px gradient strip that fades to transparent at
          both edges. Picks up the app's accent color, or the default primary
          token. Decorative only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-80"
        style={{
          background:
            'linear-gradient(90deg, transparent, var(--page-header-accent), transparent)',
        }}
      />

      {setup ? (
        <div className="flex justify-between items-center gap-3 py-3 px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {icon && <IconTile size="setup">{icon}</IconTile>}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="min-w-0 truncate text-lg font-semibold leading-6 tracking-tight text-foreground">
                  {title}
                </h1>
                {badge}
              </div>
              {/* Always drawn, empty or not: a page without a description
                  keeps the same two-line height, so its title sits where
                  every other Setup page's does. */}
              <p
                className="min-h-[18px] truncate text-[13px] leading-[18px] text-muted-foreground"
                data-testid="page-header-description"
              >
                {breadcrumb}
                {subtitle}
              </p>
            </div>
          </div>
          {trailing}
        </div>
      ) : (
        <div className="flex justify-between items-center gap-3 py-2.5 sm:py-2 px-4 sm:px-6">
          {/* One row: icon, title, then the subtitle behind a hairline — all
              siblings of this flex row, so nothing wraps beneath the title
              (objectui#12423). `min-h-9` floors the row at the chip's `h-9`, so
              a header with no icon and no action is as tall as one with them
              (objectui#12553). It sits here, not on the padded row above: under
              `border-box` a min-height there would count that row's padding. */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 min-h-9">
            {icon && <IconTile size="row">{icon}</IconTile>}
            <h1 className="min-w-0 max-w-full sm:max-w-[60%] shrink-0 text-base sm:text-lg font-semibold tracking-tight text-foreground truncate leading-tight">
              {title}
            </h1>
            {badge}
            {(subtitle || breadcrumb) && (
              <>
                <span aria-hidden="true" className="hidden sm:block h-4 w-px shrink-0 bg-border" />
                <p className="hidden sm:block min-w-0 flex-1 truncate text-sm text-muted-foreground">
                  {breadcrumb}
                  {subtitle}
                </p>
              </>
            )}
          </div>
          {trailing}
        </div>
      )}
    </div>
  );
}

/**
 * The accent-tinted icon chip: 36px in the one-row header, 32px in Setup's
 * (objectui#12606). Auto-sizes any nested SVG so callers don't have to think
 * about sizing inside the chip.
 */
function IconTile({ size, children }: { size: 'row' | 'setup'; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'shrink-0 inline-flex items-center justify-center rounded-lg',
        size === 'setup' ? 'h-8 w-8 [&_svg]:h-4 [&_svg]:w-4' : 'h-9 w-9 [&_svg]:h-[18px] [&_svg]:w-[18px]',
      )}
      style={{
        color: 'var(--page-header-accent)',
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--page-header-accent) 18%, transparent), color-mix(in srgb, var(--page-header-accent) 6%, transparent))',
        boxShadow:
          'inset 0 0 0 1px color-mix(in srgb, var(--page-header-accent) 22%, transparent)',
      }}
    >
      {children}
    </div>
  );
}

export default PageHeader;
