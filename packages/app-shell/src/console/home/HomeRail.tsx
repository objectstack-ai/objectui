/**
 * HomeRail
 *
 * Dashboard cards for the Home work-dashboard:
 *   - HomeActionCenter — "what needs me" (approvals + inbox notifications);
 *     the reason a business user opens Home, so it leads the page.
 *   - HomeContinue     — recent items, compact "pick up where you left off".
 *   - HomeActivity     — recent human activity feed (ambient context).
 *
 * Each renders a graceful empty state so a quiet workspace still looks
 * intentional rather than broken.
 *
 * @module
 */
import {
  CheckSquare, ArrowRight, CheckCheck, Bell,
  FileText, Database, LayoutDashboard, File, List, CircleAlert,
} from 'lucide-react';
import { useDisplayLocale } from '@object-ui/i18n';
import type { ActivityFeedReading } from '../../hooks/sharedUserFeeds.js';
import type { HomeInboxStatus, HomeNotification } from '../../hooks/useHomeInbox.js';
import type { RecentItem } from '../../hooks/useRecentItems.js';
import type { RecentItemLabelResolver } from '../../hooks/useRecentItemLabel.js';
import { ActivityObjectLabel } from '../../layout/ActivityObjectLabel.js';
import { timeAgo } from '../../utils/relativeTime.js';
import { getIcon } from '../../utils/getIcon.js';

type TFn = (key: string, opts?: any) => string;

