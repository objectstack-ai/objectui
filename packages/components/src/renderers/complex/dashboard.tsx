/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ComponentRegistry } from '@object-ui/core';
import type { DashboardSchema } from '@object-ui/types';
import { SchemaRenderer } from '@object-ui/react';
import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const DashboardRenderer = forwardRef<HTMLDivElement, { schema: DashboardSchema; className?: string; [key: string]: any }>(
  ({ schema, className, ...props }, ref) => {
    const columns = schema.columns || 3;
    const gap = schema.gap || 4;

    return (
      <div 
        ref={ref} 
        className={cn("grid", className)} 
        style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gap: gap * 4 // Assuming tailwind scale
        }}
        {...props}
      >
        {schema.widgets?.map((widget) => (
            <div 
                key={widget.id} 
                className={cn("border rounded-lg p-4 bg-card text-card-foreground shadow-sm")}
                style={widget.layout ? {
                    gridColumn: `span ${widget.layout.w}`,
                    gridRow: `span ${widget.layout.h}`
                }: undefined}
            >
                {widget.title && <h3 className="font-semibold mb-2">{widget.title}</h3>}
                <SchemaRenderer schema={widget.component} />
            </div>
        ))}
      </div>
    );
  }
);

ComponentRegistry.register(
  'dashboard',
  DashboardRenderer,
  {
    label: 'Dashboard',
    category: 'Complex',
    icon: 'layout-dashboard',
    inputs: [
      { name: 'columns', type: 'number', label: 'Columns', defaultValue: 3 },
      { name: 'gap', type: 'number', label: 'Gap', defaultValue: 4 },
      { name: 'className', type: 'string', label: 'CSS Class' }
    ],
    defaultProps: {
        columns: 3,
        widgets: []
    }
  }
);
