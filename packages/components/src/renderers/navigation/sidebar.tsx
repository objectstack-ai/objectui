/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ComponentRegistry } from '@object-ui/core';
// `SidebarSchema` types the one entry point the registry actually maps to a
// schema (`'sidebar'` — see `@object-ui/types`' registry map). The other ten
// entry points below are sidebar PARTS, which have no schema type of their own;
// they take `BaseSchema`, the type every registered node satisfies. Using
// `SidebarSchema` for them would assert `type: 'sidebar'` on a node whose type
// is `'sidebar-header'` (objectui#4353).
import type { SidebarSchema, BaseSchema } from '@object-ui/types';
import { useDisplayLocale } from '@object-ui/i18n';
// Aliased on import, following PR #4169's convention: this repo has its OWN
// `resolveKeyedI18nLabel` over a DIFFERENT vocabulary, and neither resolver
// accepts the other's shape. `schema.label` is the spec's INLINE locale map —
// see `BaseSchema.label` (objectui#4580).
import { resolveI18nLabel as resolveInlineI18nLabel } from '@objectstack/spec/ui';
import { renderChildren } from '../../lib/utils';
import { toFormControlDomProps } from '../../lib/form-control-dom-props';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset
} from '../../ui';

// Every registration below except `sidebar-trigger` puts the authored child
// list on the page through `renderChildren`, and every one of those declares
// the slot as `{ name: 'children', type: 'slot' }` (objectui#9910). That input
// is the ONLY thing `sdui-parser`'s `not-a-container` reads, so this is what stops
// the tier from warning on the one child-list key this family renders — the
// false diagnostic objectui#6771's convergence moved onto `children`.
// ⛔ Not `isContainer`: objectui#6804 ruled that flag means LAYOUT containment
// (the react-page JSX scope, the public layout ledger), and these chrome parts
// are not layout regions. `sidebar` and `sidebar-menu-button` only put a child
// on the page inside a `sidebar-provider`, which is why the census in
// `renderers/__tests__/container-declaration-ratchet.test.tsx` probes them in
// that context rather than bare.
const CHILDREN_SLOT = { name: 'children', type: 'slot' } as const;

ComponentRegistry.register('sidebar-provider',
  ({ schema, ...props }: { schema: BaseSchema; [key: string]: any }) => (
    <SidebarProvider {...props}>{renderChildren(schema.children)}</SidebarProvider>
  ),
  {
    namespace: 'ui',
    label: 'Sidebar Provider',
    inputs: [
      { name: 'defaultOpen', type: 'boolean' },
      CHILDREN_SLOT
    ],
    defaultProps: {
      defaultOpen: true
    }
  }
);

ComponentRegistry.register('sidebar', 
  ({ schema, ...props }: { schema: SidebarSchema; [key: string]: any }) => (
    <Sidebar {...props}>{renderChildren(schema.children)}</Sidebar>
  ),
  {
    namespace: 'ui',
    label: 'Sidebar',
    inputs: [
      { name: 'collapsible', type: 'enum', enum: ['offcanvas', 'icon', 'none'] },
      { name: 'side', type: 'enum', enum: ['left', 'right'] },
      { name: 'variant', type: 'enum', enum: ['sidebar', 'floating', 'inset'] },
      CHILDREN_SLOT
    ],
    defaultProps: {
      collapsible: 'icon',
      side: 'left',
      variant: 'sidebar'
    }
  }
);

ComponentRegistry.register('sidebar-header',
  ({ schema, ...props }: { schema: BaseSchema; [key: string]: any }) => (
    <SidebarHeader {...props}>{renderChildren(schema.children)}</SidebarHeader>
  ),
  { 
    namespace: 'ui',
    label: 'Sidebar Header',
    inputs: [CHILDREN_SLOT]
  }
);

ComponentRegistry.register('sidebar-content',
  ({ schema, ...props }: { schema: BaseSchema; [key: string]: any }) => (
    <SidebarContent {...props}>{renderChildren(schema.children)}</SidebarContent>
  ),
  { 
    namespace: 'ui',
    label: 'Sidebar Content',
    inputs: [CHILDREN_SLOT]
  }
);

ComponentRegistry.register('sidebar-group',
  ({ schema, ...props }: { schema: BaseSchema; [key: string]: any }) => {
    // Read-time resolution against the display locale (objectui#4580 revised
    // Q1-A). `BaseSchema.label` accepts `string | I18nLabel`; rendering the map
    // straight into a text node THREW "Objects are not valid as a React child".
    // The body became a block only to host this hook — the registry renders its
    // entries with `React.createElement` (`SchemaRenderer.tsx:621`), so hooks
    // are legal here, as `elements.tsx`'s own `useDisplayLocale()` already relies on.
    const locale = useDisplayLocale();
    return (
      <SidebarGroup {...props}>
        {schema.label && (
          <SidebarGroupLabel>{resolveInlineI18nLabel(schema.label, locale)}</SidebarGroupLabel>
        )}
        <SidebarGroupContent>
          {renderChildren(schema.children)}
        </SidebarGroupContent>
      </SidebarGroup>
    );
  },
  {
    namespace: 'ui',
    label: 'Sidebar Group',
    inputs: [
      { name: 'label', type: 'string' },
      CHILDREN_SLOT
    ],
    defaultProps: {
      label: 'Menu'
    }
  }
);