function Card({
  icon: Icon,
  title,
  count,
  accent,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count?: number;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={
        'rounded-2xl bg-card/80 backdrop-blur-sm p-4 ' +
        (accent ? 'border border-primary/30' : 'border border-border/70')
      }
    >
      <div className="mb-3 flex items-center gap-2">
        <Icon className={'h-4 w-4 ' + (accent ? 'text-primary' : 'text-muted-foreground')} />
        <h2 className="flex-1 text-sm font-semibold tracking-tight">{title}</h2>
        {typeof count === 'number' && count > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground tabular-nums">
            {count}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function Row({
  icon: Icon,
  iconClass,
  label,
  meta,
  trailing,
  onClick,
  testId,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  label: string;
  meta?: string;
  trailing?: React.ReactNode;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        data-testid={testId}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-muted/60 active:scale-[0.99]"
      >
        <span className={'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ' + iconClass}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm">{label}</span>
        {meta && <span className="shrink-0 text-[11px] text-muted-foreground">{meta}</span>}
        {trailing}
      </button>
    </li>
  );
}

/**
 * "You're all caught up" is an ASSERTION about the user's inbox, so it may only
 * be made once the inbox has answered (#4235).
 *
 * `notifications` arriving empty says nothing on its own: until #4235 the hook
 * behind it swallowed every failed read to `[]`, so a `403 PERMISSION_DENIED`
 * on `sys_inbox_message` (objectstack#7344, browser-measured for every non-admin
 * persona) reached this component wearing the exact shape of an empty inbox —
 * and the panel cheerfully told a user with nine unread messages that there was
 * nothing to do, with no badge. `notificationsStatus` is the missing bit, and
 * gating on it is why that pair is now unreachable: an unanswered read renders
 * the quiet notice below, never the affirmative copy.
 *
 * Same rule #4300 landed for the app list ("an unloadable app list is UNKNOWN,
 * not 'no default app'"), and the same status vocabulary.
 */
export function HomeActionCenter({
  pendingApprovalsCount,
  notifications,
  unreadTopicCount,
  notificationsStatus,
  onOpenApprovals,
  onOpenNotification,
  t,
}: {
  pendingApprovalsCount: number;
  /** The PREVIEW: newest-first, one row per title, capped by `useHomeInbox`. */
  notifications: HomeNotification[];
  /**
   * The TOTAL waiting in the inbox — every unread topic, not just the ones this
   * card has room for (#4329).
   *
   * Required, and separate from `notifications` for the same reason
   * `notificationsStatus` is: `notifications.length` was the badge until this
   * card learned the difference, which made the badge report the size of a
   * capped list. Nine unread showed "9" on the bell and "5" here, on one page,
   * about one set of rows. A call site that cannot say how much is waiting must
   * not be able to badge its own preview length by saying nothing.
   */
  unreadTopicCount: number;
  /**
   * Required, not optional-with-a-default: a call site that cannot say whether
   * its rows are an answer must not be able to reach the affirmative copy by
   * saying nothing.
   */
  notificationsStatus: HomeInboxStatus;
  onOpenApprovals: () => void;
  onOpenNotification: (n: HomeNotification) => void;
  t: TFn;
}) {
  // Relative times read the DISPLAY locale, never the UI language
  // (objectui#10668), as the Marketplace's and Studio home's already do.
  const displayLocale = useDisplayLocale();
  // "How much needs you", which is the question the badge asks and the question
  // the bell answers with the same number. The list below is a preview of it —
  // fewer rows than this whenever the cap or the title fold bites, and that
  // gap is the point rather than a defect: badge = total, list = preview.
  const total = pendingApprovalsCount + unreadTopicCount;
  const answered = notificationsStatus === 'ready';
  return (
    <Card icon={CheckSquare} accent count={total} title={t('home.actionCenter.title', { defaultValue: 'Needs your attention' })}>
      {/*
        Rendered ALONGSIDE the list, not only instead of it: when approvals are
        known and the inbox read failed, the panel is showing half an answer,
        and saying so is the same honesty the empty case owes.
      */}
      {!answered && (
        <div
          className="flex items-center gap-2 py-2 text-sm text-muted-foreground"
          data-testid="home-action-unanswered"
        >
          {notificationsStatus === 'error' ? (
            <>
              <CircleAlert className="h-4 w-4 text-amber-500" />
              {t('errors.unknown', { defaultValue: 'An unexpected error occurred.' })}
            </>
          ) : (
            t('common.loading', { defaultValue: 'Loading…' })
          )}
        </div>
      )}
      {/*
        Gated on the TOTAL, not on the rows on show: "You're all caught up" is a
        claim about the inbox, so it may only be made when the inbox is empty —
        never merely because this card had nothing renderable to list. (The one
        state where the two differ is an unread message with no title at all,
        which the list cannot render: the card then shows its badge and no row,
        rather than telling the user they are caught up while the bell above
        badges the same message.)
      */}
      {total === 0 ? (
        answered && (
          <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
            <CheckCheck className="h-4 w-4 text-emerald-500" />
            {t('home.actionCenter.empty', { defaultValue: "You're all caught up" })}
          </div>
        )
      ) : (
        <ul className="flex flex-col gap-0.5">
          {pendingApprovalsCount > 0 && (
            <Row
              icon={CheckSquare}
              iconClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
              label={t('notifications.approvalsPending', { defaultValue: '{{count}} pending approvals', count: pendingApprovalsCount })}
              trailing={<ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
              onClick={onOpenApprovals}
              testId="home-action-approvals"
            />
          )}
          {notifications.map((n) => (
            <Row
              key={n.id}
              icon={Bell}
              iconClass="bg-primary/10 text-primary"
              label={n.title}
              meta={timeAgo(n.createdAt, displayLocale)}
              onClick={() => onOpenNotification(n)}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

/**
 * A Home section with its heading above the card rather than inside it — the
 * "Recently accessed" and "Activity feed" columns (objectui#12604): a 15 px /
 * 600 heading, 8 px above a bordered card.
 */
function HomeSection({ title, testId, children }: { title: string; testId: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0" data-testid={testId}>
      <h2 className="mb-2 text-[15px] font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

/**
 * The kind icon of a "Recently accessed" row (objectui#12604): a record draws
 * its object's icon (the {@link RecentItemContext.icon} the page resolved), and
 * every other kind draws its own.
 */
const RECENT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  object: Database,
  view: List,
  record: FileText,
  dashboard: LayoutDashboard,
  page: File,
};

/**
 * What a "Recently accessed" row prints beside its title (objectui#12604),
 * resolved by the page that has the metadata — this module reads none (see
 * {@link HomeContinue}).
 */
export interface RecentItemContext {
  /**
   * The trail's first part: a record's object label ("Account"), or the
   * entry's kind ("Dashboard", "List view") for every other kind.
   */
  context: string;
  /** The label of the app the entry was opened in, or `undefined` when no app on Home is it. */
  app?: string;
  /** A record's object icon (a Lucide name), or `undefined` to draw the kind's icon. */
  icon?: string;
}

/**
 * Home's "Recently accessed" column (objectui#12604): up to six 40 px rows,
 * newest first, each a 24 px kind icon tile, the title, and a muted trail
 * "Account · HotCRM · 10 minutes ago" — the context, the app, and when it was
 * opened, in the DISPLAY locale (objectui#10668).
 *
 * `labelOf` is `useRecentItemLabel()` and `describe` is the page's trail
 * resolver, handed in like `t`: an entry stores identity, not text, so its
 * label is resolved on the render, in the current language (objectui#11678).
 * Taken as props so this module — which also holds the action center and the
 * activity card — does not itself load the metadata cache they read. The one
 * read it does make is the activity card's: `ActivityObjectLabel` reads the
 * cached object list, and only while an activity row is on screen
 * (objectui#12238).
 */
export function HomeContinue({
  items,
  onOpen,
  t,
  labelOf,
  describe,
}: {
  items: RecentItem[];
  onOpen: (href: string) => void;
  t: TFn;
  labelOf: RecentItemLabelResolver;
  describe: (item: RecentItem) => RecentItemContext;
}) {
  const displayLocale = useDisplayLocale();
  return (
    <HomeSection title={t('home.recentApps.title', { defaultValue: 'Recently Accessed' })} testId="home-recent">
      {items.length === 0 ? (
        <p className="rounded-lg border border-border bg-card px-3 py-2.5 text-[13px] text-muted-foreground">
          {t('home.continueEmpty', { defaultValue: 'Items you open will show up here.' })}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-lg border border-border bg-card">
          {items.map((it) => {
            const { context, app, icon } = describe(it);
            const Icon = icon ? getIcon(icon) : RECENT_ICON[it.type] || FileText;
            const trail = [context, app, timeAgo(it.visitedAt, displayLocale)].filter(Boolean).join(' · ');
            return (
              <li key={it.id} className="border-t border-border first:border-t-0">
                <button
                  type="button"
                  onClick={() => onOpen(it.href)}
                  data-testid="home-recent-row"
                  data-recent-type={it.type}
                  className="flex h-10 w-full items-center gap-2.5 px-3 text-left text-[13px] transition-colors hover:bg-muted/60"
                >
                  <span
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
                    data-testid="home-recent-icon"
                    data-icon={icon ?? it.type}
                  >
                    <Icon className="h-[13px] w-[13px]" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{labelOf(it)}</span>
                  <span className="shrink-0 text-xs text-muted-foreground" data-testid="home-recent-trail">
                    {trail}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </HomeSection>
  );
}

/**
 * Home's activity card. Takes the feed's whole reading, not its rows
 * (objectui#12081): "No recent activity" is an ASSERTION about the feed, made
 * only once it has answered — the rule `HomeActionCenter` above applies to
 * the inbox (#4235). The rows alone could not tell a refused `sys_activity`
 * read from an empty feed, so every non-admin was told there was none.
 *
 * Renders nothing for a caller who may not read `sys_activity`
 * (`readable: false`): no card, no empty claim, and no drill into a list page
 * that answers them `403`. `HomePage` drops the column with it.
 *
 * A row names its object through `ActivityObjectLabel`, the component the
 * bell's Activity tab renders for the same row (objectui#12238): the label in
 * the reader's language, the API name only when none resolves.
 *
 * Laid out as Home's section ④ (objectui#12604): the heading above a card with
 * 12 px padding; each row the actor (13 px / 500), the verb and target muted,
 * and a 12 px line of time and object; "View all activity →" the last row.
 */
export function HomeActivity({ activity, onViewAll, t }: { activity: ActivityFeedReading; onViewAll: () => void; t: TFn }) {
  // The display locale, as `HomeActionCenter` above (objectui#10668).
  const displayLocale = useDisplayLocale();
  if (!activity.readable) return null;
  const items = activity.value;
  return (
    <HomeSection title={t('sidebar.activityFeed', { defaultValue: 'Activity feed' })} testId="home-activity">
      <div className="rounded-lg border border-border bg-card px-3 pb-2 pt-1">
        {/* Beside the list, not only in place of it, as on the action centre. */}
        {activity.status !== 'ready' && (
          <div
            className="flex items-center gap-2 py-2 text-[13px] text-muted-foreground"
            data-testid="home-activity-unanswered"
          >
            {activity.status === 'error' ? (
              <>
                <CircleAlert className="h-4 w-4 text-amber-500" />
                {t('errors.unknown', { defaultValue: 'An unexpected error occurred.' })}
              </>
            ) : (
              t('common.loading', { defaultValue: 'Loading…' })
            )}
          </div>
        )}
        {items.length === 0 ? (
          activity.status === 'ready' && (
            <p className="py-2 text-[13px] text-muted-foreground">
              {t('layout.activityFeed.empty', { defaultValue: 'No recent activity' })}
            </p>
          )
        ) : (
          <ul>
            {items.slice(0, 5).map((a) => (
              <li key={a.id} className="border-b border-border py-2 text-[13px] leading-snug" data-testid="home-activity-row">
                <span className="font-medium">{a.user}</span>{' '}
                <span className="text-muted-foreground">{a.description}</span>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {timeAgo(a.timestamp, displayLocale)} · <ActivityObjectLabel objectName={a.objectName} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={onViewAll}
          className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {t('layout.activityFeed.viewAll', { defaultValue: 'View all activity' })}
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </HomeSection>
  );
}
