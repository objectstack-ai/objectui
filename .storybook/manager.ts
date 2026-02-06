import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming/create';

const objectUITheme = create({
  base: 'light',

  // Brand
  brandTitle: 'ObjectUI — Server-Driven UI Engine',
  brandUrl: 'https://github.com/objectstack-ai/objectui',
  brandTarget: '_self',

  // Colors
  colorPrimary: '#6366f1',
  colorSecondary: '#6366f1',

  // UI
  appBg: '#fafafa',
  appContentBg: '#ffffff',
  appPreviewBg: '#ffffff',
  appBorderColor: '#e5e7eb',
  appBorderRadius: 8,

  // Text
  textColor: '#1f2937',
  textInverseColor: '#ffffff',
  textMutedColor: '#6b7280',

  // Toolbar
  barTextColor: '#6b7280',
  barSelectedColor: '#6366f1',
  barHoverColor: '#4f46e5',
  barBg: '#ffffff',

  // Form
  inputBg: '#ffffff',
  inputBorder: '#d1d5db',
  inputTextColor: '#1f2937',
  inputBorderRadius: 6,

  // Font
  fontBase: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
  fontCode: '"JetBrains Mono", "Fira Code", monospace',
});

addons.setConfig({
  theme: objectUITheme,
  sidebar: {
    showRoots: true,
    collapsedRoots: ['apps'],
  },
  toolbar: {
    zoom: { hidden: false },
    eject: { hidden: false },
    copy: { hidden: false },
  },
});
