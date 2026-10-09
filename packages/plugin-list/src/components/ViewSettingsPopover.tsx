/**
 * ViewSettingsPopover
 *
 * UX Sprint 2 (P1-4): consolidates four small toolbar controls that the
 * UX audit flagged as "too many top-level chips":
 *   - Group by
 *   - Row color
 *   - Density
 *   - Hide fields
 *
 * into a single "View settings" popover keyed by a gear icon. Filter and
 * Sort remain top-level because they're primary data operations, but the
 * appearance/grouping cluster collapses behind one trigger that opens an
 * accordion-style sheet.
 *
 * Implementation notes:
 *   - Each section is collapsible (default open) so users can focus on one.
 *   - Content is duplicated from the original inline popovers; if you change
 *     behavior, update both this and the legacy code path in ListView.tsx
 *     (kept behind `appearance.compactToolbar: false` for back-compat).
 *
 * @module
 */

import * as React from 'react';
import {
  cn,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  GroupingEditor,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@object-ui/components';
import {
  Settings2,
  Rows4,
  Rows3,
  Rows2,
  ChevronDown,
} from 'lucide-react';

export interface ViewSettingsField {
  name: string;
  label?: string;
}

export interface ViewSettingsDensity {
  mode: 'compact' | 'comfortable' | 'spacious';
  cycle: () => void;
}

export interface ViewSettingsPopoverProps {
  t: (key: string, opts?: any) => string;
  allFields: ViewSettingsField[];

  showGroup?: boolean;
  groupingConfig?: any;
  setGroupingConfig?: (next: any) => void;

  showColor?: boolean;
  rowColorConfig?: { field: string; colors?: Record<string, string> } | undefined;
  setRowColorConfig?: (next: { field: string; colors: Record<string, string> } | undefined) => void;

  showDensity?: boolean;
  density?: ViewSettingsDensity;

  showHideFields?: boolean;
  hiddenFields?: Set<string>;
  updateHiddenFields?: (next: Set<string>) => void;

  /** Record editing — toggle inline cell editing (persists `inlineEdit` on the view). */
  showInlineEdit?: boolean;
  inlineEdit?: boolean;
  setInlineEdit?: (next: boolean) => void;
}

interface SectionProps {
  title: string;
  badge?: number;
  onClear?: () => void;
  clearLabel?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, badge, onClear, clearLabel, defaultOpen = true, children }: SectionProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="border-b last:border-b-0">
      <div className="flex items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((x) => !x)}
          className="flex items-center gap-1.5 text-xs font-medium text-foreground/80 hover:text-foreground"
        >
          <ChevronDown
            className={cn('h-3.5 w-3.5 transition-transform', !open && '-rotate-90')}
          />
          {title}
          {typeof badge === 'number' && badge > 0 && (
            <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary/10 px-1 text-[10px] text-primary tabular-nums">
              {badge}
            </span>
          )}
        </button>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            {clearLabel}
          </button>
        )}
      </div>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

/** The item a colour field none of the options carries is shown by. */
const OUTSIDE_OPTIONS = 'outside';

/**
 * objectui#11865 — the "Color by field" picker, drawn with the shared `Select`,
 * the control the rest of the console picks with. It used to be a
 * browser-native `<select>`. What a pick writes is unchanged: `onPick` receives
 * the picked option's own value, the string the native control's `change`
 * carried, and the caller turns it into the same row-colour config as before.
 * Re-picking the current option writes nothing, as it did there.
 *
 * - Items carry their option's INDEX, not its value: "None" is the option whose
 *   value is `''`, which `SelectItem` refuses.
 * - A colour field none of the options carries gets an item of its own,
 *   labelled with the field, so the trigger shows what the view holds. The
 *   native control showed "None" there. Picking that item writes nothing.
 */
