/**
 * useRecentItems — re-export shim
 *
 * The recent-items state has been migrated to a React Context so all consumers
 * share a single state instance and can be backed by an optional backend
 * persistence adapter. See `../context/RecentItemsProvider`.
 *
 * All existing imports of `useRecentItems` and `RecentItem` from this path
 * continue to work without any changes at the call sites.
 *
 * @module
 */

export {
  useRecentItems,
  type RecentItem,
  type RecentItemInput,
  type RecentNamedItem,
  type RecentTextItem,
} from '../context/RecentItemsProvider.js';
// An object / dashboard / page / report entry stores no label; this is how a
// surface that renders one asks for it (objectui#11678).
export { useRecentItemLabel, type RecentItemLabelResolver } from './useRecentItemLabel.js';
