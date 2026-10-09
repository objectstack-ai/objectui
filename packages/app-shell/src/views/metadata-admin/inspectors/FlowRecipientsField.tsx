// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * FlowRecipientsField — the notify node's `recipients` editor (objectui#11788).
 *
 * One row per recipient, each a TYPE plus a value picked for that type, so a
 * "notify the owner when the ticket is done" flow is built without typing an
 * audience selector by hand:
 *
 * | Type          | Picked with                                   | Stored as          |
 * |---------------|-----------------------------------------------|--------------------|
 * | Record field  | the trigger object's fields                   | `{record.FIELD}`   |
 * | User          | a `sys_user` lookup                           | the user id        |
 * | Team          | a `sys_team` lookup                           | `team:ID`          |
 * | Email address | free text, checked for an email's shape       | the address        |
 * | Other         | free text with the `{var}` picker             | exactly as typed   |
 *
 * The spellings are the ones the platform already reads, never new ones:
 * `NotifyConfigSchema.recipients` (in `@objectstack/spec/automation`) is a
 * string or a string array whose `{token}` templates resolve per run, and each
 * resolved string is an audience spec for the messaging service's
 * `RecipientResolver` (objectstack `service-messaging`, ADR-0030): a bare user
 * id, `team:ID`, or an email-shaped value resolved to a user. The user and team
 * lookups are the ones the approval node's approvers already use, so the
 * committed column is the spec's `APPROVER_VALUE_SOURCES` binding (`sys_user.id`,
 * `sys_team.id`).
 *
 * "Other" keeps every stored value editable that is none of the four — a flow
 * variable (`{ownerId}`), a `role:NAME` or `owner_of:OBJECT:ID` selector, or a
 * `user:ID` — byte for byte: reading a flow and saving it again never rewrites
 * a recipient. A stored single string stays a single string while it holds one
 * recipient; the offline `stringList` editor used to read it as an empty list.
 */

import * as React from 'react';
import { Plus, X } from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@object-ui/components';
import { RequiredMarker, uniqueId } from './_shared.js';
import { ReferenceCombobox, type FlowReferenceContext, type ResolvedRef } from './FlowReferenceField.js';
import { VariableTextInput } from './VariableTextInput.js';
import type { ScopeGroup } from './useFlowScope.js';
import { t, type SupportedLocale } from '../i18n.js';

/** The recipient types a row can hold. `custom` is "Other": stored as typed. */
export type RecipientKind = 'field' | 'user' | 'team' | 'email' | 'custom';

export const RECIPIENT_KINDS: readonly RecipientKind[] = ['field', 'user', 'team', 'email', 'custom'];

export interface RecipientEntry {
  kind: RecipientKind;
  /** The field name, user id, team id or address — or the raw text for `custom`. */
  value: string;
}

/** The `team:` audience prefix `RecipientResolver` expands to the team's members. */
const TEAM_PREFIX = 'team:';

/** `{record.FIELD}` — one field of the trigger record, as a flow template. */
const RECORD_FIELD_TEMPLATE = /^\{record\.([A-Za-z_][A-Za-z0-9_]*)\}$/;

/**
 * Whether `s` has an email's shape — the same linear test `RecipientResolver`
 * applies before it looks a recipient up by email (one `@`, not first or last,
 * a dot inside the domain, no whitespace). A value that fails it is read by the
 * resolver as a user id, which is why the Email row warns instead of saving it
 * silently.
 */
export function looksLikeEmail(s: string): boolean {
  if (!s || /\s/.test(s)) return false;
  const at = s.indexOf('@');
  if (at <= 0 || at !== s.lastIndexOf('@') || at === s.length - 1) return false;
  const domain = s.slice(at + 1);
  const dot = domain.indexOf('.');
  return dot > 0 && dot < domain.length - 1;
}

