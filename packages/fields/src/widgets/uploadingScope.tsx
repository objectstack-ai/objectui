import * as React from 'react';

/**
 * An ambient "is any upload still in flight?" scope for a whole form subtree.
 *
 * ## Why this exists beside `onUploadingChange`, and why it is not a second contract
 *
 * `onUploadingChange` (ADR-0059) is a PER-WIDGET prop: a host that renders one
 * upload control and knows its name can pass a callback and keep the answer
 * itself. That is `ActionParamDialog`, which holds a `Record<paramName, boolean>`
 * because it lays out its own params one by one.
 *
 * A record form cannot do that. Its fields are rendered by the `form` node
 * renderer from a `fields` array — the host hands over a list of field configs
 * and never touches the widget — and its upload widgets may sit an arbitrary
 * number of levels down (a section, a tab, a line-items subform). There is no
 * place in that chain where the form host can attach a per-widget callback, so
 * a record form was left with no notion of upload state at all and could submit
 * mid-upload: the record was written WITHOUT the attachment and reported
 * success (objectui#10166).
 *
 * The scope is the aggregation, not a second producer. `useUploadingSignal` is
 * still the ONE place a widget's in-flight state is published; it drives the
 * host prop and this scope from that same call, so the two can never disagree.
 * A widget reports nothing extra and knows nothing about the scope, and a host
 * that mounts no provider (every host on `main` today) is unaffected — the
 * context read answers `null` and the reporting hook is inert.
 */

/**
 * The write half of a scope. Kept separate from the boolean so a widget that
 * only REPORTS does not re-render when some other widget's upload flips —
 * reporters read this context, the host owns the boolean.
 */
interface UploadingScopeSink {
  /**
   * Record whether the widget registered under `id` is currently uploading.
   * Reporting `false` for an unknown id is a no-op, which is what makes the
   * unmount release below safe to call unconditionally.
   */
  report: (id: string, uploading: boolean) => void;
}

const UploadingScopeSinkContext = React.createContext<UploadingScopeSink | null>(null);

/** What {@link useUploadingScope} hands a host. */
export interface UploadingScope {
  /** True while at least one upload widget inside the scope is in flight. */
  anyUploading: boolean;
  /**
   * Passed to {@link UploadingScopeProvider}. Opaque to the host: it is the
   * channel the widgets report on, not state the host is meant to read.
   */
  sink: UploadingScopeSink;
}

/**
 * Own an uploading scope. The host reads `anyUploading` to gate its own submit
 * and to say WHY that control is disabled, and renders its form subtree inside
 * {@link UploadingScopeProvider}.
 *
 * The host owns the state rather than reading it back out of the context on
 * purpose: a provider cannot consume its own value, and splitting it would give
 * "is anything uploading" two authors.
 */
export function useUploadingScope(): UploadingScope {
  // The ids currently in flight, not a count: a widget that reports `true`
  // twice (a re-mount under the same `useId`, a double-fired effect under
  // StrictMode) must not be able to leave a counter permanently above zero,
  // which would wedge Save forever with no way out.
  const [inFlight, setInFlight] = React.useState<readonly string[]>([]);

  const sink = React.useMemo<UploadingScopeSink>(
    () => ({
      report(id, uploading) {
        setInFlight((prev) => {
          const known = prev.includes(id);
          // Returning the SAME array when nothing changed is what keeps an
          // idle form from re-rendering on every widget mount.
          if (uploading === known) return prev;
          return uploading ? [...prev, id] : prev.filter((x) => x !== id);
        });
      },
    }),
    // Identity is a render-cost hint only (AGENTS.md #10): the updater is
    // functional, so a recomputed `sink` behaves identically.
    [],
  );

  return { anyUploading: inFlight.length > 0, sink };
}

/**
 * Publish a host's {@link useUploadingScope} to every upload widget rendered
 * below it. Nesting is legal and the inner scope wins — a line-items subform
 * with its own Save gates on its own uploads.
 */
export function UploadingScopeProvider({
  scope,
  children,
}: {
  scope: UploadingScope;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <UploadingScopeSinkContext.Provider value={scope.sink}>
      {children}
    </UploadingScopeSinkContext.Provider>
  );
}

/**
 * Report this widget's in-flight state to the enclosing scope, if there is one.
 * Called by `useUploadingSignal` so every widget that already publishes to a
 * host prop publishes here too, from the same state.
 *
 * ⚠️ The unmount release is load-bearing, not tidiness. A widget removed while
 * its upload is in flight — a section collapsing, a tab switching, a subform
 * row deleted — would otherwise leave its id in the set with nothing left to
 * ever clear it, and the form's Save would stay disabled for the rest of the
 * session. That failure mode is worse than the defect this scope fixes,
 * because it has no user-visible cause at all.
 */
export function useUploadingScopeReport(uploading: boolean): void {
  const sink = React.useContext(UploadingScopeSinkContext);
  const id = React.useId();
  // Read through a ref so a provider that re-publishes its sink does not
  // re-run the report effect, and so the unmount cleanup below can stay
  // mount-scoped while still reaching the current sink.
  const sinkRef = React.useRef(sink);
  sinkRef.current = sink;

  React.useEffect(() => {
    sinkRef.current?.report(id, uploading);
  }, [uploading, id]);

  React.useEffect(
    () => () => {
      sinkRef.current?.report(id, false);
    },
    [id],
  );
}
