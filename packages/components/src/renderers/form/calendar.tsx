/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ComponentRegistry, toDisplayDate } from '@object-ui/core';
import type { CalendarSchema } from '@object-ui/types';
import { Calendar } from '../../ui';

/**
 * The selected-date read (objectui#10293). JSON authors an ISO 8601 string
 * and `DayPicker` compares `Date`s, so a string is coerced here, through the
 * shared parse step: a date-only string is rebuilt at LOCAL midnight of the
 * day it names, where the engine's own parse read it as UTC midnight and
 * selected the day before west of UTC (the objectui#10183 convention). Any
 * other value — a `Date`, or nothing — reaches `DayPicker` unchanged.
 */
function toSelected(value: unknown): unknown {
  return typeof value === 'string' ? toDisplayDate(value) : value;
}

ComponentRegistry.register('calendar', 
  ({ schema, className, ...props }: { schema: CalendarSchema; className?: string; [key: string]: any }) => (
    <Calendar
      mode={(schema.mode || "single") as any}
      selected={toSelected(schema.value || schema.defaultValue) as any}
      className={className}
      {...props}
    />
  ),
  {
    namespace: 'ui',
    // `calendar` collides with the plugin-calendar full CRUD calendar VIEW,
    // which owns the bare `type: 'calendar'` schema keyword; this date-picker
    // primitive is reached via `ui:calendar` only.
    skipFallback: true,
    label: 'Calendar',
    inputs: [
      { name: 'mode', type: 'enum', enum: ['default', 'single', 'multiple', 'range'] },
      { name: 'className', type: 'string' }
    ],
    defaultProps: {
      mode: 'single',
      className: 'rounded-md border'
    }
  }
);