ComponentRegistry.register('sidebar-menu',
  ({ schema, ...props }: { schema: BaseSchema; [key: string]: any }) => (
    <SidebarMenu {...props}>{renderChildren(schema.children)}</SidebarMenu>
  ),
  { 
    namespace: 'ui',
    label: 'Sidebar Menu',
    inputs: [CHILDREN_SLOT]
  }
);

ComponentRegistry.register('sidebar-menu-item',
  ({ schema, ...props }: { schema: BaseSchema; [key: string]: any }) => (
    <SidebarMenuItem {...props}>{renderChildren(schema.children)}</SidebarMenuItem>
  ),
  { 
    namespace: 'ui',
    label: 'Sidebar Menu Item',
    inputs: [CHILDREN_SLOT]
  }
);

ComponentRegistry.register('sidebar-menu-button',
  ({ schema, ...props }: { schema: BaseSchema; [key: string]: any }) => {
    // `style` forwarded by name (the objectui#4435 route); everything else goes
    // through the form-control DOM declaration. This is the only `sidebar-*`
    // registration in this file that objectui#5632's group covers — the
    // container ones render `<div>`s and belong to `BARE_SPREAD`, which is a
    // different mechanism group and a different card.
    const { style, ...buttonProps } = props;

    return (
      <SidebarMenuButton
        isActive={schema.active}
        {...toFormControlDomProps(buttonProps)}
        style={style}
      >
        {renderChildren(schema.children)}
      </SidebarMenuButton>
    );
  },
  {
    namespace: 'ui',
    label: 'Sidebar Menu Button',
    inputs: [
      { name: 'active', type: 'boolean' },
      { name: 'size', type: 'enum', enum: ['default', 'sm', 'lg'] },
      { name: 'tooltip', type: 'string' },
      CHILDREN_SLOT
    ],
    defaultProps: {
      size: 'default'
    }
  }
);

ComponentRegistry.register('sidebar-footer',
  ({ schema, ...props }: { schema: BaseSchema; [key: string]: any }) => (
    <SidebarFooter {...props}>{renderChildren(schema.children)}</SidebarFooter>
  ),
  { 
    namespace: 'ui',
    label: 'Sidebar Footer',
    inputs: [CHILDREN_SLOT]
  }
);

ComponentRegistry.register('sidebar-inset',
  ({ schema, ...props }: { schema: BaseSchema; [key: string]: any }) => (
    <SidebarInset {...props}>{renderChildren(schema.children)}</SidebarInset>
  ),
  { 
    namespace: 'ui',
    label: 'Sidebar Inset',
    inputs: [CHILDREN_SLOT]
  }
);

ComponentRegistry.register('sidebar-trigger',
  ({ className, ...props }: { className?: string; [key: string]: any }) => {
    // TWO defects met on this one registration, and only the first is the
    // family's ordinary bare spread (objectui#5632, the `ui:sidebar-trigger`
    // slice of objectui#5574).
    //
    //  1. the spread itself — `{...props}` reached `SidebarTrigger`, which
    //     spreads its own rest onto the `Button` it renders, so every canary
    //     family became an attribute on a real `<button>`.
    //  2. `schema` was never taken off the bag. Every other registration in
    //     this family destructures it (`({ schema, ...props })`) because it
    //     renders a child list; this one renders none and named only
    //     `className`, so the node `SchemaRenderer` injects on EVERY render
    //     rode the spread and landed as `schema="[object Object]"`. That is
    //     why this target was its own ledger group: fourteen attributes where
    //     the rest of the shape leaks thirteen.
    //
    //     ⚠️ It still takes no `schema` parameter, and must not start:
    //     `scripts/__tests__/body-dialect-census.test.ts` pins this
    //     registration as the one `sidebar-*` entry that reads no child list.
    //     The filter is what drops the key — a whitelist never has to name
    //     what it refuses.
    //
    // One filter closes both — `schema` is not on the pass-through list, so
    // nothing here has to enumerate it. The declaration is the FORM-CONTROL
    // one, not the bare `toDomProps`: the host is a `<button>`, where HTML
    // defines `name` and `disabled`. The sweep gate measures `name` arriving
    // here and counts it LEGITIMATE, so a bare `toDomProps` would have
    // un-named this control without moving a single number the gate watches.
    //
    // `className` is destructured so the filtered bag can never carry a second
    // writer for it (`className` IS on the pass-through list): one writer here,
    // and `SidebarTrigger` merges it into its own `cn("h-7 w-7", …)` rather
    // than being overwritten by it. `style` is forwarded BY NAME, the
    // objectui#4435 route every converged sibling in this package takes — it
    // reaches the DOM today and the whitelist does not carry it.
    const { style, ...triggerProps } = props;

    return (
      <SidebarTrigger
        className={className}
        {...toFormControlDomProps(triggerProps)}
        style={style}
      />
    );
  },
  {
    namespace: 'ui',
    label: 'Sidebar Trigger',
    inputs: [{ name: 'className', type: 'string' }]
  }
);
