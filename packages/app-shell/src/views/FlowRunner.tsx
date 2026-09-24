/**
 * FlowRunner — renders the interactive `screen` of a paused screen-flow run
 * (framework screen-flow runtime, ADR-0019) and resumes it with the collected
 * input.
 *
 * A `type: 'flow'` action launches a flow; when the run pauses at a `screen`
 * node the launch response carries `{ status: 'paused', runId, screen }`. The
 * host view (ObjectView / RecordDetailView) opens this modal with that state.
 * On submit it POSTs `/api/v1/automation/{flow}/runs/{runId}/resume` with the
 * field values as `inputs`; a `paused` response renders the next screen
 * (multi-screen wizards), a terminal response closes and refreshes the view.
 *
 * The screen BODY (flat fields / object-form) is rendered by the shared
 * {@link ScreenView} — the same renderer the Studio design preview reuses, so
 * the two can never drift (cf. #1927).
 *
 * ## The resume RESULT has to reach the user (objectui#5417)
 *
 * A dogfood walkthrough reported that a `400 FLOW_FAILED` and a successful run
 * "render identically: the dialog closes and the page is unchanged". Half of
 * that was already fixed by the time it was triaged — `interpretFlowResponse`
 * reads the ADR-0112 envelope and the `toast.error` below has carried its prose
 * since #4899 — but three gaps survived, and they are what this component now
 * answers:
 *
 * 1. **A terminal failure closed the dialog, taking the user's input with it.**
 *    The reason it closed is still sound and is NOT reversed here: on a
 *    `FLOW_FAILED` the engine has already consumed the suspension
 *    (resume-once), so a retry can only reach "No suspended run", and offering
 *    one is a lie. What #4899 concluded from that — *close* — is one way to
 *    withhold the dead retry, and it is the expensive one: the user has just
 *    typed a form they can no longer see, and the sentence explaining the
 *    refusal names a value that is now gone from the screen. So the dialog
 *    stays OPEN and the run's disposition is expressed the narrow way instead:
 *    `retryable === false` withdraws the submit affordance (the flat footer
 *    swaps Submit for a single Close; an `object-form` step drops `showSubmit`,
 *    which also stops a second Save from creating a DUPLICATE record — its
 *    first one was already persisted before the resume failed). Nothing offers
 *    a retry that cannot work; the input and the reason stay on screen
 *    together.
 * 2. **The message had one carrier, and it was the transient one.** The toast
 *    is kept — it is the console's failure idiom and it is viewport-fixed, so
 *    it survives a tall `object-form` step scrolled past its own header — and
 *    an inline destructive `Alert` (`role="alert"`) now carries the same
 *    sentence inside the dialog, next to the values that produced it.
 * 3. **Success invalidated the wrong thing.** Both hosts answer `onComplete`
 *    with `notifyDataChanged({ objectName: <this page's object> })`, which is
 *    the record the user is LOOKING at — never the record the flow WROTE. The
 *    reported run created a `crm_quote` from an Opportunity page, so the
 *    related list that would now contain it was never told, and the quote did
 *    not appear until a manual reload. This component cannot know which objects
 *    a flow touched (reading that out of the flow's output is a contract
 *    question, deliberately not answered here), so it invalidates `'*'` — the
 *    same scope, for the same stated reason, that `RecordDetailView`'s manual ⟳
 *    uses: everything mounted refetches in place over the #2269 bus, with no
 *    remount, so tab / scroll / inline-edit state all survive (AGENTS.md §5 #8).
 *
 * ## A REFUSED end is a notice, not a completion (objectui#7707)
 *
 * A flow can now end by saying no: an `end` node declaring `outcome: 'refused'`
 * carries a `message` template the engine interpolates per-record, and the run
 * records `refused` — terminal like `completed`, distinct from `failed` because
 * nothing went wrong (the maintainer ruling on objectstack#14945, whose contract
 * half is on the installed `@objectstack/spec` surface).
 *
 * Before that outcome existed the only channel that could interpolate
 * per-record text was a message-only `screen` node, which is an INPUT step
 * wearing a notice's clothes: it renders Submit, and submitting resumes the run
 * to `end`, where the terminal-success branch below toasted `Flow "…"
 * completed` at a user who had just been told the run was refused.
 *
 * So on `refused` this component renders the engine's sentence as a plain
 * (non-destructive) notice and takes the terminal disposition it already had a
 * route to: Submit withdrawn, a single Close. What it does NOT do is as ruled
 * as what it does — no toast of either colour, no `onComplete`, no
 * invalidation. The invoking action stays quiet on its own account, exactly as
 * today: a paused run returns `{ success: true, silent: true }` and `silent`
 * suppresses the action's `successMessage` at the ActionRunner's toast sink.
 * ⛔ That last part is a thing that WORKS — it is pinned, not touched.
 *
 * ## The AUTHOR's copy is localized here; the chrome is not (objectui#5920)
 *
 * A screen's heading and each field's `label` / `placeholder` are the flow
 * author's words, and an app's translation bundle carries them under
 * `flows.<flow>.screens.<node_id>` (`TranslationData.flows`, the vocabulary
 * objectstack#7646 declared). The server puts them on the wire in the source
 * language, so the overlay is applied on this side of it — the client already
 * holds both addresses, `ScreenSpec.nodeId` and `ScreenFieldSpec.name`, which
 * is why objectstack#11287 picked the client side.
 *
 * WHAT resolves is the spec's decision, not this file's: the heading goes
 * through `resolveFlowScreenTitle`, and the per-field overlay walks
 * `FLOW_SCREEN_FIELD_COPY_KEYS` — imported, never retyped, so a key the spec
 * adds or drops reaches this dialog without an edit here. Every key falls back
 * to the authored string on its own: a bundle that translates the heading but
 * not a field leaves that field in the author's language, never blank.
 *
 * WHERE the bundle comes from is the channel the console already has: the
 * provider's `loadLanguage` hands the app's translation payload to i18next
 * (`transformSpecTranslations` forwards `flows` verbatim under the app
 * namespace), and {@link activeFlowsBundle} reads it back out of that resource
 * tree for the active language. There is no second loader.
 *
 * Deliberately NOT localized here, each by ruling rather than by omission:
 *
 * - the screen `description` — outside the spec's flows face (in neither key
 *   list), so an off-spec `description` a bundle carries anyway is ignored and
 *   the authored text is drawn;
 * - the runner chrome (Cancel / Submit / Submitting… / the terminal toast) —
 *   the console's own words, ruled into its message catalog (objectstack#7646);
 * - `FlowSchema.successMessage` — off the translation surface by design.
 *
 * ⚠️ One boundary of the client-side pick: the server interpolates `{var}`
 * tokens in the heading before it reaches the wire, and the wire does not carry
 * the variables, so a translated heading is drawn exactly as the bundle wrote
 * it — a token inside it renders literally.
 *
 * Chrome goes through `@object-ui/i18n` (via the `@object-ui/react` re-export)
 * like its neighbours; the only English left in this file is the inline
 * `defaultValue` each key carries, which `check:i18n-keys` pins to its `en`
 * value. The server's own refusal sentence is passed through untranslated by
 * design — it is prose the backend composed, not a string with a key.
 */