/** Classify one stored recipient string. Never rewrites it: see {@link writeRecipient}. */
export function readRecipient(raw: string): RecipientEntry {
  const field = RECORD_FIELD_TEMPLATE.exec(raw);
  if (field) return { kind: 'field', value: field[1] };
  if (raw.startsWith(TEAM_PREFIX) && raw.length > TEAM_PREFIX.length && !/[\s{}]/.test(raw)) {
    return { kind: 'team', value: raw.slice(TEAM_PREFIX.length) };
  }
  if (looksLikeEmail(raw)) return { kind: 'email', value: raw };
  // A bare token is a user id to the resolver; anything carrying a brace, a
  // colon (another selector) or whitespace is kept as typed.
  if (/^[^\s{}:@]+$/.test(raw)) return { kind: 'user', value: raw };
  return { kind: 'custom', value: raw };
}

/** The stored string for one entry; `''` for an entry with no value yet. */
export function writeRecipient(entry: RecipientEntry): string {
  const v = entry.value.trim();
  if (!v) return '';
  switch (entry.kind) {
    case 'field':
      return `{record.${v}}`;
    case 'team':
      return `${TEAM_PREFIX}${v}`;
    default:
      return v;
  }
}

/** Read the stored `recipients` value (a string or a string array) as entries. */
export function readRecipients(value: unknown): RecipientEntry[] {
  const list = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
  return list
    .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
    .map((v) => readRecipient(v));
}

/**
 * The value to store for `entries`: `undefined` for none, a single string when
 * the stored value was one and still holds one recipient, else a string array.
 */
export function writeRecipients(entries: RecipientEntry[], storedAsString: boolean): string | string[] | undefined {
  const list = entries.map(writeRecipient).filter((s) => s !== '');
  if (list.length === 0) return undefined;
  return storedAsString && list.length === 1 ? list[0] : list;
}

/** The reference each picked type resolves through (`FlowReferenceField`'s combobox). */
const KIND_REF: Partial<Record<RecipientKind, ResolvedRef>> = {
  // `$trigger`: the Start node's object, the record `{record.*}` binds.
  field: { kind: 'object-field', objectSource: '$trigger' },
  user: { kind: 'user' },
  team: { kind: 'team' },
};

/** The designer-table rows naming each type, and the hint inside its value control. */
const KIND_LABEL_KEYS: Record<RecipientKind, string> = {
  field: 'engine.inspector.recipients.kind.field',
  user: 'engine.inspector.recipients.kind.user',
  team: 'engine.inspector.recipients.kind.team',
  email: 'engine.inspector.recipients.kind.email',
  custom: 'engine.inspector.recipients.kind.custom',
};
const KIND_PLACEHOLDER_KEYS: Record<RecipientKind, string> = {
  field: 'engine.inspector.recipients.placeholder.field',
  user: 'engine.inspector.recipients.placeholder.user',
  team: 'engine.inspector.recipients.placeholder.team',
  email: 'engine.inspector.recipients.placeholder.email',
  custom: 'engine.inspector.recipients.placeholder.custom',
};

interface Row extends RecipientEntry {
  id: string;
}

function toRows(entries: RecipientEntry[]): Row[] {
  const ids: string[] = [];
  return entries.map((e) => {
    const id = uniqueId('rcp', ids);
    ids.push(id);
    return { id, ...e };
  });
}

export interface FlowRecipientsFieldProps {
  label: string;
  value: unknown;
  onCommit: (value: string | string[] | undefined) => void;
  disabled?: boolean;
  locale?: SupportedLocale | string;
  /** Draft + node, so a Record field row can read the trigger object. */
  context?: FlowReferenceContext;
  /** In-scope references for an Other row's `{var}` picker. */
  scopeGroups?: ScopeGroup[];
  /** The spec requires this key (objectui#10948). */
  required?: boolean;
}

