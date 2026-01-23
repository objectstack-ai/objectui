/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ComponentRegistry } from '@object-ui/core';
import type { CarouselSchema } from '@object-ui/types';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselPrevious, 
  CarouselNext 
} from '../../ui';
import { renderChildren } from '../../lib/utils';

ComponentRegistry.register('carousel', 
  ({ schema, className, ...props }: { schema: CarouselSchema; className?: string; [key: string]: any }) => (
    <Carousel 
      opts={schema.opts} 
      orientation={schema.orientation || 'horizontal'}
      className={className} 
      {...props}
    >
      <CarouselContent>
        {schema.items?.map((item: any, index: number) => (
          <CarouselItem key={index} className={schema.itemClassName}>
             {renderChildren(item)}
          </CarouselItem>
        ))}
      </CarouselContent>
      {schema.showArrows && (
        <>
            <CarouselPrevious />
            <CarouselNext />
        </>
      )}
    </Carousel>
  ),
  {
    label: 'Carousel',
    inputs: [
      { name: 'orientation', type: 'enum', enum: ['horizontal', 'vertical'], defaultValue: 'horizontal', label: 'Orientation' },
      { name: 'showArrows', type: 'boolean', label: 'Show Arrows', defaultValue: true },
      { 
        name: 'items', 
        type: 'array', 
        label: 'Items',
        description: 'Array of content schemas'
      },
      { name: 'itemClassName', type: 'string', label: 'Item CSS Class' },
      { name: 'className', type: 'string', label: 'Container CSS Class' }
    ],
    defaultProps: {
      orientation: 'horizontal',
      showArrows: true,
      items: [
        [{ type: 'div', className: 'p-4 sm:p-6 md:p-8 border rounded bg-slate-50', body: [{ type: 'text', content: 'Slide 1' }] }],
        [{ type: 'div', className: 'p-4 sm:p-6 md:p-8 border rounded bg-slate-50', body: [{ type: 'text', content: 'Slide 2' }] }],
        [{ type: 'div', className: 'p-4 sm:p-6 md:p-8 border rounded bg-slate-50', body: [{ type: 'text', content: 'Slide 3' }] }]
      ],
      className: 'w-full max-w-xs'
    }
  }
);
