/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * approverValueSources — the approver value bindings as the SERVER publishes
 * them, read the same way by both approval readers: the flow designer's
 * approver value picker (`FlowReferenceField`) and the console's approver
 * labels (`approverIdentity` / `useApproverDirectory`).
 *
 * ## The registry arm (objectui#7611 Q3b, ruled objectstack#22865 Q3b → B)
 *
 * The spec's `ApproverValueBinding` is a union, and its projection
 * `APPROVER_VALUE_SOURCES` is what reaches a renderer. Its `data` member names a
 * ROW of a directory object (`user` / `team` / `department`). objectstack#22710
 * added a `registry` member, `{ source: 'registry', type }`: the value is the
 * machine NAME of an item of metadata `type`, its candidates are listed by
 * `GET /api/v1/meta/<type>`, and a picker commits the item's `name` — a catalog
 * item has no row id (ADR-0131 D4). `position` is bound that way.
 *
 * objectui's installed spec predates that member, yet two consoles already
 * receive it:
 *  - a console bundled with the server's own spec injected
 *    (`OBJECTSTACK_SPEC_DIST`, the console objectstack ships), where
 *    `APPROVER_VALUE_SOURCES.position` IS the registry member; and
 *  - a console talking to such a server, whose approval node schema publishes
 *    the same projection as `xRef.sources`.
 * Both readers kept only the `data` member and dropped the rest, so a position
 * approver lost its designer picker and its readable label.
 *
 * Nothing here says which kinds are registry-backed: every answer is read off
 * the published binding, so a kind the spec moves is followed with no edit
 * here, and the `data` member is read exactly as before.
 *
 * ## LOOSENED FOR SPEC 17 — remove when objectui moves to spec 18
 *
 * {@link ApproverValueSource} widens the installed spec's type with
 * {@link RegistryValueSource} so a reader can test for the member at all.
 * Once the installed spec declares it, the widening is redundant: read
 * `APPROVER_VALUE_SOURCES` directly and drop {@link PUBLISHED_APPROVER_VALUE_SOURCES}.
 * `approverValueSources.test.ts` turns red on that bump to say so. This module
 * only READS what the server publishes; no authoring surface is touched, so
 * `objectui validate` and the strict faces are unchanged.
 */

import { APPROVER_VALUE_SOURCES } from '@objectstack/spec/automation';

/**
 * The registry member of the spec's approver value binding (objectstack#22710):
 * the value is the machine name of an item of metadata `type`.
 */
export interface RegistryValueSource {
  source: 'registry';
  /** The metadata type to list — singular, as the meta API spells it (`position`). */
  type: string;
}

/**
 * One entry of `APPROVER_VALUE_SOURCES`, widened with the registry member the
 * installed spec's type predates. LOOSENED FOR SPEC 17 — see this module's
 * docstring for when it goes.
 */
export type ApproverValueSource =
  | (typeof APPROVER_VALUE_SOURCES)[keyof typeof APPROVER_VALUE_SOURCES]
  | RegistryValueSource;

/**
 * `APPROVER_VALUE_SOURCES`, typed so the registry member is expressible. The
 * VALUE is the bundled spec's own object, unchanged: under an injected spec it
 * already carries the registry member, under the installed one it does not.
 */
export const PUBLISHED_APPROVER_VALUE_SOURCES: Readonly<Record<string, ApproverValueSource>> =
  APPROVER_VALUE_SOURCES;

/**
 * Read one binding as the registry member, or `undefined`.
 *
 * A registry entry with no usable `type` is not a registry entry: a picker that
 * lists nothing would be the failure this binding exists to end, so the caller
 * stays on whatever it would have done without it.
 */
export function registryValueSourceOf(raw: unknown): RegistryValueSource | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const s = raw as { source?: unknown; type?: unknown };
  return s.source === 'registry' && typeof s.type === 'string' && s.type
    ? { source: 'registry', type: s.type }
    : undefined;
}

/** Approver kind → the metadata type its value names, for every registry-bound kind in `sources`. */
export function registryTypesOf(sources: Readonly<Record<string, unknown>>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(sources).flatMap(([kind, source]) => {
      const registry = registryValueSourceOf(source);
      return registry ? [[kind, registry.type]] : [];
    }),
  );
}

/**
 * The registry-bound approver kinds of the bundled spec, kind → metadata type.
 * Empty under the installed spec 17.7.0; `{ position: 'position' }` under a
 * spec carrying objectstack#22710.
 */
export const APPROVER_REGISTRY_TYPES: Readonly<Record<string, string>> =
  registryTypesOf(PUBLISHED_APPROVER_VALUE_SOURCES);