export function FlowRecipientsField({
  label,
  value,
  onCommit,
  disabled,
  locale,
  context,
  scopeGroups,
  required,
}: FlowRecipientsFieldProps) {
  const storedAsString = typeof value === 'string';
  const external = React.useMemo(
    () => JSON.stringify(writeRecipients(readRecipients(value), storedAsString) ?? null),
    [value, storedAsString],
  );
  const [rows, setRows] = React.useState<Row[]>(() => toRows(readRecipients(value)));
  const lastCommitted = React.useRef(external);

  // An EXTERNAL change (another node selected, an undo) resyncs the rows; our
  // own commits do not, so a half-edited row keeps its focus.
  React.useEffect(() => {
    if (external !== lastCommitted.current) {
      setRows(toRows(readRecipients(value)));
      lastCommitted.current = external;
    }
  }, [external, value]);

  const flush = (next: Row[]) => {
    const out = writeRecipients(next, storedAsString);
    lastCommitted.current = JSON.stringify(out ?? null);
    onCommit(out);
  };

  // Each handler derives the next rows from the rows on screen and commits
  // outside the state updater, so a commit runs once per gesture.
  const patchRow = (id: string, patch: Partial<RecipientEntry>, commit: boolean) => {
    const next = rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
    setRows(next);
    if (commit) flush(next);
  };

  const addRow = () => {
    setRows([...rows, { id: uniqueId('rcp', rows.map((r) => r.id)), kind: 'field', value: '' }]);
  };

  const removeRow = (id: string) => {
    const next = rows.filter((r) => r.id !== id);
    setRows(next);
    flush(next);
  };

  const kindLabel = (k: RecipientKind) => t(KIND_LABEL_KEYS[k], locale);
  const placeholder = (k: RecipientKind) => t(KIND_PLACEHOLDER_KEYS[k], locale);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">
        {label}
        {required && <RequiredMarker />}
      </Label>
      <div className="space-y-2">
        {rows.length === 0 && (
          <p className="text-[11px] italic text-muted-foreground">{t('engine.inspector.recipients.empty', locale)}</p>
        )}
        {rows.map((row, index) => {
          const ref = KIND_REF[row.kind];
          const notEmail = row.kind === 'email' && row.value.trim() !== '' && !looksLikeEmail(row.value.trim());
          return (
            <div key={row.id} className="space-y-1" data-recipient-row={index}>
              <div className="flex items-center gap-1.5">
                <Select
                  value={row.kind}
                  // A new type starts empty: a user id is not a field name.
                  onValueChange={(k) => patchRow(row.id, { kind: k as RecipientKind, value: '' }, true)}
                  disabled={disabled}
                >
                  <SelectTrigger
                    className="h-8 w-[7.5rem] shrink-0 text-xs"
                    aria-label={t('engine.inspector.recipients.kindLabel', locale)}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECIPIENT_KINDS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {kindLabel(k)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="min-w-0 flex-1">
                  {ref ? (
                    <ReferenceCombobox
                      resolved={ref}
                      value={row.value}
                      onCommit={(v) => patchRow(row.id, { value: v == null ? '' : String(v) }, false)}
                      onBlur={() => flush(rows)}
                      onSelect={(v) => patchRow(row.id, { value: v }, true)}
                      disabled={disabled}
                      placeholder={placeholder(row.kind)}
                      context={context}
                      ariaLabel={kindLabel(row.kind)}
                    />
                  ) : row.kind === 'custom' ? (
                    <VariableTextInput
                      mode="template"
                      value={row.value}
                      onValueChange={(v) => patchRow(row.id, { value: v }, false)}
                      onBlur={() => flush(rows)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      }}
                      groups={scopeGroups ?? []}
                      placeholder={placeholder('custom')}
                      disabled={disabled}
                    />
                  ) : (
                    <Input
                      type="email"
                      value={row.value}
                      onChange={(e) => patchRow(row.id, { value: e.target.value }, false)}
                      onBlur={() => flush(rows)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      }}
                      placeholder={placeholder('email')}
                      aria-label={kindLabel('email')}
                      aria-invalid={notEmail || undefined}
                      disabled={disabled}
                      className="h-8 text-sm"
                    />
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 shrink-0 p-0 text-muted-foreground"
                  onClick={() => removeRow(row.id)}
                  disabled={disabled}
                  aria-label={t('engine.inspector.recipients.remove', locale)}
                  title={t('engine.inspector.recipients.remove', locale)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              {notEmail && (
                <p className="text-[11px] leading-snug text-amber-700 dark:text-amber-400" role="note">
                  {t('engine.inspector.recipients.notEmail', locale)}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 w-full text-xs"
        onClick={addRow}
        disabled={disabled}
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        {t('engine.inspector.recipients.add', locale)}
      </Button>
    </div>
  );
}
