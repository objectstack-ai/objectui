/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { resolveNotificationTarget } from './appRoute.js';

/**
 * The first path segments the console serves OUTSIDE an app — the top-level
 * routes of `apps/console/src/App.tsx` (plus `/studio`, which that file mounts
 * through `studioRoutes`), the empty segment being the landing route `/`.
 * `apps` is not listed: `resolveNotificationTarget` already passes `/apps/…`
 * through as a console route.
 *
 * Why an action navigator needs the list and the inbox does not
 * (objectui#13379): a notification's `action_url` is app-relative by contract,
 * so everything the resolver does not recognise is a record. An action
 * runner's navigator is that runner's ONE navigator — `onSuccess.navigate`,
 * `type: 'url'` / `navigation` targets and `type: 'form'` all reach it — and
 * the runner itself hands it the console route `/forms/:name`
 * (`ActionRunner.executeForm`). Hosting that under an app would turn a working
 * form route into `/apps/<app>/forms/<name>`, which the app router reads as a
 * record of an object named `forms`.
 *
 * Two navigators read it: the console action runtime's
 * (`useConsoleActionRuntime`, objectui#13379) and the record page's own
 * (`RecordDetailView`, objectui#13396), whose `ActionProvider` shadows the
 * console runtime for every action on the record page.
 *
 * `useConsoleActionRuntime.onSuccessNavigateHost-13379.test.tsx` reads that
 * route table and fails on a top-level route missing here. A route a host adds
 * outside that file is not read by it.
 */
export const CONSOLE_ROOT_SEGMENTS: ReadonlySet<string> = new Set([
  '',
  'accept-invitation',
  'ai',
  'auth',
  'dev',
  'docs',
  'f',
  'forgot-password',
  'forms',
  'home',
  'login',
  'oauth',
  'organizations',
  'register',
  'reset-password',
  's',
  'set-password',
  'setup',
  'studio',
  'system',
  'verify-email',
  'verify-email-prompt',
]);

/**
 * Where an in-place hop handed to an action navigator lands (objectui#13379).
 *
 * A rooted path that names no console route outside an app — the
 * `onSuccess: { navigate: '/crm_opportunity/${result.id}' }` shape — is
 * app-relative, and is hosted under `hostAppSegment` by the inbox's resolver,
 * `resolveNotificationTarget`, the one place that sorts the three shapes
 * (external, already `/apps/…`, app-relative). Handed to the router verbatim,
 * it matched no route under the `/_console` basename and the catch-all sent
 * the user to Home.
 *
 * Left exactly as written: a console route outside an app (see
 * {@link CONSOLE_ROOT_SEGMENTS}), and a `./` path, which react-router resolves
 * against the current route. Anything not rooted at `/` — a scheme such as
 * `mailto:` or `https:` included — is returned unchanged too.
 */
export function hostInConsolePath(url: string, hostAppSegment: string): string {
  if (!url.startsWith('/')) return url;
  const firstSegment = url.slice(1).split(/[/?#]/, 1)[0];
  if (CONSOLE_ROOT_SEGMENTS.has(firstSegment)) return url;
  const target = resolveNotificationTarget(url, hostAppSegment);
  return target?.kind === 'route' ? target.path : url;
}
