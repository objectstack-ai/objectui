/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#12843 — a `sys_activity` read the server REFUSES shows, on Home's
 * activity card, the permission sentence the record activity panel shows for
 * the same refusal (objectui#11195), not "An unexpected error occurred.".
 *
 * One verdict decides it on both surfaces: the shared feed classifies its
 * rejection with plugin-detail's `isRefusedFeedRead`, the function the record
 * panel reads, and the card renders the same `detail.activityAccessDenied` key.
 * The pins run the real hook (`useHumanActivityFeed`, Home's cut of the shared
 * feed) into the real card under the real en catalogue; only the adapter is a
 * fake, and it answers each case's way:
 *
 *   - a 403 `PERMISSION_DENIED` envelope ⇒ the record panel's sentence, read
 *     back from the record panel itself rendered beside it;
 *   - CONTROL: a 500 ⇒ the generic failure, unchanged;
 *   - CONTROL: an answered read ⇒ the rows.
 */
import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { I18nProvider, useObjectTranslation } from '@object-ui/i18n';
import { RecordActivityTimeline } from '@object-ui/plugin-detail';
import { withRoster } from '../../../hooks/__tests__/activityRoster';
import { HomeActivity } from '../HomeRail';

vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAuth: () => ({ user: { id: 'u1' } }),
}));

const ROW = {
  id: 'act_1',
  type: 'updated',
  summary: 'updated the lead',
  object_name: 'crm_lead',
  record_id: 'lead_1',
  actor_name: 'Li Si',
  timestamp: '2026-10-10T08:00:00Z',
};

/** When set, the `sys_activity` read rejects with it instead of answering. */
let readError: unknown = null;
const fakeAdapter = {
  find: (object: string) => {
    if (object !== 'sys_activity') return Promise.resolve({ data: [] });
    return readError ? Promise.reject(readError) : Promise.resolve({ data: [ROW] });
  },
  getClient: () => undefined,
};
vi.mock('../../../providers/AdapterProvider', () => ({ useAdapter: () => fakeAdapter }));

const { useHumanActivityFeed, __resetSharedUserFeeds } = await import('../../../hooks/sharedUserFeeds');

const GENERIC_ERROR = 'An unexpected error occurred.';

/** Home's card, fed by Home's cut of the shared feed, with the console's translator. */
function HomeCard() {
  const { t } = useObjectTranslation();
  const activity = useHumanActivityFeed(5);
  return <HomeActivity activity={activity} onViewAll={() => {}} t={t} />;
}

async function mountHome() {
  const Roster = withRoster();
  render(
    <I18nProvider config={{ defaultLanguage: 'en', detectBrowserLanguage: false }}>
      <Roster>
        <HomeCard />
      </Roster>
      <div data-testid="record-panel">
        <RecordActivityTimeline items={[]} activityDenied />
      </div>
    </I18nProvider>,
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  __resetSharedUserFeeds();
  readError = null;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("Home's activity card shows the record panel's permission copy for a refused read (objectui#12843)", () => {
  it('a 403 on sys_activity: the card reads the same sentence the record activity panel shows', async () => {
    readError = Object.assign(new Error("operation 'find' on object 'sys_activity' is not permitted"), {
      httpStatus: 403,
      code: 'PERMISSION_DENIED',
    });
    await mountHome();

    const recordSentence = screen
      .getByTestId('record-panel')
      .querySelector('[data-denied-source="activity"]')?.textContent;
    expect(recordSentence).toBeTruthy();
    const notice = screen.getByTestId('home-activity-access-denied');
    expect(notice).toHaveTextContent(recordSentence as string);
    expect(screen.getByTestId('home-activity-unanswered')).not.toHaveTextContent(GENERIC_ERROR);
    // Not an empty-feed claim either.
    expect(screen.queryByText('No recent activity')).not.toBeInTheDocument();
  });

  it('CONTROL: a 500 keeps the generic failure', async () => {
    readError = Object.assign(new Error('Internal Server Error'), { httpStatus: 500 });
    await mountHome();

    expect(screen.getByTestId('home-activity-unanswered')).toHaveTextContent(GENERIC_ERROR);
    expect(screen.queryByTestId('home-activity-access-denied')).not.toBeInTheDocument();
  });

  it('CONTROL: an answered read renders the feed', async () => {
    await mountHome();

    expect(screen.getAllByTestId('home-activity-row')).toHaveLength(1);
    expect(screen.getByText('Li Si')).toBeInTheDocument();
    expect(screen.queryByTestId('home-activity-unanswered')).not.toBeInTheDocument();
  });
});

describe('the card reads the record panel key, not a sentence of its own (objectui#12843)', () => {
  // A key-echo translator: what the card renders IS the key it asked for.
  const echo = (key: string) => key;

  it('a refused error reading renders `detail.activityAccessDenied`', () => {
    render(
      <HomeActivity
        activity={{ value: [], status: 'error', readable: true, refused: true }}
        onViewAll={() => {}}
        t={echo}
      />,
    );
    expect(screen.getByTestId('home-activity-access-denied')).toHaveTextContent('detail.activityAccessDenied');
  });

  it('an error reading without the refusal renders `errors.unknown`', () => {
    render(<HomeActivity activity={{ value: [], status: 'error', readable: true }} onViewAll={() => {}} t={echo} />);
    expect(screen.getByTestId('home-activity-unanswered')).toHaveTextContent('errors.unknown');
  });
});
