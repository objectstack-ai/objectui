// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * CloudOnboardingNext — the state-aware "next step" block for the Cloud
 * control-plane Welcome page, registered as the SDUI widget
 * `cloud:onboarding-next`.
 *
 * The Welcome page is otherwise static SDUI, but the single most useful thing
 * it can show — "what do I do next?" — depends on live state the metadata can't
 * carry: does the caller's org already have its production environment? New
 * signups are auto-provisioned one, so a static "Step 1: create an environment"
 * is wrong for most first-time users. This widget resolves that one signal from
 * the same `/cloud/environment-entitlements` endpoint the environment list uses
 * and renders the right primary action:
 *
 *   • has production env  → "Open" (the doorway into the env, where
 *                            building happens) + a "Manage environments" link.
 *                            The label names the place in the customer's words,
 *                            not the operator's: a new customer has exactly one
 *                            environment, and "production" is control-plane
 *                            vocabulary (objectui#11659). The destination is
 *                            still the org's production environment.
 *   • no production env   → "Create your environment" (the real first step).
 *   • loading             → a neutral skeleton (no CTA flashes / layout jump).
 *   • unknown / error     → degrade to BOTH actions, so the button always works.
 *
 * Routes and the "Open" endpoint come from the page metadata
 * (`properties`) so the Cloud app owns its URLs; this component owns only the
 * state logic. The signal is read through `useEnvironmentEntitlements`, the
 * resource the pricing page's plan cards and the workspace-timezone notice share,
 * so this block adds no request of its own (objectui#12808). Only the
 * authoritative summary resolves it: the hook's row-derived fallback reads as
 * `unknown` here, exactly as a failed summary always has.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Skeleton } from '@object-ui/components';
import { Rocket, Plus, Settings2 } from 'lucide-react';
import { createAuthenticatedFetch } from '@object-ui/auth';
import { ComponentRegistry } from '@object-ui/core';
import { useObjectTranslation } from '@object-ui/i18n';
import { navRunActionHref } from '../../hooks/useNavRunAction.js';
import { useAdapter } from '../../providers/AdapterProvider.js';
import { useEnvironmentEntitlements } from '../../environment/useEnvironmentEntitlements.js';

interface CloudOnboardingNextProps {
  properties?: {
    /** Backend SSO-open endpoint (full-page nav that 302s into the prod env). */
    openProductionUrl?: string;
    /** SPA route to the environments list (create / open / manage). */
    environmentsRoute?: string;
    /**
     * Name of the action the "Create your environment" CTA deep-links into on
     * that list — the same slot an object nav entry declares as `runAction`.
     * Defaults to `create_environment`, which is the name the Cloud app's
     * transitional pin test guards, so this is safe to ship ahead of the page
     * metadata that will supply it (#5216).
     */
    createAction?: string;
    /**
     * Optional backend pre-warm endpoint. When set and the caller already has
     * a production env, the widget fires a best-effort GET the moment it knows
     * the env exists — nudging a possibly-asleep container awake WHILE the user
     * reads the hint, so the later "Open" click lands in an
     * already-waking env instead of paying the full cold-start. No-op when
     * unset (older page metadata), so this is safe to ship ahead of the page.
     */
    warmUrl?: string;
  };
}

type Resolved =
  | { phase: 'loading' }
  | { phase: 'ready'; hasProductionEnv: boolean }
  | { phase: 'unknown' };

const DEFAULT_OPEN_PRODUCTION_URL = '/api/v1/cloud/environments/production/sso-open';
const DEFAULT_ENVIRONMENTS_ROUTE = '/apps/cloud_control/sys_environment';

/**
 * The environment list's create action. Cloud-owned name, guarded by cloud's
 * transitional pin test (cloud#1048) — kept as the default so page metadata
 * that predates `properties.createAction` still deep-links correctly.
 */
const DEFAULT_CREATE_ACTION = 'create_environment';

/**
 * Resolve `hasProductionEnv` from the org-scoped entitlements summary. Returns
 * `unknown` on any failure so the caller degrades gracefully rather than
 * blocking the user behind a wrong "create" CTA.
 */
function useProductionEnvState(warmUrl?: string): Resolved {
  const dataSource = useAdapter();
  // `useState`, not `useMemo`: the warm effect below keys on this function, so
  // its identity has to be one React guarantees to keep (AGENTS.md #10).
  const [authFetch] = useState(() => createAuthenticatedFetch());
  const apiBase = ((import.meta.env.VITE_SERVER_URL as string | undefined) || '').replace(/\/+$/, '');
  const entitlements = useEnvironmentEntitlements({ enabled: true, dataSource, authFetch, apiBase });

  // Strict: only the authoritative summary resolves the signal (cloud#1046's
  // `{ success, data }` envelope, read by the hook). A row-derived or failed
  // answer is `unknown`, which degrades to both actions and always works.
  const state: Resolved = entitlements === null
    ? { phase: 'loading' }
    : entitlements.source === 'summary'
      ? { phase: 'ready', hasProductionEnv: entitlements.hasProductionEnv }
      : { phase: 'unknown' };

  // Pre-warm the prod env the instant we know it exists — fire-and-forget,
  // best-effort, once per resolve. The user is now reading the hint and will
  // click "Open" seconds later; by then the container is already
  // waking. The sso-open click warms again, so a failed warm here costs
  // nothing. Only when the page passes a warmUrl (else no-op). Keyed on the
  // answer object itself, so each resolution warms once.
  useEffect(() => {
    if (entitlements?.source !== 'summary' || !entitlements.hasProductionEnv || !warmUrl) return;
    void authFetch(`${apiBase}${warmUrl}`, { method: 'GET', credentials: 'include' })
      .catch(() => { /* pre-warm is best-effort */ });
  }, [entitlements, warmUrl, authFetch, apiBase]);

  return state;
}

/** Full-page nav to the backend SSO endpoint so the browser follows its 302. */
function openProduction(url: string) {
  window.location.href = url;
}

export function CloudOnboardingNext({ properties }: CloudOnboardingNextProps) {
  const { t } = useObjectTranslation();
  const navigate = useNavigate();
  const state = useProductionEnvState(properties?.warmUrl);
  const openUrl = properties?.openProductionUrl || DEFAULT_OPEN_PRODUCTION_URL;
  const envsRoute = properties?.environmentsRoute || DEFAULT_ENVIRONMENTS_ROUTE;
  const createAction = properties?.createAction || DEFAULT_CREATE_ACTION;

  // Loading — a neutral skeleton sized like the button row, so the hero doesn't
  // jump when the real CTA lands.
  if (state.phase === 'loading') {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3" data-onboarding="loading">
        <Skeleton className="h-11 w-44 rounded-md" />
        <Skeleton className="h-11 w-44 rounded-md" />
      </div>
    );
  }

  const hint =
    state.phase === 'ready' && !state.hasProductionEnv
      ? t('cloudOnboarding.hintCreate')
      : t('cloudOnboarding.hintReady');

  // No production env yet → the real first step is "create", not "open".
  const showCreatePrimary = state.phase === 'ready' && !state.hasProductionEnv;

  return (
    <div className="flex flex-col items-center gap-3" data-onboarding={state.phase}>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {showCreatePrimary ? (
          // Deep-link straight INTO the create dialog (#844): the environments
          // list consumes the declared `runAction` slot and auto-opens the named
          // action once entitlements resolve — "Create your environment" used to
          // be a plain navigation that left the user hunting for a second create
          // button on the list page.
          //
          // [#5216] Both halves are declared now. The action NAME comes from page
          // metadata (`properties.createAction`, same bag that already owns
          // `environmentsRoute` — the Cloud app owns its URLs and now its deep
          // link too), and the ENCODING comes from `navRunActionHref`, which
          // spells the param through `NAV_RUN_ACTION_PARAM`. What this retires is
          // the hand-concatenated `?runAction=create_environment` literal: a
          // private convention whose only definition was this template string
          // and a matching literal in the toolbar.
          <Button size="lg" onClick={() => navigate(navRunActionHref(envsRoute, createAction))}>
            <Plus className="mr-2 h-4 w-4" />
            {t('cloudOnboarding.createEnvironment')}
          </Button>
        ) : (
          <Button size="lg" onClick={() => openProduction(openUrl)}>
            <Rocket className="mr-2 h-4 w-4" />
            {t('cloudOnboarding.openWorkspace')}
          </Button>
        )}
        <Button size="lg" variant="secondary" onClick={() => navigate(envsRoute)}>
          <Settings2 className="mr-2 h-4 w-4" />
          {t('cloudOnboarding.manageEnvironments')}
        </Button>
      </div>
      <p className="max-w-xl text-center text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

// SDUI registration — the Cloud Welcome page references this widget by type.
ComponentRegistry.register('cloud:onboarding-next', (props: CloudOnboardingNextProps) => (
  <CloudOnboardingNext {...props} />
), {
  namespace: 'app-shell',
  label: 'Cloud Onboarding Next-Step',
  category: 'plugin',
  inputs: [],
});
