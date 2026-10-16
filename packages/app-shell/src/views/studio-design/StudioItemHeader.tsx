// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * StudioItemHeader — the item header row and tab row at the top of every
 * Studio pillar's content column (objectui#12459, epic objectui#12446).
 *
 * One row: an icon tile, the item's label at 18 px, its machine name as a
 * mono chip, optional kind chips, the item's status chip, a muted meta slot,
 * and a right-aligned actions slot. Under it, when the pillar has tabs, a
 * 36 px tab row whose active tab carries a 2 px primary underline; without
 * tabs the header keeps 12 px of bottom padding so the body starts at the
 * same rhythm. The pillar decides what each slot holds; this file decides
 * where everything sits.
 *
 * objectui#12524 — the status chip ("Unpublished draft") has one place in
 * every pillar: right after the identity (title, api-name chip, kind chips),
 * before the meta, never in the actions slot, which holds actions only. The
 * pillar passes the status as data and this file draws the chip, so no
 * pillar places or styles it itself. The identity chips sit in one
 * `contents` wrapper, always rendered: it draws no box, so the layout is
 * unchanged, and the status chip is the same child of the same row in every
 * pillar whatever identity chips the pillar shows. The title stays a direct
 * child of the row.
 */

import * as React from 'react';
import { cn } from '@object-ui/components';
import {
  STUDIO_API_CHIP,
  STUDIO_ICON_TILE,
  STUDIO_ITEM_HEADER,
  STUDIO_ITEM_TITLE,
  STUDIO_META,
  STUDIO_TAB,
  STUDIO_TAB_ACTIVE,
  STUDIO_TAB_IDLE,
  STUDIO_TAB_ROW,
} from './studio-tokens.js';

/** The item's status, drawn by the header as one amber chip (objectui#12524). */
export interface StudioItemStatus {
  /** The chip's text. */
  label: string;
  /** A longer sentence for the tooltip. */
  title?: string;
}

/**
 * The amber status chip. The header draws it from `status`; it is exported
 * for the one place that shows the same status outside a title row (the
 * Access set page's tab row).
 */
export function StudioStatusChip({ label, title }: StudioItemStatus): React.ReactElement {
  return (
    <span
      data-testid="studio-item-status"
      title={title}
      className="inline-flex shrink-0 items-center whitespace-nowrap rounded bg-amber-400/15 px-2 py-0.5 text-[11px] text-amber-600 dark:text-amber-300"
    >
      {label}
    </span>
  );
}

export interface StudioItemHeaderProps {
  /** The icon component for the tile; omitted when the pillar has nothing open. */
  icon?: React.ElementType;
  /** The item's label. */
  title: React.ReactNode;
  /** Attributes for the title element (a test id, a tooltip with the machine name). */
  titleProps?: React.HTMLAttributes<HTMLElement> & { 'data-testid'?: string };
  /** The item's machine name, as a mono chip. */
  apiName?: string;
  /** Kind chips and badges after the name. Not the status: that is `status`. */
  chips?: React.ReactNode;
  /** The item's status ("Unpublished draft"), after the chips and before the meta. */
  status?: StudioItemStatus;
  /** Muted meta text (a field count, a trigger summary). */
  meta?: React.ReactNode;
  /** The right-aligned actions slot. */
  actions?: React.ReactNode;
  /** The tab row; built from `StudioTab`. */
  tabs?: React.ReactNode;
  /** A leading control before the tile (the mobile rail toggle). */
  leading?: React.ReactNode;
  testId?: string;
  className?: string;
}

export function StudioItemHeader({
  icon: Icon,
  title,
  titleProps,
  apiName,
  chips,
  status,
  meta,
  actions,
  tabs,
  leading,
  testId,
  className,
}: StudioItemHeaderProps): React.ReactElement {
  return (
    <div data-testid={testId} className={cn(STUDIO_ITEM_HEADER, !tabs && 'pb-3', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {leading}
        {Icon && (
          <span className={STUDIO_ICON_TILE}>
            <Icon className="h-4 w-4" />
          </span>
        )}
        <h1 {...titleProps} className={cn(STUDIO_ITEM_TITLE, titleProps?.className)}>
          {title}
        </h1>
        <span className="contents" data-slot="identity-chips">
          {apiName && <code className={STUDIO_API_CHIP}>{apiName}</code>}
          {chips}
        </span>
        {status && <StudioStatusChip {...status} />}
        {meta && <span className={STUDIO_META}>{meta}</span>}
        {actions && <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {tabs && <nav className={STUDIO_TAB_ROW}>{tabs}</nav>}
    </div>
  );
}

export interface StudioTabProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  active?: boolean;
  children: React.ReactNode;
}

/**
 * One underline tab. `aria-pressed` carries the active state for tests and
 * readers. Forwards its ref so a menu trigger can wrap it (`asChild`).
 */
export const StudioTab = React.forwardRef<HTMLButtonElement, StudioTabProps>(function StudioTab(
  { active = false, className, children, ...buttonProps },
  ref,
) {
  return (
    <button
      type="button"
      aria-pressed={active}
      {...buttonProps}
      ref={ref}
      className={cn(STUDIO_TAB, active ? STUDIO_TAB_ACTIVE : STUDIO_TAB_IDLE, className)}
    >
      {children}
    </button>
  );
});
