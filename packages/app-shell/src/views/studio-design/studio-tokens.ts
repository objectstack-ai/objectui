// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * studio-tokens — the Studio design surface's shared measurements, spelled
 * once as Tailwind class strings (objectui#12459, epic objectui#12446).
 *
 * The four pillars (Data, Automations, Interfaces, Access) share one skeleton:
 * a 48 px shell header, a 240 px rail, a content column whose item header,
 * tab row and body sit at the same offsets everywhere, and a 300 px inspector
 * aside. Every pillar composes these constants instead of restating the
 * numbers, so a later pillar card changes a measurement in one place and the
 * reference artboards under `docs/design/studio-redesign/` stay the contract.
 */

/** Shell header: 48 px, a `1fr auto 1fr` grid so the pillar switcher centers. */
export const STUDIO_HEADER = 'grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b px-3';

/** Rail: 240 px, the sidebar surface, a right border. */
export const STUDIO_RAIL_WIDTH = 'w-60';
export const STUDIO_RAIL_HEADER = 'flex h-11 shrink-0 items-center gap-2 pl-4 pr-3';
export const STUDIO_RAIL_HEADING = 'text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground';
export const STUDIO_RAIL_COUNT = 'inline-flex h-[18px] min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-medium text-muted-foreground';
export const STUDIO_RAIL_SEARCH = 'h-8 w-full rounded-md border bg-background pl-8 pr-2.5 text-[13px] outline-none placeholder:text-muted-foreground/70 focus:ring-1 focus:ring-primary';
export const STUDIO_RAIL_ROW = 'flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-[13px]';
export const STUDIO_RAIL_ROW_ACTIVE = 'bg-primary/10 font-medium text-primary';
export const STUDIO_RAIL_ROW_IDLE = 'text-foreground/90 hover:bg-muted/60 hover:text-foreground';
export const STUDIO_RAIL_ROW_INDENT = 'pl-[22px]';
export const STUDIO_RAIL_GROUP = 'mt-1.5 flex h-7 items-center gap-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground';

/** Content column: the item header row, its tab row and the body under them. */
export const STUDIO_ITEM_HEADER = 'shrink-0 border-b px-6 pt-[18px]';
export const STUDIO_ITEM_TITLE = 'min-w-0 truncate text-[18px] font-semibold leading-tight tracking-[-0.01em] text-foreground';
export const STUDIO_ICON_TILE = 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary';
export const STUDIO_API_CHIP = 'inline-flex h-[22px] shrink-0 items-center rounded-[5px] bg-muted px-2 font-mono text-[11px] text-muted-foreground';
export const STUDIO_KIND_CHIP = 'inline-flex h-[22px] shrink-0 items-center rounded-[5px] bg-muted px-2 text-[11px] font-medium text-muted-foreground';
export const STUDIO_META = 'min-w-0 truncate text-xs text-muted-foreground';
export const STUDIO_TAB_ROW = '-mb-px mt-3 flex gap-1';
export const STUDIO_TAB = 'inline-flex h-9 items-center gap-1.5 border-b-2 px-2.5 text-[13px] transition-colors';
export const STUDIO_TAB_ACTIVE = 'border-primary font-medium text-foreground';
export const STUDIO_TAB_IDLE = 'border-transparent text-muted-foreground hover:text-foreground';
export const STUDIO_HEADER_ICON_BUTTON = 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground';

/** Inspector aside: 300 px, a left border. */
export const STUDIO_ASIDE_WIDTH = 'w-[300px]';
export const STUDIO_ASIDE_HEADER = 'flex shrink-0 items-start gap-2 border-b px-4 pb-3 pt-3.5';
export const STUDIO_ASIDE_EYEBROW = 'block text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground';
export const STUDIO_ASIDE_TITLE = 'mt-0.5 block truncate text-[15px] font-semibold';
export const STUDIO_ASIDE_ID = 'mt-1 inline-block font-mono text-[11px] text-muted-foreground';
export const STUDIO_ASIDE_FOOTER = 'shrink-0 border-t px-4 py-3 text-xs text-muted-foreground';
