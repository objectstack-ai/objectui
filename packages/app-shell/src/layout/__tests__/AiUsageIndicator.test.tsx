/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * AiUsageIndicator (ADR-0057 #8) — renders ONE ring for the ONE AI quota pool
 * (objectui#8524), hides itself when there's nothing to show (fail-soft), surfaces
 * a "running low" hint near the cap, offers the upgrade / top-up CTA (reusing the
 * 429 deep-link), and shows the pool's read-only split as text in the popover —
 * never as a second ring. Never a token #.
 */
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { AiUsageResponse, AiMeterUsage } from '../../hooks/useAiUsage';

vi.mock('@object-ui/i18n', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useObjectTranslation: () => ({
    // Interpolates `{{name}}` from the options object (mirrors real i18next
    // closely enough for count-driven copy like `resetsWeeklyDays`) — a plain
    // `String(options?.defaultValue ?? key)` would leave `{{count}}` literal.
    t: (key: string, options?: Record<string, unknown>) =>
      String(options?.defaultValue ?? key).replace(/\{\{(\w+)\}\}/g, (_m, name: string) =>
        String(options?.[name] ?? ''),
      ),
    language: 'en',
  }),
}));
const openMock = vi.fn();
vi.mock('../../console/marketplace/marketplaceApi', () => ({
  cloudConsoleUrl: () => 'https://cloud.example',
}));
vi.mock('../../hooks/useAiUsage', () => ({ useAiUsage: vi.fn() }));

import { useAiUsage } from '../../hooks/useAiUsage';
import { AiUsageIndicator } from '../AiUsageIndicator';

// The REAL hook, for the cases that drive a wire payload through the parser
// into the component. Loaded at module scope so its import cost is paid in the
// import phase, never inside a test's bounded window.
const { useAiUsage: realUseAiUsage } =
  await vi.importActual<typeof import('../../hooks/useAiUsage')>('../../hooks/useAiUsage');

const pool = (over: Partial<AiMeterUsage> = {}): AiMeterUsage => ({
  planType: 'free',
  fraction: 0.3,
  unmetered: false,
  resetKind: 'daily',
  resetsAt: null,
  upgrade: true,
  topUp: false,
  ...over,
});

function setUsage(usage: AiUsageResponse | null) {
  (useAiUsage as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    usage,
    loading: false,
    error: undefined,
    refetch: vi.fn(),
  });
}

/** Rings drawn inside an element — each `MeterRing` is one `svg`. */
const ringsIn = (el: HTMLElement) => el.querySelectorAll('svg').length;

