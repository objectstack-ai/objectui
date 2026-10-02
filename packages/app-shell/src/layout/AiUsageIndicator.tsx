/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * ADR-0057 #8 — the proactive AI usage indicator for the ChatDock header.
 *
 * ONE small progress ring for the environment's ONE AI quota pool (objectui#8524,
 * following the cloud single-pool ruling), so the user sees remaining AI headroom
 * BEFORE a send hits the 429 wall, instead of only learning the limit reactively.
 * Data comes from {@link useAiUsage} (the cloud `GET /api/v1/ai/usage` endpoint),
 * which speaks D5-SAFE fractions — this component NEVER renders a token number,
 * only a ring, qualitative words and, in the popover, the pool's split as
 * percentages of that same pool.
 *
 * The split (`breakdown`: app-building vs data Q&A) answers "where did the
 * allowance go". It is text inside the popover, under the pool's own row — never
 * a second ring, which would imply a second budget. It appears only when at
 * least one of its members is a number; when it is absent or all-null the popover
 * is the pool row alone.
 *
 * Near-full (≥ {@link NEAR_FULL}) the ring turns amber and, on click, the popover
 * shows "running low — resets tonight/next cycle" plus the SAME upgrade / top-up CTA
 * the 429 error banner uses ({@link cloudConsoleUrl}). When usage is unknown
 * (endpoint absent on an older backend, OSS, no seat) or the pool is unmetered, the
 * whole indicator renders nothing — a missing endpoint degrades to no widget, never
 * a broken one.
 */
import * as React from 'react';
import { cn, Button, Popover, PopoverTrigger, PopoverContent } from '@object-ui/components';
import { formatNumber, useObjectTranslation } from '@object-ui/i18n';
import { useAiUsage, type AiMeterUsage, type AiUsageBreakdown } from '../hooks/useAiUsage.js';
import { cloudConsoleUrl } from '../console/marketplace/marketplaceApi.js';

/** Fraction at/above which the pool is "running low" (amber + CTA). */
export const NEAR_FULL = 0.8;

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

type Tone = 'ok' | 'low' | 'full';

function toneFor(fraction: number): Tone {
  if (fraction >= 1) return 'full';
  if (fraction >= NEAR_FULL) return 'low';
  return 'ok';
}

function ringColorClass(tone: Tone): string {
  if (tone === 'full') return 'text-destructive';
  if (tone === 'low') return 'text-amber-500';
  return 'text-primary';
}

function statusColorClass(tone: Tone): string {
  if (tone === 'full') return 'text-destructive';
  if (tone === 'low') return 'text-amber-600 dark:text-amber-500';
  return 'text-muted-foreground';
}

/** One row of the pool's split: a member that was measured (numeric). */
interface BreakdownRow {
  key: keyof AiUsageBreakdown;
  fraction: number;
}

/** The split rows to show — measured members only; empty means no split section. */
function breakdownRows(breakdown: AiUsageBreakdown | undefined): BreakdownRow[] {
  if (!breakdown) return [];
  const rows: BreakdownRow[] = [];
  (['build', 'dataChat'] as const).forEach((key) => {
    const fraction = breakdown[key];
    if (fraction !== null) rows.push({ key, fraction });
  });
  return rows;
}

/** A small SVG progress ring. Presentational only (aria-hidden) — the button labels it. */
function MeterRing({ fraction, tone, size = 16 }: { fraction: number; tone: Tone; size?: number }) {
  const stroke = 2;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, fraction));
  const dash = circumference * pct;
  const center = size / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={ringColorClass(tone)}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx={center} cy={center} r={r} fill="none" strokeWidth={stroke} className="stroke-muted-foreground/25" />
      <circle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        transform={`rotate(-90 ${center} ${center})`}
      />
    </svg>
  );
}

export interface AiUsageIndicatorProps {
  /** Resolved AI service base (e.g. `/api/v1/ai`). Falsy → the hook stays inert. */
  apiBase?: string;
  /** Gate rendering (e.g. no AI seat). Default true. */
  enabled?: boolean;
  className?: string;
}

/**
 * The ChatDock-header usage indicator. Renders nothing until the pool has a
 * numeric fraction to show (fail-soft — see file header).
 */
