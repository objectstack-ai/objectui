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
 * Defines theme configuration aligned with @objectstack/spec.
 * Provides the complete design token system: colors, typography,
 * spacing, borders, shadows, breakpoints, animation, z-index.
 *
 * @module theme
 * @packageDocumentation
 */

import type { BaseSchema } from './base';

// ============================================================================
// Spec-Aligned Theme Sub-types
// ============================================================================

/**
 * Color Palette Definition
 * Aligned with @objectstack/spec ColorPalette.
 *
 * Semantic color tokens for brand customization.
 * `primary` is the only required field.
 */
export interface ColorPalette {
  /** Primary brand color (required) */
  primary: string;
  /** Secondary brand color */
  secondary?: string;
  /** Accent color */
  accent?: string;
  /** Success/positive color */
  success?: string;
  /** Warning/caution color */
  warning?: string;
  /** Error/danger color */
  error?: string;
  /** Informational color */
  info?: string;
  /** Page background color */
  background?: string;
  /** Surface/card background color */
  surface?: string;
  /** Primary text color */
  text?: string;
  /** Secondary/muted text color */
  textSecondary?: string;
  /** Default border color */
  border?: string;
  /** Disabled state color */
  disabled?: string;
  /** Lighter variant of primary */
  primaryLight?: string;
  /** Darker variant of primary */
  primaryDark?: string;
  /** Lighter variant of secondary */
  secondaryLight?: string;
  /** Darker variant of secondary */
  secondaryDark?: string;
}

/**
 * Typography Configuration
 * Aligned with @objectstack/spec Typography.
 */
export interface Typography {
  /** Font family definitions */
  fontFamily?: {
    /** Base body font family */
    base?: string;
    /** Heading font family */
    heading?: string;
    /** Monospace font family */
    mono?: string;
  };
  /** Font size scale (string values, e.g. "0.75rem") */
  fontSize?: {
    xs?: string;
    sm?: string;
    base?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
    '3xl'?: string;
    '4xl'?: string;
  };
  /** Font weight scale (numeric values) */
  fontWeight?: {
    light?: number;
    normal?: number;
    medium?: number;
    semibold?: number;
    bold?: number;
  };
  /** Line height scale */
  lineHeight?: {
    tight?: string;
    normal?: string;
    relaxed?: string;
    loose?: string;
  };
  /** Letter spacing scale */
  letterSpacing?: {
    tighter?: string;
    tight?: string;
    normal?: string;
    wide?: string;
    wider?: string;
  };
}

/**
 * Spacing Scale Configuration
 * Aligned with @objectstack/spec Spacing.
 *
 * Explicit scale keys '0' through '24' with string values (e.g. "0rem", "1.5rem").
 */
export interface Spacing {
  '0'?: string;
  '1'?: string;
  '2'?: string;
  '3'?: string;
  '4'?: string;
  '5'?: string;
  '6'?: string;
  '8'?: string;
  '10'?: string;
  '12'?: string;
  '16'?: string;
  '20'?: string;
  '24'?: string;
}

/**
 * Border Radius Configuration
 * Aligned with @objectstack/spec BorderRadius.
 */
export interface BorderRadius {
  none?: string;
  sm?: string;
  base?: string;
  md?: string;
  lg?: string;
  xl?: string;
  '2xl'?: string;
  full?: string;
}

/**
 * Shadow Configuration
 * Aligned with @objectstack/spec Shadow.
 */
export interface Shadow {
  none?: string;
  sm?: string;
  base?: string;
  md?: string;
  lg?: string;
  xl?: string;
  '2xl'?: string;
  inner?: string;
}

/**
 * Responsive Breakpoints Configuration
 * Aligned with @objectstack/spec Breakpoints.
 */
export interface Breakpoints {
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  '2xl'?: string;
}

/**
 * Animation Configuration
 * Aligned with @objectstack/spec Animation.
 */
