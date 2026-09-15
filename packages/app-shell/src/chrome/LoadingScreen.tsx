
import { Spinner, Button } from '@object-ui/components';
import { Database, CheckCircle2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { getProductName, getLogoUrl } from '../runtime-config.js';
import { en as enLocale, getLoadedBuiltInLocales } from '@object-ui/i18n';

interface LoadingScreenProps {
  /** Optional message override */
  message?: string;
  /** When set, renders an error block instead of the step list */
  error?: string | null;
  /** Optional retry callback; renders a Retry button when provided alongside `error` */
  onRetry?: () => void;
  /** When true, disables the retry button and shows a spinner */
  retrying?: boolean;
}

// Bootstrap-critical UI: must render before i18n is loaded (especially when the
// server is unreachable, which is also when i18n can't load translations).
// Do not use useObjectTranslation here — it can suspend on first render and
// prevent the splash from rendering at all on a server-down boot. Keep a small
// synchronous dictionary for the startup shell instead.
// The product name is read from the runtime-config singleton (sync) so it
// reflects server-pushed branding when available, falling back to 'ObjectOS'.
//
// Indexed by the two-letter prefix across ALL built-in packs rather than a
// `zh ? … : en` check: the previous form collapsed ten shipped languages into
// two, so a ja/ko/de user saw English for the whole boot (objectui#2871).
//
// Each field falls back to `en` individually. A pack that is behind on some
// `console.*` keys — several are, see objectui#2872 part (a) — must degrade to
// English, not to `undefined`, which would render blank on the splash.
//
// ⚠️ Reads the RESIDENT catalogues, not all ten (objectui#7479). `en` is
// statically imported and always there; the other nine are fetched, and the
// console awaits the active one before `createRoot().render()`, so this splash
// still renders in the user's language. The behaviour that DOES change is the
// boot where nothing awaited the catalogue: the splash shows English for the
// few hundred milliseconds the fetch takes, and objectui#2871's ten languages
// return the moment it lands. ⛔ Do not "fix" that by importing the ten packs
// back in — that is the eager payload this card removed, restored for a
// sub-second splash.
type ConsoleStrings = typeof enLocale.console;

function getStartupStrings(): ConsoleStrings {
  const tag =
    (typeof document !== 'undefined' ? document.documentElement.lang : '') ||
    (typeof navigator !== 'undefined' ? navigator.language : '') ||
    'en';
  const base = tag.toLowerCase().split('-')[0];
  // `as unknown as` because a catalogue is typed by SHAPE here while
  // `enLocale` carries `en`'s literal VALUES — the same cast `createI18n` and
  // the old `builtInLocales` consumers made.
  const catalogue = getLoadedBuiltInLocales()[base] as unknown as
    | { console?: Partial<ConsoleStrings> }
    | undefined;
  const pack = catalogue?.console;
  if (!pack || pack === enLocale.console) return enLocale.console;
  return {
    ...enLocale.console,
    ...pack,
    loadingSteps: { ...enLocale.console.loadingSteps, ...pack.loadingSteps },
    error: { ...enLocale.console.error, ...pack.error },
    actions: { ...enLocale.console.actions, ...pack.actions },
  } as ConsoleStrings;
}

export function LoadingScreen({ message, error, onRetry, retrying }: LoadingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const strings = getStartupStrings();

  const loadingSteps = useMemo(() => [
    strings.loadingSteps.connecting,
    strings.loadingSteps.loadingConfig,
    strings.loadingSteps.preparingWorkspace,
  ], [strings]);

  useEffect(() => {
    if (message || error) return; // skip auto-progression when overridden or in error state
    const timer = setInterval(() => {
      setCurrentStep((prev) => Math.min(prev + 1, loadingSteps.length - 1));
    }, 1200);
    return () => clearInterval(timer);
  }, [message, error, loadingSteps.length]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center gap-6">
        {/* Logo/Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl animate-pulse" />
          <div className="relative bg-linear-to-br from-primary to-primary/80 p-4 rounded-2xl shadow-lg">
            {getLogoUrl() ? (
              <img src={getLogoUrl()} alt={getProductName()} className="h-10 w-10 object-contain" />
            ) : (
              <Database className="h-10 w-10 text-primary-foreground" />
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{getProductName()}</h1>
          <p className="text-sm text-muted-foreground">{strings.initializing}</p>
        </div>

        {/* Error block */}
        {error ? (
          <div className="flex flex-col items-center gap-4 max-w-md w-full px-6">
            <div className="flex flex-col items-center gap-3 p-5 rounded-lg border border-destructive/30 bg-destructive/5 w-full">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm font-semibold">
                  {strings.error.connectionFailed}
                </span>
              </div>
              <p className="text-xs text-muted-foreground text-center break-words">
                {error}
              </p>
              <p className="text-xs text-muted-foreground text-center">
                {strings.error.checkServer}
              </p>
            </div>
            {onRetry && (
              <Button
                onClick={onRetry}
                disabled={retrying}
                variant="default"
                size="sm"
                className="gap-2"
              >
                {retrying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {strings.actions.retrying}
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    {strings.actions.retry}
                  </>
                )}
              </Button>
            )}
          </div>
        ) : message ? (
          <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-full">
            <Spinner className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">{message}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2 w-64">
            {loadingSteps.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-2.5 text-sm transition-opacity duration-300"
                style={{ opacity: index <= currentStep ? 1 : 0.3 }}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                ) : index === currentStep ? (
                  <Loader2 className="h-4 w-4 text-primary shrink-0 animate-spin" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
                )}
                <span className={index <= currentStep ? 'text-foreground' : 'text-muted-foreground'}>
                  {step}
                </span>
              </div>
            ))}
            {/* Reassure first-time users that a fresh environment can take a beat. */}
            <p className="mt-1 text-xs text-muted-foreground">{strings.loadingHint}</p>
          </div>
        )}
      </div>
    </div>
  );
}
