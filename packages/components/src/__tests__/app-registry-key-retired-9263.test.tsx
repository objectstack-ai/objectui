/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `app` is an app DOCUMENT type, never an SDUI registry key (objectui#9263).
 *
 * ## The defect this closes
 *
 * `PageRenderer` used to be registered under five names, `app` among them, and
 * `AppComponentSchema` declares the very same `type: 'app'` for something else
 * entirely — a whole application's configuration, read by the runner/layout
 * path (`packages/runner/src/App.tsx`, `packages/layout/src/AppSchemaRenderer.tsx`).
 * One name, two live channels, and neither declaration mentioned the other.
 *
 * The failure was SILENT, which is what made it worth a ruling. An author — a
 * human following the published `AppComponentSchema`, or an AI following it —
 * would write a node against that declaration, hand it to `SchemaRenderer`, and
 * be served `PageRenderer`, which reads the unrelated `PageNodeSchema`. Every
 * key they authored was ignored, `tsc` was green, nothing threw, and the page
 * just came out missing things.
 *
 * ⭐ The registration did not even deliver the layout its `label: 'App Page'`
 * advertised. `PageRenderer` derives its layout from `schema.pageType`, which
 * defaults to `'record'` and is NEVER derived from `schema.type` — so
 * `{ type: 'app' }` rendered a RECORD page. That is why removing the key costs
 * no rendering capability: the app layout was only ever reachable through
 * `pageType`, and it still is.
 *
 * Maintainer ruling 2026-09-15, option A on objectui#9263: remove the
 * registration; page-shaped nodes are `page`; `app` stays the app-document
 * type, untouched.
 *
 * ## Both directions are pinned here, because only the pair is the contract
 *
 * A pin on the refusal alone would stay green if someone "fixed" it by retiring
 * `AppComponentSchema` — which would be the opposite repair, and one the ruling
 * refused by name (the app-document channel has a measured consumer surface and
 * is not on the table). A pin on the document channel alone would stay green if
 * the registration came back. So:
 *
 *   A. an authored `{ type: 'app' }` handed to `SchemaRenderer` is REFUSED with
 *      the OBJUI-001 "Unknown component type" panel;
 *   B. the app-DOCUMENT channel still accepts the same spelling, unchanged.
 *
 * Each direction carries a firing control in the same pass, because a zero from
 * a harness that renders nothing and a zero from a real refusal are the same
 * zero.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActionProvider, SchemaRenderer } from '@object-ui/react';
import { ComponentRegistry } from '@object-ui/core';
import { AppComponentSchema } from '@object-ui/types/zod';
// Module scope, not a hook: this import IS the registration under test. A cold
// `await import()` inside a hook is billed to `hookTimeout` and races the
// assertions (AGENTS.md §测试纪律, objectui#3010).
import '../renderers';

/** The node an author following `AppComponentSchema` would hand to the renderer. */
const authoredAppNode = (type: string) =>
  ({
    type,
    name: 'acme_crm',
    label: 'Acme CRM',
    template: 'default',
    regions: [
      {
        name: 'main',
        width: 'large',
        components: [{ type: 'element:text', properties: { text: 'body marker' } }],
      },
    ],
  }) as never;

const renderNode = (type: string) =>
  render(
    <ActionProvider>
      <SchemaRenderer schema={authoredAppNode(type)} />
    </ActionProvider>,
  );

describe("A. `type: 'app'` is refused by SchemaRenderer (objectui#9263)", () => {
  it('is not a key the registry knows', () => {
    // The structural half. `getKnownTypes()` is the same enumeration
    // `SchemaRenderer` resolves against and the same one the JSX manifest is
    // built from, so this is the registry's own answer, not a source grep.
    const known = new Set(ComponentRegistry.getKnownTypes());

    expect(known.has('app')).toBe(false);

    // FIRING CONTROL — the four surviving registrations of the SAME renderer,
    // asserted in the same pass. Without them an empty or unloaded registry
    // would satisfy the assertion above for entirely the wrong reason.
    for (const surviving of ['page', 'home', 'utility', 'record']) {
      expect(known.has(surviving), `\`${surviving}\` must stay registered`).toBe(true);
    }
  });

  it('paints the OBJUI-001 panel instead of silently serving PageRenderer', () => {
    renderNode('app');

    // The behavioural half: what an author actually sees. Asserted on the
    // panel's role and its named type rather than on class names, because the
    // alert IS the refusal — an author who gets a rendered page instead has
    // hit the defect this file exists to stop.
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Unknown component type');
    expect(alert).toHaveTextContent('app');

    // The error code the ruling names. It is rendered outside production only,
    // which is the environment a test runs in.
    expect(alert).toHaveTextContent('OBJUI-001');

    // …and the authored body never reached the page. This is the part that was
    // silent before: the old registration DID render, just from the wrong
    // declaration, so "something appeared" was never evidence of correctness.
    expect(screen.queryByText('body marker')).toBeNull();
  });

  it("FIRING CONTROL: the identical node spelled `type: 'page'` still renders", () => {
    // Same fixture, same harness, one character class different. If this went
    // red the refusal above would be measuring a broken render path rather than
    // a removed registration.
    renderNode('page');

    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('body marker')).toBeInTheDocument();
  });
});

describe('B. the app-DOCUMENT channel is unchanged (objectui#9263)', () => {
  it("still accepts `type: 'app'` on the document it declares", () => {
    // `AppComponentSchema` is the runner/layout channel's declaration. The
    // ruling touches the registry only; this is the half that proves it.
    const appDocument = {
      type: 'app',
      name: 'acme_crm',
      title: 'Acme CRM',
      layout: 'sidebar',
      menu: [{ type: 'item', label: 'Dashboard', icon: 'layout-dashboard', path: '/dashboard' }],
    };

    const result = AppComponentSchema.safeParse(appDocument);

    // A full green parse, not merely an absence of unrecognised keys: the
    // question here is whether the document is still VALID, and a schema that
    // had stopped reading `type` at all would pass a keys-only assertion.
    expect(result.success, JSON.stringify(result.error?.issues ?? [], null, 2)).toBe(true);
    expect(result.success && result.data.type).toBe('app');
  });

  it('FIRING CONTROL: the same schema still rejects a document it should reject', () => {
    // Proves the parser is doing work. A schema stubbed to accept everything
    // would satisfy the assertion above and this one would go red.
    const notAnApp = { type: 'page', name: 'acme_crm' };

    expect(AppComponentSchema.safeParse(notAnApp).success).toBe(false);
  });
});