import { Suspense, useEffect, useState } from 'react';
import {
  Alert,
  AlertDescription,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  Button,
} from '@object-ui/components';
import { notifyDataChanged, useObjectTranslation } from '@object-ui/react';
import {
  FLOW_SCREEN_FIELD_COPY_KEYS,
  resolveFlowScreenTitle,
  type TranslationBundle,
  type TranslationData,
} from '@objectstack/spec/system';
import { toast } from 'sonner';
import {
  ScreenView,
  isObjectFormScreen,
  initialScreenValues,
  visibleScreenFields,
  type ScreenFieldSpec,
  type ScreenSpec,
} from './ScreenView.js';
import { interpretFlowResponse } from '../utils/flowResponse.js';

export type { ScreenSpec, ScreenFieldSpec } from './ScreenView.js';

/** The `flows` group of a spec `TranslationData` — typed by the spec, so the address below is checked against it. */
type FlowsTranslation = NonNullable<TranslationData['flows']>;

/** The per-field copy node, `flows.<flow>.screens.<node_id>.fields.<field_name>`. */
type FlowScreenFieldTranslation = NonNullable<
  NonNullable<NonNullable<FlowsTranslation[string]['screens']>[string]['fields']>[string]
>;

/**
 * The one member of the i18next instance the bundle read needs. Optional,
 * because outside a provider react-i18next hands back a placeholder object
 * that has none — and then there is no bundle, only the authored copy.
 */
