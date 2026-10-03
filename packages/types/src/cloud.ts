/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @object-ui/types - Cloud Widget Schemas
 *
 * The TypeScript twin of `zod/cloud.zod.ts` (objectui#11515).
 *
 * @module cloud
 * @packageDocumentation
 */

import type { BaseSchema } from './base.js';

/**
 * `cloud:plan-status` — the "current plan" marker for one plan card, the SDUI
 * widget `@object-ui/app-shell` registers for the Cloud pricing page: the
 * TypeScript twin of `zod/cloud.zod.ts`'s `CloudPlanStatusSchema`
 * (objectui#11515).
 *
 * The zod arm landed with the registration (objectui#10919) and no
 * declaration here, so no TypeScript type named the node. This interface
 * declares the same members, read from the widget's read points: the arm's
 * module header gives them, because `@objectstack/spec` has no
 * `ComponentPropsMap` row for a `cloud:` widget.
 *
 *  - `properties.plan` — the plan code of the card the node sits on, written
 *    in the `properties` bag, the one spelling the widget reads. Required.
 *    The arm also refuses an empty string (`.min(1)`), a value check this
 *    type cannot state.
 *  - `properties` holds that one key and no other: the arm's bag is strict.
 *  - Neither content channel is read, so both are refused by name, the twin
 *    of the arm's two `retirementTombstone` members.
 *
 * The parity pair is `cloud.zod.ts#CloudPlanStatusSchema` in
 * `__tests__/zod-mirror-parity.test.ts`. The widget's own props type stays in
 * `@object-ui/app-shell`.
 */
export interface CloudPlanStatusSchema extends BaseSchema {
  type: 'cloud:plan-status';
  /** The props bag: `plan`, and no other key. */
  properties: {
    /**
     * The plan code of the card this node marks, spelled exactly as the
     * control plane's entitlements summary reports it (for example `free`).
     * The badge renders only when it equals the organization's plan.
     */
    plan: string;
  };
  /**
   * REFUSED BY NAME (objectui#10919) — `cloud:plan-status` reads neither
   * content channel: `CloudPlanStatus` reads only `properties.plan` and
   * `className`, and `SchemaRenderer` strips both channels out of the props
   * it spreads.
   *
   * @deprecated Not a channel `cloud:plan-status` reads — nothing renders it.
   */
  body?: never;
  /**
   * REFUSED BY NAME (objectui#10919), for the reason `body` gives.
   *
   * @deprecated Not a channel `cloud:plan-status` reads — nothing renders it.
   */
  children?: never;
}
