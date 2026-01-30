/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @object-ui/types - Theme Schema
 * 
 * Defines theme configuration for dynamic theme switching and customization.
 */

import type { BaseSchema } from './base';

/**
 * Color Palette Definition
 */
export interface ColorPalette {
  /**
   * Primary brand color
   */
  primary?: string;

  /**
   * Secondary color
   */
  secondary?: string;

  /**
   * Accent color
   */
  accent?: string;

  /**
   * Background color
   */
  background?: string;

  /**
   * Foreground/text color
   */
  foreground?: string;

  /**
   * Muted color (for less prominent elements)
   */
  muted?: string;

  /**
   * Muted foreground color
   */
  mutedForeground?: string;

  /**
   * Border color
   */
  border?: string;

  /**
   * Input border color
   */
  input?: string;

  /**
   * Ring/focus color
   */
  ring?: string;

  /**
   * Success color
   */
  success?: string;

  /**
   * Warning color
   */
  warning?: string;

  /**
   * Error/destructive color
   */
  destructive?: string;

  /**
   * Info color
   */
  info?: string;

  /**
   * Card background color
   */
  card?: string;

  /**
   * Card foreground color
   */
  cardForeground?: string;

  /**
   * Popover background color
   */
  popover?: string;

  /**
   * Popover foreground color
   */
  popoverForeground?: string;
}

/**
 * Typography Configuration
 */
export interface Typography {
  /**
   * Font family for sans-serif text
   */
  fontSans?: string[];

  /**
   * Font family for serif text
   */
  fontSerif?: string[];

  /**
   * Font family for monospace text
   */
  fontMono?: string[];

  /**
   * Base font size (in rem)
   */
  fontSize?: number;

  /**
   * Line height
   */
  lineHeight?: number;

  /**
   * Font weight for headings
   */
  headingWeight?: number;

  /**
   * Font weight for body text
   */
  bodyWeight?: number;
}

/**
 * Spacing Scale Configuration
 */
export interface SpacingScale {
  /**
   * Base spacing unit (in rem)
   */
  base?: number;

  /**
   * Custom spacing values
   */
  scale?: Record<string, string>;
}

/**
 * Border Radius Configuration
 */
export interface BorderRadius {
  /**
   * Small radius
   */
  sm?: string;

  /**
   * Default radius
   */
  default?: string;

  /**
   * Medium radius
   */
  md?: string;

  /**
   * Large radius
   */
  lg?: string;

  /**
   * Extra large radius
   */
  xl?: string;
}

/**
 * Theme Mode
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Complete Theme Definition
 */
export interface ThemeDefinition {
  /**
   * Theme name/identifier
   */
  name: string;

  /**
   * Theme display label
   */
  label?: string;

  /**
   * Light mode color palette
   */
  light?: ColorPalette;

  /**
   * Dark mode color palette
   */
  dark?: ColorPalette;

  /**
   * Typography configuration
   */
  typography?: Typography;

  /**
   * Spacing scale configuration
   */
  spacing?: SpacingScale;

  /**
   * Border radius configuration
   */
  radius?: BorderRadius;

  /**
   * Custom CSS variables
   */
  cssVariables?: Record<string, string>;

  /**
   * Tailwind configuration overrides
   */
  tailwind?: Record<string, any>;
}

/**
 * Theme Schema - Theme configuration and switching
 */
export interface ThemeSchema extends BaseSchema {
  type: 'theme';

  /**
   * Current theme mode
   */
  mode?: ThemeMode;

  /**
   * Available themes
   */
  themes?: ThemeDefinition[];

  /**
   * Active theme name
   */
  activeTheme?: string;

  /**
   * Allow user theme switching
   */
  allowSwitching?: boolean;

  /**
   * Persist theme preference
   */
  persistPreference?: boolean;

  /**
   * Storage key for persisting theme
   */
  storageKey?: string;
}

/**
 * Theme Switcher Component Schema
 */
export interface ThemeSwitcherSchema extends BaseSchema {
  type: 'theme-switcher';

  /**
   * Switcher variant
   */
  variant?: 'dropdown' | 'toggle' | 'buttons';

  /**
   * Show mode selector (light/dark)
   */
  showMode?: boolean;

  /**
   * Show theme selector
   */
  showThemes?: boolean;

  /**
   * Icon for light mode
   */
  lightIcon?: string;

  /**
   * Icon for dark mode
   */
  darkIcon?: string;
}

/**
 * Theme Preview Component Schema
 */
export interface ThemePreviewSchema extends BaseSchema {
  type: 'theme-preview';

  /**
   * Theme to preview
   */
  theme?: ThemeDefinition;

  /**
   * Preview mode
   */
  mode?: ThemeMode;

  /**
   * Show color palette
   */
  showColors?: boolean;

  /**
   * Show typography samples
   */
  showTypography?: boolean;

  /**
   * Show component samples
   */
  showComponents?: boolean;
}