interface TranslationResourceReader {
  getResourceBundle?: (lng: string, ns: string) => unknown;
}

/**
 * The active language's `flows` group as a spec `TranslationBundle`, read out
 * of the i18next resource tree the console already loaded (see the header), or
 * `undefined` when that tree translates nothing for `flowName`.
 *
 * App translations sit under an app namespace at the top of that tree (`app`
 * for a spec payload, whatever the payload named for an already-namespaced
 * one), so the first namespace whose `flows` group addresses this flow is the
 * one read. The bundle is keyed by `language` itself, and the resolvers are
 * asked for `language` with no fallback chain: a string the active language
 * does not carry falls back to the author's copy, never to a third locale.
 */
function activeFlowsBundle(
  i18n: TranslationResourceReader | undefined,
  language: string,
  flowName: string,
): TranslationBundle | undefined {
  if (!flowName || typeof i18n?.getResourceBundle !== 'function') return undefined;
  const tree = i18n.getResourceBundle(language, 'translation');
  if (!tree || typeof tree !== 'object') return undefined;
  for (const namespace of Object.values(tree as Record<string, unknown>)) {
    const flows = (namespace as { flows?: unknown } | null)?.flows;
    if (flows && typeof flows === 'object' && (flows as Record<string, unknown>)[flowName]) {
      return { [language]: { flows: flows as FlowsTranslation } };
    }
  }
  return undefined;
}

/** One field with the spec's per-field copy keys overlaid, each key falling back to the authored value. */
function overlayFieldCopy(field: ScreenFieldSpec, copy: FlowScreenFieldTranslation | undefined): ScreenFieldSpec {
  if (!copy) return field;
  let next = field;
  for (const key of FLOW_SCREEN_FIELD_COPY_KEYS) {
    const translated = copy[key];
    if (typeof translated === 'string' && translated.length > 0) next = { ...next, [key]: translated };
  }
  return next;
}

/**
 * The screen as the user should read it: the heading through the spec's
 * `resolveFlowScreenTitle`, the fields through `FLOW_SCREEN_FIELD_COPY_KEYS`.
 * Everything else — `description` included — is the payload, untouched. With
 * no bundle the input comes back as-is.
 */
function localizeScreen(
  screen: ScreenSpec,
  flowName: string,
  bundle: TranslationBundle | undefined,
  language: string,
): ScreenSpec {
  if (!bundle) return screen;
  const title = resolveFlowScreenTitle(bundle, flowName, screen, { locale: language });
  const fieldCopy = bundle[language]?.flows?.[flowName]?.screens?.[screen.nodeId]?.fields;
  const fields =
    fieldCopy && Array.isArray(screen.fields)
      ? screen.fields.map((field) => overlayFieldCopy(field, fieldCopy[field.name]))
      : screen.fields;
  return { ...screen, title, fields };
}

export interface ScreenFlowState {
  flowName: string;
  runId: string;
  screen: ScreenSpec;
}

/**
 * A refused resume, held so the dialog can show it beside the input that
 * produced it. `retryable` is `interpretFlowResponse`'s verdict, forwarded
 * unchanged: `false` means the suspension is gone and no resubmit of this run
 * can succeed, so the submit affordance is withdrawn (see the header note).
 */
interface ResumeError {
  message: string;
  retryable: boolean;
}

