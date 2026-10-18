/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @object-ui/types/zod - Cloud Widget Zod Validators
 *
 * The arm for `@object-ui/app-shell`'s armed `cloud:` SDUI widget:
 * `cloud:workspace-timezone-notice`, for the Cloud welcome page
 * (`console/home/CloudWorkspaceTimezoneNotice.tsx`, objectui#11930).
 *
 * ## Why the arm lands with the registration
 *
 * `AnyComponentSchema` refuses a registered type it has no arm for, with one
 * `invalid_union` issue at `type`, so a page placing the widget could not pass
 * `safeValidateSchema` or `objectui validate`. The count of registered types
 * still refused there is ratcheted by
 * `packages/cli/src/__tests__/registered-types-validate-ratchet-10859.test.ts`,
 * which never rises, so the registration and this arm ship together.
 *
 * ## Declared here, measured from the widget's read points
 *
 * `@objectstack/spec` has no `ComponentPropsMap` row for a `cloud:` widget, so
 * nothing is read by reference: the members below are the keys the widget
 * reads, and no other.
 *
 * `cloud:workspace-timezone-notice`:
 *
 *   - `properties` — optional and EMPTY: the widget reads no key of the bag.
 *     The zone it prints comes from the organization's entitlements summary,
 *     never from the page, so there is nothing for the node to author. The
 *     closed, empty bag is `element:divider`'s spelling for a node with no
 *     prop (`public-blocks.zod.ts`).
 *   - `body` / `children` — refused by name. The widget renders one line of
 *     its own copy and reads neither content channel.
 *
 * ⛔ No `.default()` anywhere in this module — see the "authors no default"
 * note in `index.zod.ts`.
 *
 * @module zod/cloud
 * @packageDocumentation
 */

import { z } from 'zod';
import { BaseSchema } from './base.zod.js';
import { retirementTombstone } from './tombstone.zod.js';

/** One refusal string for both content channels of `CloudWorkspaceTimezoneNoticeSchema`. */
const CLOUD_WORKSPACE_TIMEZONE_NOTICE_NEITHER_CHANNEL =
  'REFUSED (objectui#11930) — `cloud:workspace-timezone-notice` reads NEITHER content channel: its '
  + 'registration hands the node to `CloudWorkspaceTimezoneNotice`, which reads only `className`, and '
  + '`SchemaRenderer` strips both channels out of the props bag it spreads. An authored value would '
  + 'render NOTHING — no render-time error or warning and no element; only the parser tier\'s '
  + '`not-a-container` warning (objectui#9910) noticed it, because the registration declares no '
  + '`children` input. What it renders instead: one line naming the timezone the workspace was seeded '
  + 'with, read from the organization\'s entitlements summary, and nothing when the summary carries no seed.';

/**
 * `cloud:workspace-timezone-notice` — the welcome page's line naming the
 * workspace's seeded timezone (objectui#11930). Pinned by
 * `../__tests__/cloud-workspace-timezone-notice-arm-11930.test.ts`.
 */
export const CloudWorkspaceTimezoneNoticeSchema = BaseSchema.extend({
  type: z.literal('cloud:workspace-timezone-notice'),
  properties: z
    .strictObject({})
    .optional()
    .describe(
      'The `cloud:workspace-timezone-notice` props bag — the widget reads no prop, so the only bag it '
      + 'accepts is `{}`. The zone it names comes from the organization\'s entitlements summary.',
    ),
  body: retirementTombstone(CLOUD_WORKSPACE_TIMEZONE_NOTICE_NEITHER_CHANNEL),
  children: retirementTombstone(CLOUD_WORKSPACE_TIMEZONE_NOTICE_NEITHER_CHANNEL),
});