export interface Animation {
  /** Duration presets */
  duration?: {
    fast?: string;
    base?: string;
    slow?: string;
  };
  /** Timing function presets */
  timing?: {
    linear?: string;
    ease?: string;
    easeIn?: string;
    easeOut?: string;
    easeInOut?: string;
  };
}

/**
 * Z-Index Layer Configuration
 * Aligned with @objectstack/spec ZIndex.
 */
export interface ZIndex {
  base?: number;
  dropdown?: number;
  sticky?: number;
  fixed?: number;
  modalBackdrop?: number;
  modal?: number;
  popover?: number;
  tooltip?: number;
}

/**
 * Logo / Branding Assets
 * Aligned with @objectstack/spec Theme.logo.
 */
export interface ThemeLogo {
  /** Logo URL for light mode */
  light?: string;
  /** Logo URL for dark mode */
  dark?: string;
  /** Favicon URL */
  favicon?: string;
}

/**
 * Theme Mode
 * Aligned with @objectstack/spec ThemeMode.
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Complete Theme Definition
 * Aligned with @objectstack/spec Theme.
 *
 * This is the canonical JSON shape for a theme.
 * It can be serialized, stored, and applied at runtime via ThemeProvider.
 */
export interface Theme {
  /** Theme identifier (required) */
  name: string;
  /** Display label (required) */
  label: string;
  /** Human-readable description */
  description?: string;
  /** Theme mode: light, dark, or auto (default: 'auto') */
  mode?: ThemeMode;
  /** Semantic color palette (primary is required) */
  colors: ColorPalette;
  /** Typography design tokens */
  typography?: Typography;
  /** Spacing scale */
  spacing?: Spacing;
  /** Border radius scale */
  borderRadius?: BorderRadius;
  /** Shadow scale */
  shadows?: Shadow;
  /** Responsive breakpoint definitions */
  breakpoints?: Breakpoints;
  /** Animation duration and timing */
  animation?: Animation;
  /** Z-index layering system */
  zIndex?: ZIndex;
  /** Arbitrary CSS custom properties */
  customVars?: Record<string, string>;
  /** Logo/branding assets */
  logo?: ThemeLogo;
  /** Extend another theme by name */
  extends?: string;
}

// ============================================================================
// ObjectUI Component Schemas (UI rendering)
// ============================================================================

/**
 * Theme Component Schema
 *
 * Used by SchemaRenderer to render a theme manager component.
 */
export interface ThemeSchema extends BaseSchema {
  type: 'theme';

  /** Current theme mode */
  mode?: ThemeMode;

  /** Available themes */
  themes?: Theme[];

  /** Active theme name */
  activeTheme?: string;

  /** Allow user theme switching */
  allowSwitching?: boolean;

  /** Persist theme preference to storage */
  persistPreference?: boolean;

  /** Storage key for persisting theme */
  storageKey?: string;
}

/**
 * Theme Switcher Component Schema
 */
export interface ThemeSwitcherSchema extends BaseSchema {
  type: 'theme-switcher';

  /** Switcher variant */
  variant?: 'dropdown' | 'toggle' | 'buttons';

  /** Show mode selector (light/dark) */
  showMode?: boolean;

  /** Show theme selector */
  showThemes?: boolean;

  /** Icon for light mode */
  lightIcon?: string;

  /** Icon for dark mode */
  darkIcon?: string;
}

/**
 * Theme Preview Component Schema
 */
export interface ThemePreviewSchema extends BaseSchema {
  type: 'theme-preview';

  /** Theme to preview */
  theme?: Theme;

  /** Preview mode */
  mode?: ThemeMode;

  /** Show color palette */
  showColors?: boolean;

  /** Show typography samples */
  showTypography?: boolean;

  /** Show component samples */
  showComponents?: boolean;
}

// ============================================================================
// Legacy Aliases (Backward Compatibility)
// ============================================================================

/**
 * @deprecated Use `Theme` instead. Kept for backward compatibility.
 */
export type ThemeDefinition = Theme;

/**
 * @deprecated Use `Spacing` instead. Kept for backward compatibility.
 */
export type SpacingScale = Spacing;
