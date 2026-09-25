/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Where an action NODE's static execution values come from (objectui#10289).
 *
 * An action's `params` has exactly one meaning: the `ActionParam[]` list of
 * inputs to collect from the user before the action runs. That is what
 * `UIActionSchema.params` declares ("always an `ActionParam[]`"), and what
 * `@objectstack/spec` 17.4.0's `ActionSchema.params` declares while refusing
 * the object form by name. The SDUI node envelope (`PageComponentSchema`)
 * declares no node-level `params` key at all.
 *
 * Static values a handler reads (`navigate_edit`'s `objectName` / `recordId`,
 * say) therefore ride the node's already-declared config bag, as
 * `properties.params`. `SchemaRenderer` template-evaluates every string leaf
 * of that bag (objectui#10282), so `"recordId": "${record.id}"` resolves on a
 * record page.
 *
 * The maintainer's ruling on objectui#10289 (letter A, 2026-09-25): `params`
 * never carries two shapes, and no new value-bag key is declared. So an OBJECT
 * written at node level under `params` — the shape the record-edit guide used
 * to teach — is not read as values. It is ignored, and a development build
 * says so once per action, naming `properties.params` as the home (AGENTS.md
 * #0.1: one strict contract; the renderer does not make off-contract metadata
 * work).
 *
 * Why the renderer reads `schema.properties.params` itself instead of the
 * hoisted `schema.params`: `SchemaRenderer` copies every `properties.*` value
 * onto the node, so after the hoist `schema.params` could be either spelling.
 * `action:bar` mounts its members without `SchemaRenderer` (no hoist at all).
 * Reading the bag directly answers the same on both paths, and the identity
 * check below tells a hoisted copy (same object) from a node-level object.
 */

import { isConfigBag } from '@object-ui/react';

/** The two keys this module reads off an action node. */
export interface StaticParamsSubject {
  params?: unknown;
  properties?: unknown;
  name?: unknown;
  label?: unknown;
}

// Warn once per action, not once per click: the same node is clicked
// repeatedly, and a warning that floods the console is one that gets muted.
const warned = new Set<string>();

/** Reset the warn-once memo. Exported for tests. */
export function resetStaticParamsWarnings(): void {
  warned.clear();
}

function warnNodeLevelObjectParams(subject: StaticParamsSubject, where: string): void {
  if (process.env.NODE_ENV === 'production') return;
  const name = String(subject.name ?? subject.label ?? '(unnamed)');
  const memo = `${where}:${name}`;
  if (warned.has(memo)) return;
  warned.add(memo);
  console.warn(
    `[${where}] action "${name}" carries an OBJECT under node-level \`params\`; it is ignored. ` +
      '`params` is only the `ActionParam[]` list of inputs to collect from the user. ' +
      'Put static execution values under `properties.params` instead ' +
      '(for a `type: "api"` request payload, use `bodyExtra`). See objectui#10289.',
  );
}

/**
 * The static values to forward as the runner's `ActionDef.params`: the node's
 * `properties.params` when it is an object bag, otherwise `undefined`.
 *
 * A node-level OBJECT `params` that is not the hoisted `properties.params` is
 * never returned; it triggers the development warning above.
 */
export function readStaticParamValues(
  subject: StaticParamsSubject,
  where: string,
): Record<string, unknown> | undefined {
  const properties = subject.properties;
  const values =
    isConfigBag(properties) && isConfigBag(properties.params)
      ? (properties.params as Record<string, unknown>)
      : undefined;
  const nodeLevel = subject.params;
  if (isConfigBag(nodeLevel) && nodeLevel !== values) {
    warnNodeLevelObjectParams(subject, where);
  }
  return values;
}