/**
 * A run that ended with `outcome: 'refused'`, held so the dialog can render it
 * as a notice (objectui#7707). Kept SEPARATE from {@link ResumeError} rather
 * than reusing it with `retryable: false`, because the two are different events
 * that happen to share a disposition: a failure is something that went wrong
 * and reads as `destructive` with an error toast, while a refusal is the flow
 * working — a successful evaluation that said no. Collapsing them would make
 * the renderer unable to tell them apart again.
 *
 * `message` is the sentence the ENGINE rendered (the `end` node's `{token}`
 * template interpolated against the run's variables, so it names the record);
 * it is passed through untranslated for the same reason the server's refusal
 * sentence above is — it is data, not copy with a key.
 */
interface RefusedOutcome {
  message: string;
}

export interface FlowRunnerProps {
  /** The paused screen-flow to drive, or `null` when closed. */
  state: ScreenFlowState | null;
  /** Authenticated fetch (shared with the host view). */
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
  /** API base (e.g. `import.meta.env.VITE_SERVER_URL || ''`). */
  baseUrl: string;
  /** User dismissed the runner without completing. */
  onClose: () => void;
  /** The flow ran to completion — host should refresh. */
  onComplete: () => void;
  /**
   * Data source — required to render `object-form` wizard steps. ObjectForm
   * fetches the object schema and persists (incl. atomic master-detail batch)
   * through this adapter.
   */
  dataSource?: any;
  /**
   * Object definitions — used to derive an `object-form` step's inline
   * master-detail `subforms` (mirrors RecordFormPage's create form).
   */
  objects?: any[];
}

