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

/**
 * The props a Radix primitive's `*Trigger` needs in order to accept every value
 * its authored node slot already admits (objectui#9710; the same defect was
 * repaired one instance at a time on objectui#9701).
 *
 * `asChild` resolves a Radix primitive to its `Slot`, which merges its props
 * onto its child by way of `React.Children.only` — a SINGLE React element, and
 * nothing else. A node slot admits far more than that: the published
 * `SchemaNode` union names `string`, `number`, `boolean`, `null` and
 * `undefined` beside `BaseSchema`, and the trigger keys add an ARRAY of nodes
 * on top. So an unconditional `asChild` over `renderChildren(schema.trigger)`
 * asserts a precondition neither published face ever promised, and every value
 * that misses it THREW: `trigger: 'Show more'` — the most natural thing to
 * write for something called a trigger — validated on both faces and then
 * landed the whole node in `SchemaRenderer`'s error boundary, with no
 * diagnostic naming the key.
 *
 * The predicate asks RADIX's question — "is this one element?" — and ⛔ not
 * `typeof === 'string'`. A multi-node trigger array and an empty slot's `null`
 * are that same structural mismatch wearing different values, so they are
 * answered on the same arm. Where `Slot` cannot serve, the primitive renders
 * its OWN element around the returned content, so a bare string paints as the
 * trigger's text and stays a real trigger; where it CAN serve, the merge is
 * unchanged.
 *
 * ⛔ Widens no published face. `packages/types` states the accept set and is
 * untouched by this; the implementation is catching up to a declaration that
 * already said yes — the direction objectui#7105 ruled for node slots, which
 * RELAX the renderer rather than narrow the declaration.
 *
 * Spread it onto the trigger, so the slot is rendered ONCE and the predicate
 * reads the very node that is then handed over:
 *
 * ```tsx
 * <DialogTrigger {...asChildSlotProps(schema.trigger)} />
 * ```
 *
 * ⚠️ A helper is only reached by an author who calls it, so it is not what
 * keeps the next overlay key out of this defect. That is
 * `overlay-trigger-bare-string-9710.test.tsx`, which enumerates the REGISTRY
 * for blocks declaring a `trigger` slot rather than naming files, and so covers
 * a ninth key on the day it registers one, whatever spelling it reached for.
 */
export function asChildSlotProps(slot: unknown): {
  asChild: boolean;
  children: React.ReactNode;
} {
  const children = renderChildren(slot);
  return { asChild: React.isValidElement(children), children };
}

