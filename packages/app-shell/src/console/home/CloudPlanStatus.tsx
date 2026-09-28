// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * CloudPlanStatus — the "current plan" marker for one plan card on the Cloud
 * control plane's pricing page, registered as the SDUI widget
 * `cloud:plan-status` (objectui#10919).
 *
 * The pricing page is static metadata: nothing in its expression scope carries
 * the organization's plan, so a page cannot tell which of its cards is the one
 * the organization is already on. The plan is only available from the
 * org-scoped `GET /cloud/environment-entitlements` summary (`data.plan`). This
 * widget reads that summary and answers one question for the card it is placed
 * on: is this card's plan the organization's plan?
 *
 *   • the summary names this card's plan → a localized "Current plan" badge;
 *   • the summary names another plan      → nothing;
 *   • loading, failed, or no summary      → nothing. The plan is never guessed:
 *     only the authoritative summary (`source: 'summary'`) can mark a card, and
 *     the row-derived fallback carries no plan at all.
 *
 * ## One node per card, and the page names the card
 *
 * The plan code a card stands for is the page's, not this widget's: the plan
 * catalog belongs to the control plane, so the page passes its own code in
 * `properties.plan` (the `properties` bag is the spelling every page component
 * is authored in) and the widget compares it VERBATIM with `data.plan`. No
 * code is listed, normalized or defaulted here.
 *
 * ## The summary is read through `useEnvironmentEntitlements`
 *
 * The same hook the environment list uses — one reading of the endpoint and its
 * strict `{ success, data }` envelope, not a third copy of the fetch. It is
 * enabled unconditionally here because this widget exists only to read it.
 */

import { useState } from 'react';
import { Badge, cn } from '@object-ui/components';
import { createAuthenticatedFetch } from '@object-ui/auth';
import { ComponentRegistry } from '@object-ui/core';
import { useObjectTranslation } from '@object-ui/i18n';
import { useAdapter } from '../../providers/AdapterProvider.js';
import { useEnvironmentEntitlements } from '../../environment/useEnvironmentEntitlements.js';

export interface CloudPlanStatusProps {
  properties?: {
    /**
     * The plan code of the card this node sits on, exactly as the control
     * plane's entitlements summary spells it (for example `free`).
     */
    plan?: string;
  };
  /** Carries the scope class of the node's `responsiveStyles`. */
  className?: string;
}

export function CloudPlanStatus({ properties, className }: CloudPlanStatusProps) {
  const { t } = useObjectTranslation();
  const dataSource = useAdapter();
  // `useState`, not `useMemo`: the hook keys its fetch effect on this function,
  // so its identity has to be one React guarantees to keep (AGENTS.md #10).
  const [authFetch] = useState(() => createAuthenticatedFetch());
  const entitlements = useEnvironmentEntitlements({
    enabled: true,
    dataSource,
    authFetch,
    apiBase: (import.meta.env.VITE_SERVER_URL as string | undefined) || '',
  });

  const plan = properties?.plan;
  const isCurrent =
    typeof plan === 'string'
    && plan !== ''
    && entitlements?.source === 'summary'
    && entitlements.plan === plan;
  if (!isCurrent) return null;

  return (
    <Badge variant="secondary" className={cn(className)} data-plan-status="current">
      {t('cloudPlanStatus.current')}
    </Badge>
  );
}

// SDUI registration — the Cloud pricing page places one node per plan card.
// Registered under the `cloud` namespace with no bare fallback, so the one key
// is `cloud:plan-status`: the spelling the page authors, and the one literal
// its `@object-ui/types` arm claims (`CloudPlanStatusSchema`).
ComponentRegistry.register('plan-status', (props: CloudPlanStatusProps) => (
  <CloudPlanStatus {...props} />
), {
  namespace: 'cloud',
  skipFallback: true,
  label: 'Cloud Plan Status',
  category: 'plugin',
  inputs: [],
});