describe('AiUsageIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('open', openMock);
  });

  it('renders nothing when usage is unknown (null)', () => {
    setUsage(null);
    const { container } = render(<AiUsageIndicator apiBase="/api/v1/ai" />);
    expect(screen.queryByTestId('ai-usage-indicator')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the pool is unmetered', () => {
    setUsage({ pool: pool({ unmetered: true, fraction: null }) });
    render(<AiUsageIndicator apiBase="/api/v1/ai" />);
    expect(screen.queryByTestId('ai-usage-indicator')).not.toBeInTheDocument();
  });

  it('renders nothing when the pool fraction is unknown (null)', () => {
    setUsage({ pool: pool({ fraction: null }), breakdown: { build: null, dataChat: null } });
    render(<AiUsageIndicator apiBase="/api/v1/ai" />);
    expect(screen.queryByTestId('ai-usage-indicator')).not.toBeInTheDocument();
  });

  it('draws ONE ring for the pool, even when the split is measured', () => {
    setUsage({ pool: pool({ fraction: 0.5 }), breakdown: { build: 0.3, dataChat: 0.2 } });
    render(<AiUsageIndicator apiBase="/api/v1/ai" />);
    const trigger = screen.getByTestId('ai-usage-indicator');
    expect(ringsIn(trigger)).toBe(1);
    // No token numbers anywhere in the rendered output (D5).
    expect(trigger.textContent ?? '').not.toMatch(/\d{3,}/);
  });

  it('shows a "running low" hint when the pool is near full', () => {
    setUsage({ pool: pool({ fraction: 0.9 }) });
    render(<AiUsageIndicator apiBase="/api/v1/ai" />);
    expect(screen.getByText('Running low')).toBeInTheDocument();
  });

  it('does not show the low hint when the pool has headroom', () => {
    setUsage({ pool: pool({ fraction: 0.2 }) });
    render(<AiUsageIndicator apiBase="/api/v1/ai" />);
    expect(screen.queryByText('Running low')).not.toBeInTheDocument();
  });

  it('opens the upgrade deep-link from the CTA when a free pool is near full', () => {
    setUsage({ pool: pool({ fraction: 0.95, upgrade: true }) });
    render(<AiUsageIndicator apiBase="/api/v1/ai" />);
    fireEvent.click(screen.getByTestId('ai-usage-indicator'));
    fireEvent.click(screen.getByTestId('ai-usage-cta'));
    expect(openMock).toHaveBeenCalledWith('https://cloud.example', '_blank', 'noopener,noreferrer');
  });

  // objectui#8524 — `breakdown` answers "where did the allowance go". It is
  // text under the pool's row, never a second gauge implying a second budget.
  describe('the pool split (breakdown)', () => {
    it('lists each measured member as a share of the pool — as text, not a ring', () => {
      setUsage({ pool: pool({ fraction: 0.5 }), breakdown: { build: 0.3, dataChat: 0.2 } });
      render(<AiUsageIndicator apiBase="/api/v1/ai" />);
      fireEvent.click(screen.getByTestId('ai-usage-indicator'));
      const split = screen.getByTestId('ai-usage-breakdown');
      expect(split).toHaveTextContent('Build');
      expect(split).toHaveTextContent('30%');
      expect(split).toHaveTextContent('Ask');
      expect(split).toHaveTextContent('20%');
      expect(ringsIn(split)).toBe(0);
      expect(ringsIn(screen.getByTestId('ai-usage-popover'))).toBe(1);
    });

    it('with both members null (not measured): one ring, no split', () => {
      setUsage({ pool: pool({ fraction: 0.5 }), breakdown: { build: null, dataChat: null } });
      render(<AiUsageIndicator apiBase="/api/v1/ai" />);
      expect(ringsIn(screen.getByTestId('ai-usage-indicator'))).toBe(1);
      fireEvent.click(screen.getByTestId('ai-usage-indicator'));
      expect(screen.getByTestId('ai-usage-popover')).toBeInTheDocument();
      expect(screen.queryByTestId('ai-usage-breakdown')).not.toBeInTheDocument();
    });

    it('with no breakdown at all: one ring, no split', () => {
      setUsage({ pool: pool({ fraction: 0.5 }) });
      render(<AiUsageIndicator apiBase="/api/v1/ai" />);
      expect(ringsIn(screen.getByTestId('ai-usage-indicator'))).toBe(1);
      fireEvent.click(screen.getByTestId('ai-usage-indicator'));
      expect(screen.getByTestId('ai-usage-popover')).toBeInTheDocument();
      expect(screen.queryByTestId('ai-usage-breakdown')).not.toBeInTheDocument();
    });
  });

  // The wire payload through the REAL parser into the component — the path
  // that went blank when the endpoint became one pool (objectui#8524).
  describe('through the real hook', () => {
    const okResponse = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as unknown as Response;
    // What the real hook last handed the component — read to know the fetch has
    // settled, so an empty DOM is a reading and not the pre-fetch first frame.
    let last: ReturnType<typeof realUseAiUsage> | undefined;

    beforeEach(() => {
      last = undefined;
      (useAiUsage as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (options: Parameters<typeof realUseAiUsage>[0]) => (last = realUseAiUsage(options)),
      );
    });
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('renders the ring for a `{ pool }` answer that carries no `breakdown`', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({ pool: pool({ fraction: 0.4 }) })));
      render(<AiUsageIndicator apiBase="/api/v1/ai" />);
      const trigger = await screen.findByTestId('ai-usage-indicator');
      expect(ringsIn(trigger)).toBe(1);
      expect(last?.error).toBeUndefined();
    });

    it('renders nothing for the retired per-meter `{ meters }` answer', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          okResponse({ meters: { build: pool({ fraction: 0.4 }), dataChat: pool({ fraction: 0.1 }) } }),
        ),
      );
      const { container } = render(<AiUsageIndicator apiBase="/api/v1/ai" />);
      await waitFor(() => expect(last?.error).toBeDefined());
      expect(last?.usage).toBeNull();
      expect(container).toBeEmptyDOMElement();
    });
  });

  // objectui#7371 — the free plan's `resetKind: 'weekly'` (cloud PR #1852).
  describe('resetKind: weekly', () => {
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const ONE_DAY_MS = 24 * ONE_HOUR_MS;

    it('shows "N days" when resetsAt is more than a day out', () => {
      const resetsAt = new Date(Date.now() + 3 * ONE_DAY_MS).toISOString();
      setUsage({ pool: pool({ resetKind: 'weekly', resetsAt }) });
      render(<AiUsageIndicator apiBase="/api/v1/ai" />);
      fireEvent.click(screen.getByTestId('ai-usage-indicator'));
      expect(screen.getByText('Resets in 3 days')).toBeInTheDocument();
    });

    it('switches to hours when resetsAt is within a day (D5: never a token count)', () => {
      const resetsAt = new Date(Date.now() + 5 * ONE_HOUR_MS).toISOString();
      setUsage({ pool: pool({ resetKind: 'weekly', resetsAt }) });
      render(<AiUsageIndicator apiBase="/api/v1/ai" />);
      fireEvent.click(screen.getByTestId('ai-usage-indicator'));
      expect(screen.getByText('Resets in 5 hours')).toBeInTheDocument();
    });

    it('shows no reset line when weekly has no resetsAt yet — contract-first, never guessed client-side', () => {
      setUsage({ pool: pool({ resetKind: 'weekly', resetsAt: null }) });
      render(<AiUsageIndicator apiBase="/api/v1/ai" />);
      fireEvent.click(screen.getByTestId('ai-usage-indicator'));
      expect(screen.queryByText(/Resets/)).not.toBeInTheDocument();
    });

    it('falls back to no reset line (not a crash or stale copy) on an unrecognized resetKind', () => {
      // Cast past the union: a future backend value this build doesn't know yet.
      setUsage({ pool: pool({ resetKind: 'quarterly' as unknown as AiMeterUsage['resetKind'] }) });
      expect(() => render(<AiUsageIndicator apiBase="/api/v1/ai" />)).not.toThrow();
      fireEvent.click(screen.getByTestId('ai-usage-indicator'));
      expect(screen.queryByText(/Resets/)).not.toBeInTheDocument();
    });
  });
});
