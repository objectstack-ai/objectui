/**
 * Predefined JSON schema examples for the Object UI Playground
 * Organized by category to showcase different capabilities
 */

import { primitives } from './examples/primitives';
import { layouts } from './examples/layouts';
import { forms } from './examples/forms';
import { dataDisplay } from './examples/data-display';
import { complex } from './examples/complex';

export const examples = {
  ...primitives,
  ...layouts,
  ...forms,
  ...dataDisplay,
  ...complex
};

export type ExampleKey = keyof typeof examples;

export const exampleCategories = {
  'Primitives': ['simple-page', 'input-states', 'button-variants'],
  'Layouts': ['grid-layout', 'dashboard', 'tabs-demo'],
  'Data Display': ['calendar-view', 'enterprise-table', 'data-table-simple'],
  'Forms': ['form-demo', 'airtable-form'],
  'Complex': ['kanban-board']
};
