// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#11773 — optimistic concurrency for Studio's metadata DRAFT saves.
 *
 * Two editors of one metadata item (two admins, or one admin in two tabs) used
 * to overwrite each other's drafts in silence: every draft save was a
 * whole-document last-writer-wins PUT, because no save sent the version it was
 * built on. The `/meta` PUT door honours `If-Match` on a `?mode=draft` write
 * (ADR-0008's `parentVersion`), and `MetadataClient.save` already sends its
 * `ifMatch` option as that header; nothing in app-shell passed one.
 *
 * ## Where the version comes from (measured, not read off a docblock)
 *
 * Against a running `@objectstack/*` 17.7.0 server — the release this repo
 * resolves — the draft-write door answered as follows (the readings are on the
 * pull request that landed this module):
 *
 *  - A draft SAVE answers `{ success, version, seq, state, message }`, and
 *    `version` is the token: the server's keyed digest of the stored content
 *    hash. No `ETag` header.
 *  - A draft READ (`GET …?state=draft`) serves no token at all — neither a body
 *    key nor an `ETag`. So the first save after an editor installs a buffer
 *    from a read cannot be pinned; it is sent without `If-Match`, exactly as
 *    every save was before. That half is the server's to add.
 *  - A save whose `If-Match` is not the current draft's token is refused
 *    `409 METADATA_CONFLICT`, and that includes ANY token sent when no draft row
 *    exists (after a publish or a discard dropped it).
 *  - `409 DESTRUCTIVE_CHANGE` is a different refusal, judged BEFORE the version;
 *    it is passed through untouched to the caller's own flow.
 *
 * ## One guard per editing buffer
 *
 * The version a guard holds describes the buffer it saves, so a guard belongs
 * to ONE buffer — never to an item globally. Two surfaces in one tab that each
 * hold their own copy of the same item are two editors: sharing one version
 * between them would let the second one's stale copy through. The rules:
 *
 *  1. A draft save sends `If-Match` = the version this guard holds for that
 *     same item (type, name, package), and nothing otherwise.
 *  2. A save that lands holds the receipt's `version`.
 *  3. A buffer installed from a server read (a load, an item switch, a reload
 *     after a publish or a discard) holds no version: the caller says so with
 *     `forget()`. A read-back of the guard's OWN save is not such an install.
 *  4. A `409 METADATA_CONFLICT` opens the conflict dialog: reload the saved
 *     version (the caller's reload runs; the buffer is replaced), overwrite it
 *     after a confirmation (re-sent without `If-Match`: the refusal carries the
 *     current version only inside its prose, which is not read), or keep
 *     editing (nothing is saved, and the stale version is kept so the next save
 *     is refused again rather than slipping through).
 *  5. Saves through one guard run one at a time, so each sends the version the
 *     previous one received and an autosave never conflicts with the save the
 *     same buffer sent a moment earlier.
 *
 * A create sends no `If-Match` — the door cannot express "expect no row" over
 * HTTP — so callers that create keep calling the client directly.
 */

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  buttonVariants,
  cn,
} from '@object-ui/components';
import type { MetadataClient, MetadataClientSaveOptions } from '@object-ui/data-objectstack';
import { errorCodeIs } from '@object-ui/types';
import { t, tFormat, translateMetadataType, useMetadataLocale } from './i18n.js';

/** What a guarded save ended in, when it did not throw. */
export type DraftSaveOutcome = 'saved' | 'reloaded';

/** The author's answer to a conflict. */
export type DraftConflictChoice = 'reload' | 'overwrite' | 'cancel';

/** The item a refused save addressed. */
export interface DraftConflict {
  type: string;
  name: string;
}

/**
 * The version-conflict refusal of the `/meta` draft door, told apart from the
 * door's OTHER 409 (`DESTRUCTIVE_CHANGE`) by its code, never by its prose.
 */
export function isDraftVersionConflict(err: unknown): boolean {
  return (err as { status?: unknown } | null | undefined)?.status === 409 && errorCodeIs(err, 'METADATA_CONFLICT');
}

interface HeldVersion {
  key: string;
  version: string;
}

function itemKey(type: string, name: string, packageId: string | null | undefined): string {
  return JSON.stringify([type, name, packageId ?? null]);
}

function receiptVersion(receipt: unknown): string | null {
  const version = (receipt as { version?: unknown } | null | undefined)?.version;
  return typeof version === 'string' && version.length > 0 ? version : null;
}

export interface DraftVersionGuardDeps {
  /** The client to save through, read at the moment of the save. */
  client: () => Pick<MetadataClient, 'save'>;
  /** Ask the author how to resolve a conflict. */
  ask: (conflict: DraftConflict) => Promise<DraftConflictChoice>;
  /** Replace the buffer with the saved version (the caller's load). */
  reload: () => void;
  /** The error a save the author chose not to send ends in. */
  notSaved: (conflict: DraftConflict) => Error;
}

/**
 * The React-free half of the guard: the version held for one buffer, the
 * one-at-a-time queue, and the conflict branch. {@link useDraftSaveGuard} binds
 * it to a client, a dialog and the caller's reload.
 */
export class DraftVersionGuard {
  private held: HeldVersion | null = null;
  private tail: Promise<void> | null = null;
  /** Bumped by a reload: a save queued before it carries the replaced buffer. */
  private epoch = 0;

  constructor(private deps: DraftVersionGuardDeps) {}

  /** Re-bind inputs that change between renders (the client, the reload, the locale's text). */
  bind(deps: Pick<DraftVersionGuardDeps, 'client' | 'reload' | 'notSaved'>): void {
    this.deps = { ...this.deps, ...deps };
  }

  /** The version held, for the item `save` would address (tests read it). */
  heldFor(type: string, name: string, packageId?: string | null): string | null {
    return this.held?.key === itemKey(type, name, packageId) ? this.held.version : null;
  }

  /** The buffer was installed from a server read: no version describes it. */
  forget = (): void => {
    this.held = null;
  };

  /**
   * Save `item` through the client. A non-draft save (no `mode: 'draft'`) is
   * passed straight through: the guard pins drafts only.
   */
  save = (
    type: string,
    name: string,
    item: unknown,
    options: MetadataClientSaveOptions = {},
  ): Promise<DraftSaveOutcome> => {
    if (options.mode !== 'draft') {
      return this.deps.client().save(type, name, item, options).then(() => 'saved' as const);
    }
    const epoch = this.epoch;
    const run = (): Promise<DraftSaveOutcome> => this.run(epoch, type, name, item, options);
    // Started at once when nothing is in flight, so the request leaves in the
    // same tick as before; queued behind the save in flight otherwise.
    const result = this.tail ? this.tail.then(run) : run();
    const settled = result.then(
      () => undefined,
      () => undefined,
    );
    this.tail = settled;
    void settled.then(() => {
      if (this.tail === settled) this.tail = null;
    });
    return result;
  };

  private async run(
    epoch: number,
    type: string,
    name: string,
    item: unknown,
    options: MetadataClientSaveOptions,
  ): Promise<DraftSaveOutcome> {
    // The author chose to reload while this save waited: its buffer is gone.
    if (epoch !== this.epoch) return 'reloaded';
    const key = itemKey(type, name, options.packageId);
    const pinned = this.held?.key === key ? this.held.version : null;
    const client = this.deps.client();
    try {
      const receipt = await client.save(type, name, item, pinned ? { ...options, ifMatch: pinned } : options);
      this.hold(key, receipt);
      return 'saved';
    } catch (err) {
      if (!isDraftVersionConflict(err)) throw err;
      const conflict: DraftConflict = { type, name };
      const choice = await this.deps.ask(conflict);
      if (choice === 'reload') {
        this.held = null;
        this.epoch += 1;
        this.deps.reload();
        return 'reloaded';
      }
      if (choice === 'overwrite') {
        // Unpinned from here on: the author has seen that the draft moved and
        // chose this buffer over it, so a refusal of the re-send for another
        // reason (a destructive change to confirm) retries unpinned too.
        this.held = null;
        const receipt = await client.save(type, name, item, options);
        this.hold(key, receipt);
        return 'saved';
      }
      throw this.deps.notSaved(conflict);
    }
  }

  private hold(key: string, receipt: unknown): void {
    const version = receiptVersion(receipt);
    this.held = version ? { key, version } : null;
  }
}

export interface DraftSaveGuard {
  /** A guarded `client.save` — same arguments, resolves what it ended in. */
  save: DraftVersionGuard['save'];
  /** Call where the buffer is installed from a server read (rule 3 above). */
  forget: () => void;
  /** The conflict dialog; render it once, anywhere in the caller's tree. */
  dialog: React.ReactElement;
}

/**
 * One guard for one editing buffer. `onReload` replaces the buffer with the
 * saved version — the caller's own load, re-run.
 */
export function useDraftSaveGuard(client: Pick<MetadataClient, 'save'>, onReload: () => void): DraftSaveGuard {
  const locale = useMetadataLocale();
  const [pending, setPending] = React.useState<{
    conflict: DraftConflict;
    resolve: (choice: DraftConflictChoice) => void;
  } | null>(null);
  const notSavedIn = (lang: string) => (conflict: DraftConflict) =>
    new Error(
      tFormat('engine.draftConflict.notSaved', lang, {
        type: translateMetadataType(conflict.type, lang),
        name: conflict.name,
      }),
    );
  // A state initializer, not a memo: the guard and the version it holds must
  // outlive any render (AGENTS.md #10). Its per-render inputs are re-bound
  // below, after every commit.
  const [guard] = React.useState(
    () =>
      new DraftVersionGuard({
        client: () => client,
        ask: (conflict) =>
          new Promise<DraftConflictChoice>((resolve) => {
            setPending({ conflict, resolve });
          }),
        reload: onReload,
        notSaved: notSavedIn(locale),
      }),
  );
  React.useLayoutEffect(() => {
    guard.bind({ client: () => client, reload: onReload, notSaved: notSavedIn(locale) });
  });
  // A dialog left open by an unmount answers "keep editing": nothing is sent.
  const pendingRef = React.useRef(pending);
  React.useLayoutEffect(() => {
    pendingRef.current = pending;
  });
  React.useEffect(() => () => pendingRef.current?.resolve('cancel'), []);
  const choose = React.useCallback((choice: DraftConflictChoice) => {
    const asked = pendingRef.current;
    setPending(null);
    asked?.resolve(choice);
  }, []);
  return {
    save: guard.save,
    forget: guard.forget,
    dialog: <DraftConflictDialog conflict={pending?.conflict ?? null} onChoose={choose} />,
  };
}

export interface DraftConflictDialogProps {
  /** The refused save's item; `null` keeps the dialog closed. */
  conflict: DraftConflict | null;
  onChoose: (choice: DraftConflictChoice) => void;
}

/**
 * Tells the author their draft save was refused because the draft changed
 * since they loaded it, and offers the two ruled ways out: reload the saved
 * version, or overwrite it with this buffer after a second, explicit
 * confirmation. Closing it keeps the author's edits on screen, unsaved.
 */
export function DraftConflictDialog({ conflict, onChoose }: DraftConflictDialogProps): React.ReactElement {
  const locale = useMetadataLocale();
  const [confirming, setConfirming] = React.useState(false);
  const open = conflict !== null;
  // Every way out lands the next conflict on the first step again.
  const finish = (choice: DraftConflictChoice): void => {
    setConfirming(false);
    onChoose(choice);
  };
  const vars = {
    type: conflict ? translateMetadataType(conflict.type, locale) : '',
    name: conflict?.name ?? '',
  };
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) finish('cancel');
      }}
    >
      <AlertDialogContent data-testid="draft-conflict-dialog">
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <span
              className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
              aria-hidden="true"
            >
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <AlertDialogTitle>
                {confirming
                  ? t('engine.draftConflict.overwriteTitle', locale)
                  : t('engine.draftConflict.title', locale)}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1">
                {confirming
                  ? tFormat('engine.draftConflict.overwriteDescription', locale, vars)
                  : tFormat('engine.draftConflict.description', locale, vars)}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          {confirming ? (
            <>
              <button
                type="button"
                data-testid="draft-conflict-back"
                onClick={() => setConfirming(false)}
                className={cn(buttonVariants({ variant: 'ghost' }), 'mt-2 sm:mt-0')}
              >
                {t('engine.draftConflict.back', locale)}
              </button>
              <button
                type="button"
                data-testid="draft-conflict-overwrite-confirm"
                onClick={() => finish('overwrite')}
                className={cn(buttonVariants({ variant: 'destructive' }), 'mt-2 sm:mt-0')}
              >
                {t('engine.draftConflict.overwriteConfirm', locale)}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                data-testid="draft-conflict-cancel"
                onClick={() => finish('cancel')}
                className={cn(buttonVariants({ variant: 'ghost' }), 'mt-2 sm:mt-0')}
              >
                {t('engine.draftConflict.keepEditing', locale)}
              </button>
              <button
                type="button"
                data-testid="draft-conflict-overwrite"
                onClick={() => setConfirming(true)}
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'mt-2 sm:mt-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive',
                )}
              >
                {t('engine.draftConflict.overwrite', locale)}
              </button>
              <button
                type="button"
                data-testid="draft-conflict-reload"
                onClick={() => finish('reload')}
                className={cn(buttonVariants({ variant: 'default' }), 'mt-2 sm:mt-0')}
              >
                {t('engine.draftConflict.reload', locale)}
              </button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
