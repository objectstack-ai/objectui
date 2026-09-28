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
 * The arm for `cloud:plan-status`, the SDUI widget `@object-ui/app-shell`
 * registers for the Cloud pricing page (`console/home/CloudPlanStatus.tsx`,
 * objectui#10919).
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
 *   - `properties.plan` — the plan code of the card the node sits on. The page
 *     authors it in the `properties` bag, the one spelling a page component is
 *     written in, and the widget reads it there alone. Required: a node that
 *     names no plan can never mark anything. It is an opaque, non-empty
 *     string, because the plan catalog belongs to the control plane; ObjectUI
 *     does not list the codes.
 *   - `properties` is closed: the widget reads no other key of the bag.
 *   - `body` / `children` — refused by name. The widget renders a badge and
 *     reads neither content channel (objectui#9256's rule for such nodes).
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

/** One refusal string for both content channels of `CloudPlanStatusSchema`. */
const CLOUD_PLAN_STATUS_NEITHER_CHANNEL =
  'REFUSED (objectui#10919) — `cloud:plan-status` reads NEITHER content channel: its registration hands '
  + 'the node to `CloudPlanStatus`, which reads only `properties.plan` and `className`, and '
  + '`SchemaRenderer` strips both channels out of the props bag it spreads. An authored value would '
  + 'render NOTHING — no render-time error or warning and no element; only the parser tier\'s '
  + '`not-a-container` warning (objectui#9910) noticed it, because the registration declares no '
  + '`children` input. What it renders instead: a "Current plan" badge when `properties.plan` is the '
  + 'organization\'s plan, and nothing otherwise.';

/**
 * `cloud:plan-status` — the "current plan" marker for one plan card
 * (objectui#10919). Pinned by `../__tests__/cloud-plan-status-arm-10919.test.ts`.
 */
export const CloudPlanStatusSchema = BaseSchema.extend({
  type: z.literal('cloud:plan-status'),
  properties: z
    .strictObject({
      plan: z
        .string()
        .min(1)
        .describe(
          'The plan code of the card this node marks, spelled exactly as the control plane\'s '
          + 'entitlements summary reports it (for example `free`). The badge renders only when it equals '
          + 'the organization\'s plan.',
        ),
    })
    .describe('The `cloud:plan-status` props bag: `plan`, and no other key.'),
  body: retirementTombstone(CLOUD_PLAN_STATUS_NEITHER_CHANNEL),
  children: retirementTombstone(CLOUD_PLAN_STATUS_NEITHER_CHANNEL),
});