export function AiUsageIndicator({ apiBase, enabled = true, className }: AiUsageIndicatorProps) {
  const { t, language } = useObjectTranslation();
  const { usage } = useAiUsage({ apiBase, enabled });

  // "Now", read OUTSIDE render (react-hooks/purity forbids `Date.now()` in the
  // render body — it is non-deterministic and the compiler assumes render can
  // re-run any number of times). `null` until the mount effect measures it —
  // the render body itself never calls `Date.now()`, only reads this state —
  // then refreshed periodically so a long-open popover's "N days/hours" stays
  // roughly current; the countdown is day/hour-grained, so a minute of drift
  // is invisible.
  const [now, setNow] = React.useState<number | null>(null);
  React.useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!enabled || !usage) return null;
  // Unknown (null) and unmetered (usage-based) pools have nothing to ring.
  const { pool } = usage;
  if (pool.unmetered || pool.fraction === null) return null;
  const fraction = pool.fraction;
  const tone = toneFor(fraction);
  const split = breakdownRows(usage.breakdown);

  const splitLabel = (key: BreakdownRow['key']): string =>
    key === 'build'
      ? t('console.ai.usage.meterBuild', { defaultValue: 'Build' })
      : t('console.ai.usage.meterAsk', { defaultValue: 'Ask' });

  const statusLabel = (level: Tone): string => {
    if (level === 'full') return t('console.ai.usage.statusFull', { defaultValue: 'Limit reached' });
    if (level === 'low') return t('console.ai.usage.statusLow', { defaultValue: 'Running low' });
    return t('console.ai.usage.statusOk', { defaultValue: 'Plenty left' });
  };

  // "N hours" until the reset, rounded UP and never below 1: a reset under an
  // hour away reads "1 hour", never "0 hours", and the line never promises a
  // reset earlier than the real one. The `resetsWeeklyHours` copy names no
  // window ("Resets in N hours" in every locale pack), so the weekly arm's
  // final day and the whole 5-hour window share it.
  const hoursResetLabel = (diffMs: number): string => {
    const hours = Math.max(1, Math.ceil(diffMs / ONE_HOUR_MS));
    return t('console.ai.usage.resetsWeeklyHours', { count: hours, defaultValue: 'Resets in {{count}} hours' });
  };

  // The rolling windows (`weekly`: 7 days, cloud PR #1852; `fiveHour`: the
  // 5-hour pace, cloud#2059) count down from `resetsAt` and the `now` state
  // above — PURE given those two inputs, no clock read here. Contract-first
  // (objectui#7371) — `resetsAt` is the ONE source of the reset instant;
  // never re-derive or guess it client-side.
  const weeklyResetLabel = (resetsAt: string, nowMs: number): string => {
    const diffMs = new Date(resetsAt).getTime() - nowMs;
    if (diffMs <= ONE_DAY_MS) return hoursResetLabel(diffMs);
    const days = Math.ceil(diffMs / ONE_DAY_MS);
    return t('console.ai.usage.resetsWeeklyDays', { count: days, defaultValue: 'Resets in {{count}} days' });
  };
  const fiveHourResetLabel = (resetsAt: string, nowMs: number): string =>
    hoursResetLabel(new Date(resetsAt).getTime() - nowMs);

  // `null` = render nothing for this line — an unrecognized `resetKind` (a
  // future backend value this build doesn't know yet) fails soft instead of
  // crashing or showing stale/wrong copy, a rolling-window pool with no
  // `resetsAt` yet (nothing counted) is never guessed at (objectui#7371), and
  // `now` not yet measured (the one frame before the mount effect above runs)
  // is the same "nothing to show yet" as any other missing input.
  const resetLabel = (meter: AiMeterUsage): string | null => {
    if (meter.resetKind === 'daily') return t('console.ai.usage.resetsDaily', { defaultValue: 'Resets tonight' });
    if (meter.resetKind === 'monthly')
      return t('console.ai.usage.resetsMonthly', { defaultValue: 'Resets next cycle' });
    if (meter.resetKind === 'weekly')
      return meter.resetsAt && now !== null ? weeklyResetLabel(meter.resetsAt, now) : null;
    if (meter.resetKind === 'fiveHour')
      return meter.resetsAt && now !== null ? fiveHourResetLabel(meter.resetsAt, now) : null;
    return null;
  };

  // No upstream cloud named by the runtime ⇒ no control plane to send anyone
  // to, so no CTA (objectui#7253).
  const showCta = tone !== 'ok' && (pool.upgrade || pool.topUp) && !!cloudConsoleUrl();
  const reset = resetLabel(pool);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          data-testid="ai-usage-indicator"
          className={cn('h-7 gap-1.5 px-1.5 text-muted-foreground hover:text-foreground', className)}
          aria-label={t('console.ai.usage.ariaLabel', {
            defaultValue: 'AI usage: {{status}}',
            status: statusLabel(tone),
          })}
        >
          <MeterRing fraction={fraction} tone={tone} />
          {tone !== 'ok' ? (
            <span className={cn('hidden text-xs font-medium sm:inline', statusColorClass(tone))}>
              {statusLabel(tone)}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3" data-testid="ai-usage-popover">
        <div className="mb-2 text-xs font-semibold text-foreground/80">
          {t('console.ai.usage.title', { defaultValue: 'AI usage' })}
        </div>
        <div className="flex items-start gap-2.5">
          <MeterRing fraction={fraction} tone={tone} size={22} />
          <div className="min-w-0 flex-1">
            <div className={cn('text-sm font-medium', statusColorClass(tone))}>{statusLabel(tone)}</div>
            {reset ? <div className="text-xs text-muted-foreground">{reset}</div> : null}
            {showCta ? (
              <Button
                variant="link"
                size="sm"
                className="mt-1 h-auto p-0 text-xs"
                data-testid="ai-usage-cta"
                onClick={() => window.open(cloudConsoleUrl(), '_blank', 'noopener,noreferrer')}
              >
                {pool.upgrade
                  ? t('console.ai.usage.ctaUpgrade', { defaultValue: 'Upgrade to keep going' })
                  : t('console.ai.usage.ctaTopUp', { defaultValue: 'Add credits to continue' })}
              </Button>
            ) : null}
          </div>
        </div>
        {split.length > 0 ? (
          <div className="mt-3 border-t pt-2" data-testid="ai-usage-breakdown">
            <div className="mb-1 text-xs text-muted-foreground">
              {t('console.ai.usage.breakdownTitle', { defaultValue: 'Used so far' })}
            </div>
            <ul className="space-y-0.5">
              {split.map((row) => (
                <li key={row.key} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-foreground">{splitLabel(row.key)}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatNumber(row.fraction, { locale: language, style: 'percent', maximumFractionDigits: 0 })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