function ColorFieldPicker({
  value,
  options,
  onPick,
}: {
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onPick: (value: string) => void;
}) {
  const at = options.findIndex((o) => o.value === value);
  return (
    <Select
      value={at !== -1 ? String(at) : OUTSIDE_OPTIONS}
      onValueChange={(token) => {
        // `undefined` for the outside item: it is the view's own field, so there is nothing to write.
        const picked = options[Number(token)];
        if (picked) onPick(picked.value);
      }}
    >
      <SelectTrigger className="h-8 rounded px-2 text-xs" data-testid="color-field-select">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {at === -1 && <SelectItem value={OUTSIDE_OPTIONS}>{value}</SelectItem>}
        {options.map((o, i) => (
          <SelectItem key={`${i}:${o.value}`} value={String(i)}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ViewSettingsPopover(props: ViewSettingsPopoverProps) {
  const {
    t,
    allFields,
    showGroup,
    groupingConfig,
    setGroupingConfig,
    showColor,
    rowColorConfig,
    setRowColorConfig,
    showDensity,
    density,
    showHideFields,
    hiddenFields,
    updateHiddenFields,
    showInlineEdit,
    inlineEdit,
    setInlineEdit,
  } = props;

  const [open, setOpen] = React.useState(false);

  // Active count: how many of the 4 controls have non-default state.
  const activeCount = [
    !!groupingConfig?.fields?.length,
    !!rowColorConfig?.field,
    density && density.mode !== 'compact',
    (hiddenFields?.size ?? 0) > 0,
    !!inlineEdit,
  ].filter(Boolean).length;

  const DensityIcon =
    density?.mode === 'compact' ? Rows4 : density?.mode === 'comfortable' ? Rows3 : Rows2;

  const triggerLabel = t('list.viewSettings', { defaultValue: 'View settings' });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={triggerLabel}
          title={triggerLabel}
          className={cn(
            'h-7 px-2 text-muted-foreground hover:text-primary text-xs transition-colors duration-150',
            activeCount > 0 && 'text-foreground font-medium',
          )}
          data-testid="view-settings-trigger"
        >
          <Settings2 className="h-3.5 w-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">{triggerLabel}</span>
          {activeCount > 0 && (
            <span className="ml-1 flex h-4 min-w-[16px] items-center justify-center text-[10px] font-medium text-muted-foreground tabular-nums">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" data-testid="view-settings-content">
        <div className="px-3 py-2 border-b">
          <div className="text-sm font-semibold">{triggerLabel}</div>
          <div className="text-[11px] text-muted-foreground">
            {t('list.viewSettingsHint', {
              defaultValue: 'Grouping, color, density, and visible fields. Applies to everyone who uses this view.',
            })}
          </div>
        </div>

        {showGroup && setGroupingConfig && (
          <Section
            title={t('list.group', { defaultValue: 'Group' })}
            badge={groupingConfig?.fields?.length || 0}
            onClear={groupingConfig ? () => setGroupingConfig(undefined) : undefined}
            clearLabel={t('list.clear', { defaultValue: 'Clear' })}
          >
            <GroupingEditor
              value={groupingConfig as any}
              fieldOptions={allFields.map((f) => ({ value: f.name, label: f.label || f.name }))}
              maxLevels={3}
              labels={{
                addGroup: t('list.addGroup', 'Add group field'),
                collapseTitle: t('list.collapsedByDefault', 'Collapsed by default'),
                removeTitle: t('list.removeGroup', 'Remove'),
              }}
              onChange={(next) => setGroupingConfig(next as any)}
            />
          </Section>
        )}

        {/* `list.rowColor` names the SECTION; `list.color` is the compact
            toolbar-BUTTON label for the same feature — ListView renders the
            button with `list.color` and the panel it opens with
            `list.rowColor`. This Section is that panel's counterpart on the
            collapsed/mobile surface, so it takes the panel's key
            (objectui#4118). */}
        {showColor && setRowColorConfig && (
          <Section
            title={t('list.rowColor', { defaultValue: 'Row Color' })}
            onClear={rowColorConfig ? () => setRowColorConfig(undefined) : undefined}
            clearLabel={t('list.clear', { defaultValue: 'Clear' })}
            defaultOpen={!!rowColorConfig}
          >
            <label className="block text-[11px] text-muted-foreground mb-1">
              {t('list.colorByField', { defaultValue: 'Color by field' })}
            </label>
            <ColorFieldPicker
              value={rowColorConfig?.field || ''}
              options={[
                { value: '', label: t('list.none', { defaultValue: 'None' }) },
                ...allFields.map((field) => ({ value: field.name, label: field.label || field.name })),
              ]}
              onPick={(field) => {
                if (!field) {
                  setRowColorConfig(undefined);
                } else {
                  setRowColorConfig({ field, colors: rowColorConfig?.colors || {} });
                }
              }}
            />
          </Section>
        )}

        {showDensity && density && (
          <Section
            title={t('grid.toolbar.densityMode', { defaultValue: 'Density' })}
            defaultOpen={density.mode !== 'compact'}
          >
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5"
                onClick={density.cycle}
                data-testid="view-settings-density-cycle"
              >
                <DensityIcon className="h-3.5 w-3.5" />
                <span className="text-xs">
                  {density.mode === 'compact'
                    ? t('grid.toolbar.densityCompact', { defaultValue: 'Compact' })
                    : density.mode === 'comfortable'
                      ? t('grid.toolbar.densityComfortable', { defaultValue: 'Comfortable' })
                      : t('grid.toolbar.densitySpacious', { defaultValue: 'Spacious' })}
                </span>
              </Button>
              <span className="text-[11px] text-muted-foreground">
                {t('grid.toolbar.densityCycleShortHint', {
                  defaultValue: 'Click to cycle',
                })}
              </span>
            </div>
          </Section>
        )}

        {showInlineEdit && setInlineEdit && (
          <Section
            title={t('list.recordEditingTitle', { defaultValue: 'Record editing' })}
            defaultOpen={!!inlineEdit}
          >
            <label className="flex items-center gap-2 text-xs py-1 px-1 rounded hover:bg-muted cursor-pointer">
              <input
                type="checkbox"
                checked={!!inlineEdit}
                onChange={() => setInlineEdit(!inlineEdit)}
                className="rounded border-input"
                data-testid="view-settings-inline-edit"
              />
              <span>
                {t('list.inlineEditLabel', {
                  defaultValue: 'Edit records inline (click a cell to edit)',
                })}
              </span>
            </label>
          </Section>
        )}

        {showHideFields && hiddenFields && updateHiddenFields && (
          <Section
            title={t('list.hideFieldsTitle', { defaultValue: 'Hide Fields' })}
            badge={hiddenFields.size}
            onClear={hiddenFields.size > 0 ? () => updateHiddenFields(new Set()) : undefined}
            clearLabel={t('list.showAll', { defaultValue: 'Show all' })}
            defaultOpen={hiddenFields.size > 0}
          >
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {allFields.map((field) => (
                <label
                  key={field.name}
                  className="flex items-center gap-2 text-xs py-1 px-1 rounded hover:bg-muted cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={!hiddenFields.has(field.name)}
                    onChange={() => {
                      const next = new Set(hiddenFields);
                      if (next.has(field.name)) next.delete(field.name);
                      else next.add(field.name);
                      updateHiddenFields(next);
                    }}
                    className="rounded border-input"
                  />
                  <span className="truncate">{field.label || field.name}</span>
                </label>
              ))}
            </div>
          </Section>
        )}
      </PopoverContent>
    </Popover>
  );
}