export function FlowRunner({ state, authFetch, baseUrl, onClose, onComplete, dataSource, objects }: FlowRunnerProps) {
  const { t, i18n, language } = useObjectTranslation();
  const [screen, setScreen] = useState<ScreenSpec | null>(null);
  const [runId, setRunId] = useState('');
  const [flowName, setFlowName] = useState('');
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [resumeError, setResumeError] = useState<ResumeError | null>(null);
  const [refused, setRefused] = useState<RefusedOutcome | null>(null);

  useEffect(() => {
    if (state) {
      setScreen(state.screen);
      setRunId(state.runId);
      setFlowName(state.flowName);
      setValues(initialScreenValues(state.screen));
      // A fresh run must not open under the previous run's refusal.
      setResumeError(null);
      setRefused(null);
    }
  }, [state]);

  if (!state || !screen) return null;

  // The copy the user reads (objectui#5920 — see the header). Recomputed on
  // every render rather than memoised: it is a handful of property reads, and
  // it follows the live resource tree and a language switch with no identity
  // to keep stable (AGENTS.md §5 #10). `screen` stays the payload the run is
  // driven by; `shown` differs from it in copy only, so every DISPLAY read —
  // including the names in the missing-fields toast below — goes through it.
  const shown = localizeScreen(screen, flowName, activeFlowsBundle(i18n, language, flowName), language);

  const setVal = (name: string, v: unknown) => {
    setValues((p) => ({ ...p, [name]: v }));
    // Editing is the start of a retry, so the banner it answers goes — but only
    // where a retry exists. A terminal refusal must stay on screen: its whole
    // job is to explain why the (now absent) Submit is not coming back.
    setResumeError((e) => (e && e.retryable ? null : e));
  };

  // Resume the paused run with `inputs` (applied as bare flow variables) and
  // advance: render the next screen (multi-step wizard) or finish + refresh.
  // Shared by the flat-field submit and the object-form save callback.
  const resumeWith = async (inputs: Record<string, unknown>): Promise<void> => {
    const res = await authFetch(
      `${baseUrl}/api/v1/automation/${encodeURIComponent(flowName)}/runs/${encodeURIComponent(runId)}/resume`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inputs }) },
    );
    const json = await res.json().catch(() => null);
    // Shared with the two flow-LAUNCH handlers (useConsoleActionRuntime,
    // RecordDetailView) so the resume path and the launch path can never again
    // disagree about what a failure looks like — they did, and the launch
    // copies reported failures as success (#2958). `outcome.error` is always a
    // STRING: handing the nested `{code, message}` object to `toast.error()`
    // renders nothing at best and crashes the page as a React child (React
    // #31). See utils/flowResponse.
    const outcome = interpretFlowResponse<ScreenSpec>(res, json, 'Resume');
    if (outcome.kind === 'failed') {
      // Two carriers on purpose (#5417): the toast is fixed to the viewport and
      // reaches a user scrolled to the bottom of a tall object-form step; the
      // inline Alert stays with the values that caused it.
      toast.error(outcome.error);
      setResumeError({ message: outcome.error, retryable: outcome.retryable });
      return;
    }
    setResumeError(null);
    // The run reached an `end` node declaring `outcome: 'refused'` — a
    // successful evaluation that said no (objectstack#14945, ruling of
    // 2026-09-05). Checked BEFORE the terminal-success tail below, which is
    // where it used to land: the refusal was swallowed and the user who had
    // just been told "this is refused" got `Flow "…" completed`.
    //
    // Three things deliberately do NOT happen here, and each is the ruling:
    // no toast (neither the completion one this replaces nor an error one —
    // nothing failed), no `notifyDataChanged` / `onComplete` (the run did not
    // complete; the host is not told to treat its data as stale), and no
    // close (the notice is the whole point, so it stays up until the user
    // dismisses it).
    if (outcome.kind === 'refused') {
      setRefused({ message: outcome.message });
      return;
    }
    if (outcome.kind === 'paused') {
      setScreen(outcome.screen);
      setRunId(outcome.runId || runId);
      setValues(initialScreenValues(outcome.screen));
      toast.success(t('flowRunner.nextStep', { defaultValue: 'Saved — next step' }));
    } else {
      // Terminal success — show the flow's declared completion message.
      toast.success(
        outcome.successMessage
          || t('flowRunner.completed', { flow: flowName, defaultValue: 'Flow "{{flow}}" completed' }),
      );
      // The flow may have written ANY object — a quote created from an
      // Opportunity page lands in a related list this component cannot name.
      // See the header note on why the scope is `'*'` and not the host record.
      notifyDataChanged({ objectName: '*' });
      onComplete();
    }
  };

  const submit = async () => {
    // Enforce `required` over the fields ACTUALLY ON SCREEN, not the whole
    // declared list. A `visibleWhen` field that is required *when shown* is not
    // required while hidden — the user was never asked for it, and the flow is
    // not waiting on it. Validating the full list here is what dead-ended
    // #3528: HotCRM's lead conversion declares `opportunityName` required with
    // `visibleWhen: createOpportunity == true`, so leaving the checkbox
    // unticked blocked Submit on an input that was not on screen, and the run
    // sat paused with no resume request ever issued.
    const missing = visibleScreenFields(shown, values).filter(
      (f) => f.required && (values[f.name] === undefined || values[f.name] === '' || values[f.name] === null),
    );
    if (missing.length) {
      toast.error(
        t('wizard.missingRequired', {
          fields: missing.map((f) => f.label || f.name).join(', '),
          defaultValue: 'Please complete the required fields: {{fields}}',
        }),
      );
      return;
    }
    setSubmitting(true);
    try {
      await resumeWith(values);
    } catch (err) {
      // The request never produced a response (network / abort), so the
      // suspension was not consumed — this one IS retryable.
      const message = (err as Error).message;
      toast.error(message);
      setResumeError({ message, retryable: true });
    } finally {
      setSubmitting(false);
    }
  };

  // Object-form step: ObjectForm has already persisted the record (and its
  // children, atomically). Resume the run with the new record's id bound to the
  // step's `idVariable` so later steps can reference it (e.g. the Opportunity
  // form's `account` FK = the Customer step's new id).
  const onObjectFormSaved = async (saved: any) => {
    const id = saved?.id ?? saved?.data?.id ?? saved?.record?.id;
    const inputs = screen.idVariable && id != null ? { [screen.idVariable]: id } : {};
    setSubmitting(true);
    try {
      await resumeWith(inputs);
    } catch (err) {
      const message = (err as Error).message;
      toast.error(message);
      setResumeError({ message, retryable: true });
    } finally {
      setSubmitting(false);
    }
  };

  const isObjectForm = isObjectFormScreen(screen);
  // The run is gone: this dialog can still be read and copied from, but nothing
  // in it may offer to resubmit. See the header note. A refusal reaches the same
  // disposition by the other route — the run ended, deliberately, and a refused
  // end is never resumed — so it shares this flag rather than a parallel one:
  // withdrawing the submit affordance is one behaviour with two causes, and
  // splitting it is how the `object-form` arm of it gets forgotten.
  const terminal = refused !== null || (resumeError !== null && !resumeError.retryable);

  return (
    <Dialog open onOpenChange={(o) => { if (!o && !submitting) onClose(); }}>
      <DialogContent className={isObjectForm ? 'sm:max-w-3xl max-h-[90vh] overflow-y-auto' : 'sm:max-w-md'}>
        <DialogHeader>
          <DialogTitle>{shown.title || t('flowRunner.title', { defaultValue: 'Input' })}</DialogTitle>
          {/* Authored and untranslated on purpose: `description` is outside the
              spec's flows face (see the header). */}
          {shown.description && <DialogDescription>{shown.description}</DialogDescription>}
        </DialogHeader>

        {refused && refused.message && (
          // `default`, not `destructive`: a refusal is the flow working. The
          // sentence is the engine's, rendered per-record from the `end` node's
          // template, and is passed through verbatim and untranslated — data,
          // not copy with a key, exactly like the server sentence below.
          <Alert>
            <AlertDescription>{refused.message}</AlertDescription>
          </Alert>
        )}

        {resumeError && (
          <Alert variant="destructive">
            {/* The server composed this sentence for a human — ADR-0112
                `error.message` is already user-grade prose ("Node 'create_quote'
                failed: … at most 2 decimal places"). It is passed through
                verbatim and untranslated: it is data, not copy with a key. */}
            <AlertDescription>{resumeError.message}</AlertDescription>
          </Alert>
        )}

        {/* The screen body pulls in lazily-loaded chunks (an `object-form` step
            mounts ObjectForm, whose field widgets are lazy). Without a boundary
            HERE, that suspension unwinds to the host's nearest <Suspense> — a
            route-level one on some surfaces — which swaps the whole page for a
            fallback and destroys the host's state, taking this dialog (and the
            run it is driving) with it. */}
        <Suspense fallback={<div className="py-6 text-sm text-muted-foreground">{t('common.loading', { defaultValue: 'Loading…' })}</div>}>
          <ScreenView
            screen={shown}
            values={values}
            onValueChange={setVal}
            dataSource={dataSource}
            objects={objects}
            objectForm={{
              onSuccess: onObjectFormSaved,
              onCancel: onClose,
              // Withdrawn once the run is gone: the record this step created was
              // already persisted, so a second Save would duplicate it AND still
              // have no suspension to resume.
              showSubmit: !terminal,
              showCancel: true,
              submitText: t('flowRunner.saveAndContinue', { defaultValue: 'Save & Continue' }),
              cancelText: terminal
                ? t('common.close', { defaultValue: 'Close' })
                : t('common.cancel', { defaultValue: 'Cancel' }),
            }}
          />
        </Suspense>

        {!isObjectForm && (
          <DialogFooter>
            {terminal ? (
              <Button variant="outline" onClick={onClose}>{t('common.close', { defaultValue: 'Close' })}</Button>
            ) : (
              <>
                <Button variant="outline" onClick={onClose} disabled={submitting}>{t('common.cancel', { defaultValue: 'Cancel' })}</Button>
                <Button onClick={submit} disabled={submitting}>
                  {submitting
                    ? t('flowRunner.submitting', { defaultValue: 'Submitting…' })
                    : t('common.submit', { defaultValue: 'Submit' })}
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
