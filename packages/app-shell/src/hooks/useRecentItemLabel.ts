/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * useRecentItemLabel — what a "recently accessed" entry is called NOW, in the
 * current language (objectui#11678).
 *
 * An object, dashboard, page or report entry stores its identity only
 * (`RecentNamedItem`: `type` + `name`), so this hook is where its text comes
 * from — on every render, never stored. A rename, or a switch of language,
 * shows on the next render; nothing is minted from the route.
 *
 * It holds no labelling rule of its own. Each kind asks what the console
 * already asks for that kind:
 *
 *  - an object: what the page the entry opens — the object's LIST — is titled,
 *    `useObjectLabel`'s `objectPluralLabel` over the object's cached metadata
 *    (the translated plural, else the declared `pluralLabel`, else the label
 *    the singular rung reads; objectui#11733). ⛔ Not {@link useNavTargetLabel}:
 *    its object rung is the spec's step 3 for an UNLABELLED NAVIGATION ENTRY
 *    ("the object's label", the singular), a ruling this entry does not reopen;
 *  - a dashboard: {@link useNavTargetLabel} — the text the sidebar shows for an
 *    unlabelled navigation entry that opens the same target (the metadata
 *    label, an inline locale map read in the active language, through the
 *    `useObjectLabel` bundle lookup);
 *  - a page or a report: the same pair for that kind — the page's / report's
 *    cached metadata `label`, through `useObjectLabel`'s `pageLabel` /
 *    `reportLabel`. `useNavTargetLabel` has no page or report target because
 *    the navigation ruling names none, so the pair is composed here from the
 *    same two helpers it uses.
 *
 * With no label anywhere the entry shows its machine name — the backstop the
 * navigation renderer uses too, including before the type's metadata has
 * loaded.
 *
 * A record or a Studio metadata item (`RecentTextItem`) carries its own text,
 * which is returned as stored.
 */

import { useMemo } from 'react';
import { useObjectLabel, useObjectTranslation } from '@object-ui/i18n';
import type { RecentItem } from '../context/RecentItemsProvider.js';
import { useMetadata } from '../providers/MetadataProvider.js';
import { findByName, metadataText, useNavTargetLabel, type LabelledRecord } from './useNavTargetLabel.js';

/** Answers the display text of a recent entry, in the current language. */
export type RecentItemLabelResolver = (item: RecentItem) => string;

/** `''` from a bundle lookup that found nothing and had no metadata to fall back to. */
function nonEmpty(text: string | undefined): string | undefined {
  return typeof text === 'string' && text.trim() !== '' ? text : undefined;
}

export function useRecentItemLabel(): RecentItemLabelResolver {
  const targetLabel = useNavTargetLabel();
  const metadata = useMetadata();
  const { objectPluralLabel, pageLabel, reportLabel } = useObjectLabel();
  const { language } = useObjectTranslation();

  return useMemo<RecentItemLabelResolver>(
    () => (item: RecentItem) => {
      switch (item.type) {
        case 'object': {
          const def = findByName(metadata.objects, item.name) as (LabelledRecord & { pluralLabel?: unknown }) | undefined;
          // The singular half is read exactly as `useNavTargetLabel` reads it;
          // `pluralLabel` is a plain string in the spec, so only a string is one.
          const text = metadataText(def?.label, language);
          const plural = typeof def?.pluralLabel === 'string' ? def.pluralLabel : undefined;
          return nonEmpty(objectPluralLabel({ name: item.name, label: text ?? '', pluralLabel: plural })) ?? item.name;
        }
        case 'dashboard':
          return targetLabel({ kind: 'dashboard', dashboardName: item.name }) ?? item.name;
        case 'page': {
          const text = metadataText(findByName(metadata.pages, item.name)?.label, language);
          return nonEmpty(pageLabel({ name: item.name, label: text ?? '' })) ?? item.name;
        }
        case 'report': {
          const text = metadataText(findByName(metadata.reports, item.name)?.label, language);
          return nonEmpty(reportLabel({ name: item.name, label: text ?? '' })) ?? item.name;
        }
        default:
          return item.label;
      }
    },
    [targetLabel, metadata, objectPluralLabel, pageLabel, reportLabel, language],
  );
}
