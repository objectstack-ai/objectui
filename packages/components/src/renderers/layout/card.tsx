/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ComponentRegistry } from '@object-ui/core';
import type { CardSchema } from '@object-ui/types';
import { renderChildren, renderNodeSlot, cn } from '../../lib/utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '../../ui';
import { forwardRef } from 'react';

// Index signature on the parameter annotation, not on the `forwardRef` type
// argument — mechanism note on `action:bar` (objectui#4422), pinned by
// `__tests__/forwardref-props-annotation.guard.test.ts`.
const CardRenderer = forwardRef<HTMLDivElement, { schema: CardSchema; className?: string }>(
  ({ schema, className, ...props }: { schema: CardSchema; className?: string; [key: string]: any }, ref) => {
    // Extract designer-related props
    const { 
        'data-obj-id': dataObjId, 
        'data-obj-type': dataObjType,
        style, 
        ...cardProps 
    } = props;
    
    const isClickable = schema.clickable || !!props.onClick;
    const isHoverable = schema.hoverable || isClickable;

    // Node slots are rendered THROUGH the guard, never guarded by themselves
    // (objectui#9162). `&&` evaluates to the slot, not to `false`, and the
    // published validator admits a number in a node slot — so
    // `{schema.header && …}` painted a stray "0" for a legal authored
    // `header: 0`. `renderChildren` returns `null` for every falsy slot, so
    // `header !== null` is the honest "does this header have content" test;
    // `title`/`description` are declared `string` and are not node slots.
    const header = renderChildren(schema.header);
    return (
    <Card 
        ref={ref}
        className={cn(
          className, 
          isHoverable && "transition-colors hover:bg-muted/50",
          isClickable && "cursor-pointer active:bg-muted"
        )} 
        {...cardProps}
        // Apply designer props
        {...{ 'data-obj-id': dataObjId, 'data-obj-type': dataObjType, style }}
    >
      {(schema.title || schema.description || header !== null) && (
        <CardHeader>
          {schema.title && <CardTitle>{schema.title}</CardTitle>}
          {schema.description && <CardDescription>{schema.description}</CardDescription>}
          {header}
        </CardHeader>
      )}
      {/* `||` here is ALIAS RESOLUTION — `body` is the legacy spelling of
          `children` — and ⛔ it is no longer the guard. That distinction is
          the whole point: `children: 0` used to be converted away by the
          accident of `0 || undefined === undefined`, which protected nothing,
          because the sibling `body: 0` went through `undefined || 0 === 0`
          and leaked. `renderNodeSlot` covers both; the alias order is
          unchanged. */}
      {renderNodeSlot(schema.children || schema.body, (body) => (
        <CardContent>{renderChildren(body)}</CardContent>
      ))}
      {renderNodeSlot(schema.footer, (footer) => (
        <CardFooter className="flex justify-between">{renderChildren(footer)}</CardFooter>
      ))}
    </Card>
    );
  }
);

ComponentRegistry.register('card', 
  CardRenderer,
  {
    namespace: 'ui',
    label: 'Card',
    inputs: [
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'className', type: 'string' }
    ],
    defaultProps: {
      title: 'Card Title',
      description: 'Card description goes here',
      className: 'w-full'
    },
    isContainer: true,
    resizable: true,
    resizeConstraints: {
      width: true,
      height: true,
      minWidth: 200,
      minHeight: 100
    }
  }
);
