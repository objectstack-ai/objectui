/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ComponentRegistry } from '@object-ui/core';
import type { DrawerSchema } from '@object-ui/types';
import { 
  Drawer, 
  DrawerTrigger, 
  DrawerContent, 
  DrawerHeader, 
  DrawerFooter, 
  DrawerTitle, 
  DrawerDescription,
  DrawerClose
} from '../../ui';
import { renderChildren, renderNodeSlot } from '../../lib/utils';

ComponentRegistry.register('drawer', 
  ({ schema, className, ...props }: { schema: DrawerSchema; className?: string; [key: string]: any }) => (
    <Drawer shouldScaleBackground={schema.shouldScaleBackground} defaultOpen={schema.defaultOpen} {...props}>
      <DrawerTrigger asChild>
        {renderChildren(schema.trigger)}
      </DrawerTrigger>
      <DrawerContent className={className}>
        <DrawerHeader>
          {schema.title && <DrawerTitle>{schema.title}</DrawerTitle>}
          {schema.description && <DrawerDescription>{schema.description}</DrawerDescription>}
        </DrawerHeader>
        {renderChildren(schema.content)}
{/* ⛔ No `&&` guard on a node slot (objectui#9162): `&&` evaluates to the
            slot, so a legal authored `footer: 0` painted the character "0" —
            and it short-circuits, so `renderChildren`'s own falsy leg never
            ran. `renderNodeSlot` runs the wrapper only when the slot has
            content, so the chrome disappears with it. */}
        {renderNodeSlot(schema.footer, (footer) => (
          <DrawerFooter>
             {renderChildren(footer)}
             {/* `showClose` is a declared BOOLEAN, not a node slot — its `&&`
                 is not the objectui#9162 construct and stays. Its coupling to
                 `footer` is pre-existing behaviour and is unchanged here. */}
             {schema.showClose && <DrawerClose asChild><button type="button">Close</button></DrawerClose>}
          </DrawerFooter>
        ))}
      </DrawerContent>
    </Drawer>
  ),
  {
    namespace: 'ui',
    label: 'Drawer',
    inputs: [
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
       { name: 'shouldScaleBackground', type: 'boolean' },
        { name: 'defaultOpen', type: 'boolean' },
       { name: 'showClose', type: 'boolean' },
      { 
        name: 'trigger', 
        type: 'slot'      },
      { 
        name: 'content', 
        type: 'slot'      },
       { 
        name: 'footer', 
        type: 'slot'      },
      { name: 'className', type: 'string' }
    ],
    defaultProps: {
      title: 'Drawer Title',
      description: 'Drawer description',
      trigger: [{ type: 'button', label: 'Open Drawer' }],
      content: [{ type: 'text', content: 'Drawer content goes here' }]
    }
  }
);
