// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * AddFieldPopover — what the Data pillar's "Add field" opens (objectui#12516).
 *
 * "Add field" used to create a field at once, named "New field" with a
 * `field_<N>` api name and type Text, for the author to rename and retype in
 * the inspector afterwards. The popover asks for the two things first: a Label
 * (required) and a Type (the inspector's searchable `FieldTypePicker`, Text
 * preselected). Create hands both to the host's `onCreate`, which adds the
 * field through the pillar's one add-field path (the object buffer and its
 * autosave) and opens it in the inspector; Cancel, Escape or a click outside
 * creates nothing.
 *
 * The popover names nothing itself: the api name is derived by the host from
 * the label, as the field inspector derives it.
 *
 * Two placements, one form:
 * - **trigger** (the Form toolbar): `children` is the button that opens it;
 * - **controlled** (the Records grid's "+" column, which the grid draws from
 *   its authoring context with no element to hand over): the host passes
 *   `open` / `onOpenChange`, `children` is the element it is placed against,
 *   and `returnFocusTo` names where focus goes back when it closes.
 */

import * as React from 'react';
import {
  Button,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@object-ui/components';
import type { FieldTypeId } from '../metadata-admin/previews/field-types.js';
import { FieldTypePicker } from '../metadata-admin/inspectors/FieldTypePicker.js';
import { t, useMetadataLocale } from '../metadata-admin/i18n.js';

export interface AddFieldPopoverProps {
  /** Create the field: the label as typed (trimmed) and the chosen type. */
  onCreate: (label: string, type: FieldTypeId) => void;
  /** The element the popover opens from (trigger) or is placed against (controlled). */
  children: React.ReactElement;
  /** Controlled open state; omit both to let `children` open it. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Where focus returns on close, when `children` cannot take it. */
  returnFocusTo?: () => HTMLElement | null;
  /** Which edge of `children` the popover lines up with. */
  align?: 'start' | 'end';
}

export function AddFieldPopover({
  onCreate,
  children,
  open: openProp,
  onOpenChange,
  returnFocusTo,
  align = 'end',
}: AddFieldPopoverProps): React.ReactElement {
  const locale = useMetadataLocale();
  const [openState, setOpenState] = React.useState(false);
  const open = openProp ?? openState;
  const [label, setLabel] = React.useState('');
  const [type, setType] = React.useState<FieldTypeId>('text');
  const titleId = React.useId();
  const labelId = React.useId();

  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOpenState(next);
    onOpenChange?.(next);
    // Every open starts from an empty label and Text.
    if (!next) {
      setLabel('');
      setType('text');
    }
  };

  const trimmed = label.trim();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed) return;
    onCreate(trimmed, type);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align={align}
        aria-labelledby={titleId}
        data-testid="add-field-popover"
        className="w-72 p-3"
        onCloseAutoFocus={(e) => {
          const target = returnFocusTo?.();
          if (target) {
            e.preventDefault();
            target.focus();
          }
        }}
      >
        <form onSubmit={submit} className="space-y-3">
          <p id={titleId} className="text-[13px] font-semibold">
            {t('engine.studio.data.addField', locale)}
          </p>
          <div className="space-y-1">
            <Label htmlFor={labelId} className="text-xs text-muted-foreground">
              {t('designer.field.label', locale)}
            </Label>
            <Input
              id={labelId}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('engine.studio.data.newFieldLabel', locale)}
              required
              aria-required="true"
              autoComplete="off"
              data-testid="add-field-label-input"
              className="h-8 text-sm"
            />
          </div>
          <FieldTypePicker label={t('designer.field.type', locale)} value={type} onCommit={setType} locale={locale} />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2.5 text-xs" onClick={() => setOpen(false)}>
              {t('engine.studio.cancel', locale)}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!trimmed}
              data-testid="add-field-create"
              className="h-7 px-2.5 text-xs"
            >
              {t('engine.studio.data.addFieldCreate', locale)}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
