/**
 * @object-ui/i18n - Locale index — the explicit ALL TEN door.
 *
 * ⛔ This module is NOT reachable from the package entry any more
 * (objectui#7479). Importing it pulls every catalogue this package ships —
 * ~1.8 MB raw / ~450 KB gzipped — which is exactly the eager payload that card
 * removed from the console. The entry exposes `en` plus
 * `loadBuiltInLocale()` instead; see `./registry.js`.
 *
 * What it is still for, and the only two things it is for:
 *
 *   - the parity / drift suites, which must compare all ten packs at once and
 *     run in Node, where a megabyte of translations costs nobody anything;
 *   - an app that deliberately wants every catalogue resident, which reaches it
 *     through the published `@object-ui/i18n/locales` subpath — a specifier
 *     that says what it costs.
 *
 * ⚠️ Anything on a page-load path belongs on `./registry.js`, not here.
 */
export { default as en, type TranslationKeys } from './en.js';
export { default as zh } from './zh.js';
export { default as ja } from './ja.js';
export { default as ko } from './ko.js';
export { default as de } from './de.js';
export { default as fr } from './fr.js';
export { default as es } from './es.js';
export { default as pt } from './pt.js';
export { default as ru } from './ru.js';
export { default as ar } from './ar.js';

/**
 * Map of all built-in locales keyed by language code
 */
import en from './en.js';
import zh from './zh.js';
import ja from './ja.js';
import ko from './ko.js';
import de from './de.js';
import fr from './fr.js';
import es from './es.js';
import pt from './pt.js';
import ru from './ru.js';
import ar from './ar.js';

export const builtInLocales = { en, zh, ja, ko, de, fr, es, pt, ru, ar } as const;

// Direction and the lazy registry live in payload-free modules so the runtime
// can reach them without reaching the ten packs above. Re-exported here so the
// historical import path keeps answering.
export { RTL_LANGUAGES, isRTL } from './rtl.js';
export {
  BUILT_IN_LANGUAGE_CODES,
  DEFAULT_BUILT_IN_LANGUAGE,
  getLoadedBuiltInLocales,
  isBuiltInLanguage,
  isBuiltInLocaleLoaded,
  loadBuiltInLocale,
  type LocaleCatalogue,
} from './registry.js';
