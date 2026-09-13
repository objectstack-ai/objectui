/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { SchemaRenderer } from "@object-ui/react"
import React from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * The ONE emptiness predicate for a `SchemaNode` slot (objectui#9162).
 *
 * A node slot's published zod face carries a `z.number()` arm
 * (`nodeUnionOptions`, `packages/types/src/zod/base.zod.ts`), so `children: 0`
 * is legal authored input — and React RENDERS numbers. Truthiness is therefore
 * the rule a node slot states: every falsy value (`0`, `-0`, `NaN`, `''`,
 * `false`, `null`, `undefined`) means "this slot has no content", plus the
 * empty array, which has no content either.
 *
 * ⛔ Not a nullish test. `0` is not "absent"; it is present and renders
 * nothing, which is the distinction objectui#8331 kept deliberately and
 * objectui#9033 kept again: truthiness makes the slot's answer independent of
 * `toRenderableSchema`, and that independence is what kept the sibling slot out
 * of the defect while the bridge was wrong.
 *
 * ⛔ Not a `typeof === 'object'` test either. objectui#7105 ruled that node
 * slots RELAX the renderer rather than narrow the declaration — a bare string
 * is a legal node and renders as its own text.
 */
export function isEmptyNodeSlot(slot: unknown): boolean {
  if (!slot) return true;
  return Array.isArray(slot) && slot.length === 0;
}

/**
 * Render a `SchemaNode` slot that lives inside chrome which must disappear
 * along with it — `<CardFooter>`, `<DialogFooter>`, a wrapping `<div>`.
 *
 * This exists because the obvious spelling is a trap:
 *
 * ```tsx
 * {schema.footer && <CardFooter>{renderChildren(schema.footer)}</CardFooter>}
 * ```
 *
 * `&&` does not evaluate to `false` when the slot is falsy — it evaluates to
 * the SLOT, and React paints `0`. Worse, `&&` short-circuits, so
 * `renderChildren`'s own `if (isEmptyNodeSlot) return null` first leg is never
 * reached and the bridge repair of objectui#8908 cannot help either. The class
 * was patched one instance at a time three times (objectui#8331 →
 * objectui#9033 → the eleven of objectui#9162) before it was closed here.
 *
 * `render` receives the slot itself, not a pre-rendered node, because some
 * call sites render it with extra context (`<SchemaRenderer schema={…}
 * data={data} />` in `plugin-detail`). It is invoked ONLY when the slot has
 * content, so the chrome and the content appear and disappear together.
 *
 * A slot with NO chrome does not need this — call `renderChildren(slot)`
 * directly, which is the same guard with nothing wrapped around it. The rule
 * `object-ui/no-bare-node-slot-guard` refuses the `&&` spelling so that these
 * two remain the only two.
 */
export function renderNodeSlot<T>(
  slot: T,
  render: (slot: NonNullable<T>) => React.ReactNode,
): React.ReactNode {
  if (isEmptyNodeSlot(slot)) return null;
  return render(slot as NonNullable<T>);
}

export function renderChildren(children: any): React.ReactNode {
  // The guard — reachable now that no caller short-circuits ahead of it
  // (objectui#9162). `0`, `-0`, `NaN`, `''`, `false` and `[]` all mean
  // "no content", and none of them may reach the DOM.
  if (isEmptyNodeSlot(children)) return null;
  if (typeof children === 'string' || typeof children === 'number') {
    return children;
  }
  if (Array.isArray(children)) {
    // Unwrap single child to support Radix UI 'asChild' pattern which expects a single ReactElement, not an array
    if (children.length === 1) {
      return <SchemaRenderer schema={children[0]} />; 
    }
    return children.map((child, index) => (
      <SchemaRenderer key={child.id || index} schema={child} />
    ));
  }
  return <SchemaRenderer schema={children} />;
}

