/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The `objectui check` refusal and the runtime agree on every registered type
 * (objectui#4795, ruling item 2).
 *
 * The gate refuses a `${…}` on a closed text key its node's type does not
 * evaluate. Both halves ask `expressionBindableTextKeysFor(type)` — but a
 * lookup called with a different type string answers a different question: a
 * gate that stripped `ui:` would grant `ui:card` the `card` row the runtime
 * never applies, and refuse nothing the user then sees as a literal. So this
 * suite does not compare the gate with the lookup. It MEASURES the runtime:
 * every type this build registers is rendered through the real
 * `SchemaRenderer` with all four keys holding an expression, and the keys it
 * left unevaluated must be exactly the keys the gate refuses.
 *
 * ## How the runtime is read
 *
 * This file registers no component, so every type reaches `SchemaRenderer`'s
 * unknown-type fallback, which prints the EVALUATED schema — the object the
 * evaluation memo produced, which is what a registered renderer receives as
 * `schema`. The memo runs before the registry is consulted and keys on the
 * type string alone, so the fallback changes nothing about which keys are
 * evaluated. A type whose render prints no evaluated schema fails by name:
 * a probe that stopped seeing the runtime must not read as agreement.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { SchemaRenderer, PredicateScopeProvider } from '@object-ui/react';
import { EXPRESSION_BINDABLE_TEXT_KEYS, expressionBindableTextKeysFor } from '@objectstack/spec/ui';

import { KNOWN_SCHEMA_TYPES } from '../utils/known-schema-types.js';
import { findUnbindableTextExpressions } from '../utils/unbindable-text-expressions.js';

const EXPR = '${data.total}';
const SCOPE = { data: { total: 99 } };

/** This package's tsconfig carries no DOM lib, so the one DOM read is typed here. */
interface Queryable {
  querySelector(selector: string): { textContent: string | null } | null;
}

/** The four closed keys the runtime evaluated on a node of `type`. */
function evaluatedByRuntime(type: string): string[] {
  const node: Record<string, unknown> = { type };
  for (const key of EXPRESSION_BINDABLE_TEXT_KEYS) node[key] = EXPR;
  const { container } = render(
    <PredicateScopeProvider scope={SCOPE}>
      <SchemaRenderer schema={node as never} />
    </PredicateScopeProvider>,
  );
  const printed = (container as unknown as Queryable).querySelector('pre')?.textContent;
  cleanup();
  if (!printed) {
    throw new Error(`"${type}" rendered no evaluated schema; this probe no longer reads the runtime`);
  }
  const evaluated = JSON.parse(printed) as Record<string, unknown>;
  return EXPRESSION_BINDABLE_TEXT_KEYS.filter((key) => evaluated[key] !== EXPR);
}

/**
 * The four closed keys the gate refuses on the same node, placed under a
 * parent's `children` so it is judged as a component node whatever its type —
 * `page` included, whose document-root position is sub-rule (i)'s exclusion
 * and is pinned in the refusal suite, not here.
 */
function refusedByGate(type: string): string[] {
  const node: Record<string, unknown> = { type };
  for (const key of EXPRESSION_BINDABLE_TEXT_KEYS) node[key] = EXPR;
  return findUnbindableTextExpressions({ type: 'div', children: [node] })
    .filter((finding) => finding.severity === 'refusal')
    .map((finding) => finding.key);
}

describe('objectui check and SchemaRenderer agree on every registered type', () => {
  it('refuses exactly the keys the runtime leaves unevaluated', () => {
    const disagreements: string[] = [];
    const evaluatingTypes: string[] = [];
    for (const type of KNOWN_SCHEMA_TYPES) {
      const evaluated = evaluatedByRuntime(type);
      if (evaluated.length > 0) evaluatingTypes.push(type);
      const unevaluated = EXPRESSION_BINDABLE_TEXT_KEYS.filter((key) => !evaluated.includes(key));
      const refused = refusedByGate(type);
      if (JSON.stringify(refused) !== JSON.stringify(unevaluated)) {
        disagreements.push(
          `${type}: runtime left [${unevaluated.join(', ')}] unevaluated, gate refused [${refused.join(', ')}]`,
        );
      }
    }
    expect(disagreements).toEqual([]);

    // The control that makes the table two-sided: the runtime DID evaluate
    // something, on exactly the registered types the carriage map has a row
    // for. Without it, a probe that saw no evaluation anywhere would agree
    // with a gate that refused everything.
    expect(evaluatingTypes.length).toBeGreaterThan(0);
    expect(evaluatingTypes).toEqual(
      KNOWN_SCHEMA_TYPES.filter((type) => expressionBindableTextKeysFor(type).length > 0),
    );
  });

  it('keys on the type string verbatim: a namespaced spelling gets no row at either end', () => {
    expect(expressionBindableTextKeysFor('card').length).toBeGreaterThan(0);
    expect(evaluatedByRuntime('ui:card')).toEqual([]);
    expect(refusedByGate('ui:card')).toEqual([...EXPRESSION_BINDABLE_TEXT_KEYS]);
  });
});
