/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ComponentRegistry } from '@object-ui/core';
import type { ContextMenuSchema } from '@object-ui/types';
import { 
  ContextMenu, 
  ContextMenuTrigger, 
  ContextMenuContent, 
  ContextMenuItem, 
  ContextMenuLabel, 
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuShortcut
} from '../../ui';
import { renderChildren } from '../../lib/utils';

// Reuse helper for recursive menu items if I could share it, but for now duplicate concise logic
const renderContextMenuItems = (items: any[]) => {
  if (!items) return null;
  return items.map((item: any, i: number) => {
    if (item.type === 'separator') return <ContextMenuSeparator key={i} />;
    if (item.type === 'label') return <ContextMenuLabel key={i}>{item.label}</ContextMenuLabel>;
    if (item.children) {
        return (
            <ContextMenuSub key={i}>
                <ContextMenuSubTrigger inset={item.inset}>
                    {item.label}
                </ContextMenuSubTrigger>
                <ContextMenuSubContent>
                    {renderContextMenuItems(item.children)}
                </ContextMenuSubContent>
            </ContextMenuSub>
        )
    }
    
    return (
      <ContextMenuItem key={i} disabled={item.disabled} inset={item.inset} onSelect={item.onSelect}>
        {item.label}
        {item.shortcut && <ContextMenuShortcut>{item.shortcut}</ContextMenuShortcut>}
      </ContextMenuItem>
    );
  });
};

ComponentRegistry.register('context-menu', 
  ({ schema, className, ...props }: { schema: ContextMenuSchema; className?: string; [key: string]: any }) => {
    // Determine classes
    const triggerClass = schema.triggerClassName || className || (schema.className as string) || "h-[120px] w-full sm:h-[150px] sm:w-[300px] border border-dashed text-sm flex items-center justify-center";
    const contentClass = schema.contentClassName;

    return (
    <ContextMenu modal={schema.modal} {...props}>
      <ContextMenuTrigger asChild>
          {/* Usually a Right Click area */}
          <div className={triggerClass}>
             {renderChildren(schema.trigger || { type: 'text', value: "Right click here" })}
          </div>
      </ContextMenuTrigger>
      <ContextMenuContent className={contentClass}>
         {renderContextMenuItems(schema.items)}
      </ContextMenuContent>
    </ContextMenu>
  )},
  {
    label: 'Context Menu',
    inputs: [
      { 
        name: 'trigger', 
        type: 'slot', 
        label: 'Trigger Area',
      },
      { name: 'triggerClassName', type: 'string', label: 'Trigger Area Class' },
      { 
        name: 'items', 
        type: 'array', 
        label: 'Items',
        description: 'Recursive structure: { type?: "separator"|"label", label, shortcut, children }'
      },
      { name: 'className', type: 'string', label: 'Content CSS Class' }
    ],
    defaultProps: {
      items: [
        { label: 'Action 1' },
        { label: 'Action 2' },
        { type: 'separator' },
        { label: 'Action 3' }
      ],
      trigger: [{ type: 'text', content: 'Right click here' }]
    }
  }
);
