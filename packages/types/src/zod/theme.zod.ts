/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @object-ui/types/zod - Theme Schema Zod Validators
 * 
 * Zod validation schemas for theme configuration.
 * Following @objectstack/spec UI specification format.
 * 
 * @module zod/theme
 * @packageDocumentation
 */

import { z } from 'zod';
import { BaseSchema } from './base.zod.js';

/**
 * Color Palette Schema
 */
export const ColorPaletteSchema = z.object({
  primary: z.string().optional().describe('Primary brand color'),
  secondary: z.string().optional().describe('Secondary color'),
  accent: z.string().optional().describe('Accent color'),
  background: z.string().optional().describe('Background color'),
  foreground: z.string().optional().describe('Foreground/text color'),
  muted: z.string().optional().describe('Muted color'),
  mutedForeground: z.string().optional().describe('Muted foreground color'),
  border: z.string().optional().describe('Border color'),
  input: z.string().optional().describe('Input border color'),
  ring: z.string().optional().describe('Ring/focus color'),
  success: z.string().optional().describe('Success color'),
  warning: z.string().optional().describe('Warning color'),
  destructive: z.string().optional().describe('Error/destructive color'),
  info: z.string().optional().describe('Info color'),
  card: z.string().optional().describe('Card background color'),
  cardForeground: z.string().optional().describe('Card foreground color'),
  popover: z.string().optional().describe('Popover background color'),
  popoverForeground: z.string().optional().describe('Popover foreground color'),
});

/**
 * Typography Schema
 */
export const TypographySchema = z.object({
  fontSans: z.array(z.string()).optional().describe('Font family for sans-serif text'),
  fontSerif: z.array(z.string()).optional().describe('Font family for serif text'),
  fontMono: z.array(z.string()).optional().describe('Font family for monospace text'),
  fontSize: z.number().optional().describe('Base font size (in rem)'),
  lineHeight: z.number().optional().describe('Line height'),
  headingWeight: z.number().optional().describe('Font weight for headings'),
  bodyWeight: z.number().optional().describe('Font weight for body text'),
});

/**
 * Spacing Scale Schema
 */
export const SpacingScaleSchema = z.object({
  base: z.number().optional().describe('Base spacing unit (in rem)'),
  scale: z.record(z.string(), z.string()).optional().describe('Custom spacing values'),
});

/**
 * Border Radius Schema
 */
export const BorderRadiusSchema = z.object({
  sm: z.string().optional().describe('Small radius'),
  default: z.string().optional().describe('Default radius'),
  md: z.string().optional().describe('Medium radius'),
  lg: z.string().optional().describe('Large radius'),
  xl: z.string().optional().describe('Extra large radius'),
});

/**
 * Theme Mode Schema
 */
export const ThemeModeSchema = z.enum(['light', 'dark', 'system']).describe('Theme mode');

/**
 * Theme Definition Schema
 */
export const ThemeDefinitionSchema = z.object({
  name: z.string().describe('Theme name/identifier'),
  label: z.string().optional().describe('Theme display label'),
  light: ColorPaletteSchema.optional().describe('Light mode color palette'),
  dark: ColorPaletteSchema.optional().describe('Dark mode color palette'),
  typography: TypographySchema.optional().describe('Typography configuration'),
  spacing: SpacingScaleSchema.optional().describe('Spacing scale configuration'),
  radius: BorderRadiusSchema.optional().describe('Border radius configuration'),
  cssVariables: z.record(z.string(), z.string()).optional().describe('Custom CSS variables'),
  tailwind: z.record(z.string(), z.any()).optional().describe('Tailwind configuration overrides'),
});

/**
 * Theme Schema
 */
export const ThemeSchema = BaseSchema.extend({
  type: z.literal('theme'),
  mode: ThemeModeSchema.optional().describe('Current theme mode'),
  themes: z.array(ThemeDefinitionSchema).optional().describe('Available themes'),
  activeTheme: z.string().optional().describe('Active theme name'),
  allowSwitching: z.boolean().optional().describe('Allow user theme switching'),
  persistPreference: z.boolean().optional().describe('Persist theme preference'),
  storageKey: z.string().optional().describe('Storage key for persisting theme'),
});

/**
 * Theme Switcher Schema
 */
export const ThemeSwitcherSchema = BaseSchema.extend({
  type: z.literal('theme-switcher'),
  variant: z.enum(['dropdown', 'toggle', 'buttons']).optional().describe('Switcher variant'),
  showMode: z.boolean().optional().describe('Show mode selector (light/dark)'),
  showThemes: z.boolean().optional().describe('Show theme selector'),
  lightIcon: z.string().optional().describe('Icon for light mode'),
  darkIcon: z.string().optional().describe('Icon for dark mode'),
});

/**
 * Theme Preview Schema
 */
export const ThemePreviewSchema = BaseSchema.extend({
  type: z.literal('theme-preview'),
  theme: ThemeDefinitionSchema.optional().describe('Theme to preview'),
  mode: ThemeModeSchema.optional().describe('Preview mode'),
  showColors: z.boolean().optional().describe('Show color palette'),
  showTypography: z.boolean().optional().describe('Show typography samples'),
  showComponents: z.boolean().optional().describe('Show component samples'),
});

/**
 * Union of all theme schemas
 */
export const ThemeComponentSchema = z.union([
  ThemeSchema,
  ThemeSwitcherSchema,
  ThemePreviewSchema,
]);

/**
 * Export type inference helpers
 */
export type ColorPaletteSchemaType = z.infer<typeof ColorPaletteSchema>;
export type TypographySchemaType = z.infer<typeof TypographySchema>;
export type SpacingScaleSchemaType = z.infer<typeof SpacingScaleSchema>;
export type BorderRadiusSchemaType = z.infer<typeof BorderRadiusSchema>;
export type ThemeModeSchemaType = z.infer<typeof ThemeModeSchema>;
export type ThemeDefinitionSchemaType = z.infer<typeof ThemeDefinitionSchema>;
export type ThemeSchemaType = z.infer<typeof ThemeSchema>;
export type ThemeSwitcherSchemaType = z.infer<typeof ThemeSwitcherSchema>;
export type ThemePreviewSchemaType = z.infer<typeof ThemePreviewSchema>;
