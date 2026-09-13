/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Icon utilities
 *
 * Helpers for resolving Lucide icons by name.
 *
 * The exported `getIcon(name)` API stays synchronous and returns a React
 * component, preserving call sites that do `const Icon = getIcon(name); <Icon />`.
 *
 * ## One resolver, not a second copy (objectui#9204)
 *
 * This file used to carry its own transcription of `@object-ui/components`'
 * `getLazyIcon`: the same kebab-casing, the same name-membership Set, the same
 * per-name memo, the same `Database` fallback. The copy is now a delegation,
 * for two reasons that are the same reason:
 *
 *   - the membership Set was built from `iconNames`, and lucide derives that
 *     from its 2,025-entry dynamic-import map — so this module's import alone
 *     put that whole map on the console's eager path;
 *   - two transcriptions of one lookup are two chances to disagree about which
 *     lucide vocabulary a name is judged against, which is precisely what
 *     `scripts/check-lucide-icon-record-names.mjs` censuses.
 *
 * The shared resolver keeps the names as data and reaches the map through
 * `import()`. Behaviour here is unchanged: same normalisation, same fallback.
 */

export { getLazyIcon as getIcon } from '@object-ui/components';
