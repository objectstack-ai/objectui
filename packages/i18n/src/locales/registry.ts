/**
 * @object-ui/i18n — the built-in catalogue registry (objectui#7479).
 *
 * ## What this module is for
 *
 * `locales/index.ts` names all ten packs in ten static `import` statements, so
 * every module that reached ANY of them through the package entry reached all
 * ten. The console measured that: one eagerly loaded chunk carrying ten
 * catalogues of which a viewer reads one, and every new translation key paid
 * for by every visitor in every language (objectui#7399's measurement, and the
 * per-chunk ceiling it ran out of).
 *
 * This module is the entry's replacement door. It holds:
 *
 *   - the ten language CODES, which cost nothing;
 *   - one static `import` — `en`, and only `en` (see below);
 *   - nine `() => import(...)` loaders, one per catalogue, each its own chunk;
 *   - a synchronous registry of what has actually been loaded so far.
 *
 * ## Why `en` is static and the other nine are not
 *
 * ⛔ This is not a shortcut around the ask; it is what makes the ask safe, and
 * the card admits it in as many words ("no `packages/i18n/src/locales/*` module
 * in any eager chunk EXCEPT THE ACTIVE ONE", and "roughly NINE catalogues'
 * worth" of bytes). Three separate mechanisms need an `en` catalogue to be
 * resident and none of them can await one:
 *
 *   1. `createI18n` declares `fallbackLng: 'en'`. Any key a pack does not
 *      define — the four `console.ai.*` outbound messages are exempted from
 *      parity by `all-locales-key-parity.test.ts`, and a plural category no
 *      pack enumerates is resolved the same way — renders through `en`. With no
 *      `en` bundle those render as the RAW KEY, in the UI, in nine languages.
 *   2. `@object-ui/app-shell`'s `LoadingScreen` renders BEFORE i18n is usable
 *      and on the server-down path where nothing else loads. It needs a
 *      synchronous dictionary, and leaving it with English literals instead is
 *      the "delete or untranslate the copy" route objectui#7399 rejected.
 *   3. A caller of the synchronous, published `createI18n()` that never awaits
 *      anything must still get a usable instance.
 *
 * So `en` is the documented resident fallback and the other nine are fetched on
 * demand. What a `zh` viewer pays is `en` + `zh`, not ten.
 *
 * ## The loaders are spelled out, one per line, on purpose
 *
 * ⛔ Never collapse them into `import(`./${lang}.js`)`. A template literal makes
 * the specifier dynamic, and every bundler answers that by emitting EVERY file
 * the pattern could match — which is the ten-catalogue closure again, now
 * spelled in a way that reads lazy. Ten literal specifiers are ten chunks the
 * bundler can name, and `apps/console/vite.config.ts` names them
 * (`i18n-locale-<code>`) so `scripts/check-eager-locale-catalogues.mjs` can
 * weigh them in the BUILT bundle rather than in this source file.
 */
import en from './en.js';
import type { TranslationKeys } from './en.js';

/**
 * A built-in catalogue as the runtime handles one.
 *
 * Deliberately NOT `TranslationKeys`: `en.ts` ends in `as const`, so that type
 * carries `en`'s literal VALUES and no other pack's strings are assignable to
 * it. Consumers that want the shape read {@link TranslationKeys} off `en`
 * directly and cast, exactly as `builtInLocales` consumers already did.
 */
export type LocaleCatalogue = Readonly<Record<string, unknown>>;

/**
 * The catalogue every instance can rely on being present, synchronously.
 * See the header for the three mechanisms that require it.
 */
export const DEFAULT_BUILT_IN_LANGUAGE = 'en';

/**
 * The nine catalogues fetched on demand — one literal specifier each, so each
 * one is a chunk of its own. ⛔ Read the header before touching the spelling.
 */
const LAZY_LOCALE_LOADERS: Readonly<Record<string, () => Promise<{ default: LocaleCatalogue }>>> =
  Object.freeze({
    zh: () => import('./zh.js'),
    ja: () => import('./ja.js'),
    ko: () => import('./ko.js'),
    de: () => import('./de.js'),
    fr: () => import('./fr.js'),
    es: () => import('./es.js'),
    pt: () => import('./pt.js'),
    ru: () => import('./ru.js'),
    ar: () => import('./ar.js'),
  });

/**
 * Every language code this package ships a catalogue for — the ten, in the
 * order `builtInLocales` declared them, and with NO catalogue bytes behind the
 * list. This is what a language switcher enumerates.
 */
export const BUILT_IN_LANGUAGE_CODES: readonly string[] = Object.freeze([
  DEFAULT_BUILT_IN_LANGUAGE,
  ...Object.keys(LAZY_LOCALE_LOADERS),
]);

/** Whether `@object-ui/i18n` ships a catalogue for `lang`. */
export function isBuiltInLanguage(lang: string): boolean {
  return (
    lang === DEFAULT_BUILT_IN_LANGUAGE ||
    Object.prototype.hasOwnProperty.call(LAZY_LOCALE_LOADERS, lang)
  );
}

/**
 * The catalogues loaded so far. `en` is in here from module evaluation; each of
 * the other nine appears once {@link loadBuiltInLocale} has resolved for it.
 */
const loaded: Record<string, LocaleCatalogue> = {
  [DEFAULT_BUILT_IN_LANGUAGE]: en as LocaleCatalogue,
};

/** In-flight loads, so N callers for one language share one fetch. */
const inFlight = new Map<string, Promise<LocaleCatalogue | null>>();

/**
 * A synchronous snapshot of the catalogues this process has resolved.
 *
 * ⚠️ A SNAPSHOT, not a live view: callers that render from it must re-read it
 * after `loadBuiltInLocale` resolves, or they will keep rendering the answer
 * they took before the fetch landed.
 */
export function getLoadedBuiltInLocales(): Readonly<Record<string, LocaleCatalogue>> {
  return { ...loaded };
}

/** Whether `lang`'s catalogue is already resident (no fetch needed). */
export function isBuiltInLocaleLoaded(lang: string): boolean {
  return Object.prototype.hasOwnProperty.call(loaded, lang);
}

/**
 * Fetch a built-in catalogue, or resolve `null` for a code this package does
 * not ship (an app-supplied locale, a typo, a region subtag).
 *
 * Memoised in both directions: a resolved catalogue is returned from the
 * registry without a second import, and concurrent callers share one in-flight
 * promise. ⛔ A REJECTED load is not memoised — a chunk that failed to download
 * (offline, a cache miss against a redeployed origin) must be retryable, and a
 * language preference is never worth wedging permanently over one bad fetch.
 */
export async function loadBuiltInLocale(lang: string): Promise<LocaleCatalogue | null> {
  const resident = loaded[lang];
  if (resident) return resident;

  const loader = Object.prototype.hasOwnProperty.call(LAZY_LOCALE_LOADERS, lang)
    ? LAZY_LOCALE_LOADERS[lang]
    : undefined;
  if (!loader) return null;

  const existing = inFlight.get(lang);
  if (existing) return existing;

  const pending = loader()
    .then((mod) => {
      const catalogue = mod.default;
      loaded[lang] = catalogue;
      return catalogue;
    })
    .finally(() => {
      inFlight.delete(lang);
    });
  inFlight.set(lang, pending);
  return pending;
}

export type { TranslationKeys };
