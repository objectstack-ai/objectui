/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * What the kanban board's drag-and-drop says to a screen reader
 * (objectui#12716).
 *
 * dnd-kit speaks every drag through a live region. Its default sentences name
 * the draggable and the droppable by their ids, in English whatever the
 * locale. On this board a card's id is its record id and a column's id is the
 * grouped field's option value, so a screen-reader user heard "Draggable item
 * gZguOoFVfxm_pSPG was moved over droppable area 4iDmJaZr0O0St1fb" while the
 * card title and the column label were on screen. This builds the
 * `announcements` the board hands its `DndContext` instead: every sentence
 * names the dragged card by its title, the card it is over by that card's
 * title, and the column by its label, through the board's own translation.
 * The form designer fixed the same defect for its canvas the same way
 * (objectui#11802, `formDndAnnouncements.ts` in `@object-ui/app-shell`).
 *
 * Nothing here moves a card. Each id is resolved the way the board's
 * `handleDragEnd` resolves it — a card id first, then a column id — so the
 * column a sentence names is the column a drop there lands in. A drop on a
 * card in another column moves the card to that column; a drop in its own
 * column, on itself, or on nothing moves nothing.
 *
 * ⛔ No id ever reaches a sentence. A card or a column that cannot be resolved,
 * or whose title is blank, is named by a neutral phrase from the same packs.
 *
 * Its own module rather than a function in `KanbanImpl.tsx`, after the form
 * designer's pattern. Not on the package entry.
 */

import type { Announcements, UniqueIdentifier } from '@dnd-kit/core'
import type { TranslateFn } from '@object-ui/i18n'
import type { KanbanCard, KanbanColumn } from './types'

/**
 * Where the last sentence of this drag left the card, so the next `over`
 * sentence is spoken only when the place changes. The board holds it in a ref,
 * so the memory does not depend on the identity of a memoised value (AGENTS.md
 * #10).
 */
export interface KanbanDndPlaceMemory {
  current: string | undefined
}

/** What a pointer is over, resolved the way the board's drop resolves it. */
type KanbanDndTarget =
  | { kind: 'card'; card: KanbanCard; column: KanbanColumn }
  | { kind: 'column'; column: KanbanColumn }

export function kanbanDndAnnouncements(
  t: TranslateFn,
  columns: readonly KanbanColumn[],
  memory: KanbanDndPlaceMemory,
): Announcements {
  const homeOf = (id: UniqueIdentifier): { card: KanbanCard; column: KanbanColumn } | null => {
    for (const column of columns) {
      const card = column.cards.find((c) => c.id === id)
      if (card) return { card, column }
    }
    return null
  }

  const targetOf = (activeId: UniqueIdentifier, overId: UniqueIdentifier | undefined): KanbanDndTarget | null => {
    if (overId === undefined) return null
    // The card over its own place: a drop there leaves it in its column.
    if (overId === activeId) {
      const home = homeOf(activeId)
      return home ? { kind: 'column', column: home.column } : null
    }
    const hit = homeOf(overId)
    if (hit) return { kind: 'card', card: hit.card, column: hit.column }
    const column = columns.find((c) => c.id === overId)
    return column ? { kind: 'column', column } : null
  }

  const placeOf = (target: KanbanDndTarget | null): string =>
    target === null
      ? 'none'
      : JSON.stringify(target.kind === 'card' ? ['card', target.card.id] : ['column', target.column.id])

  const titled = (text: string | undefined): text is string => typeof text === 'string' && text.trim() !== ''
  const cardName = (card: KanbanCard | undefined): string =>
    card && titled(card.title) ? card.title : t('kanban.dnd.untitledCard')
  const columnName = (column: KanbanColumn | undefined): string =>
    column && titled(column.title) ? column.title : t('kanban.dnd.unnamedColumn')

  return {
    onDragStart({ active }) {
      const home = homeOf(active.id)
      // A pointer pick-up's first `over` is the card over itself: the place
      // this sentence names. Remembering it keeps that `over` from replacing
      // the pick-up sentence before a screen reader reads it.
      memory.current = home ? placeOf({ kind: 'column', column: home.column }) : undefined
      return t('kanban.dnd.start', { card: cardName(home?.card), column: columnName(home?.column) })
    },
    onDragOver({ active, over }) {
      const target = targetOf(active.id, over?.id)
      const place = placeOf(target)
      // `undefined` leaves the region as it is, which dnd-kit allows.
      if (place === memory.current) return undefined
      memory.current = place
      const card = cardName(homeOf(active.id)?.card)
      if (target === null) return t('kanban.dnd.overNone', { card })
      if (target.kind === 'card') {
        return t('kanban.dnd.overCard', { card, target: cardName(target.card), column: columnName(target.column) })
      }
      return t('kanban.dnd.overColumn', { card, column: columnName(target.column) })
    },
    onDragEnd({ active, over }) {
      memory.current = undefined
      const home = homeOf(active.id)
      const card = cardName(home?.card)
      const target = targetOf(active.id, over?.id)
      if (home && target && target.column.id !== home.column.id) {
        return t('kanban.dnd.moved', { card, column: columnName(target.column) })
      }
      return t('kanban.dnd.dropped', { card, column: columnName(home?.column) })
    },
    onDragCancel({ active }) {
      memory.current = undefined
      const home = homeOf(active.id)
      return t('kanban.dnd.cancelled', { card: cardName(home?.card), column: columnName(home?.column) })
    },
  }
}
