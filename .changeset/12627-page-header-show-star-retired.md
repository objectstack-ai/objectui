---
'@object-ui/components': minor
---

`page:header` no longer reads `showStar`, ahead of `@objectstack/spec` 18 retiring the key (objectstack#23650).

- **The favorites star follows the host toggle alone.** The star beside the record title draws exactly where the host's record context carries `onToggleFavorite`, and metadata does not control it. An authored `showStar`, on the node or under `properties`, changes nothing. Before, `showStar: false` hid the star even where the host wired a toggle. `RecordContextValue` is unchanged: `isFavorite` and `onToggleFavorite` stay the way a host opts in.
- **The `page:header` registration no longer publishes a `showStar` input**, so the designer panel and the generated manifest stop offering it.
- **`RecordTitleChip` drops its `showStar` prop (breaking for direct users).** The chip draws its star exactly when `onToggleFavorite` is passed. A caller that passed `showStar={false}` should stop passing `onToggleFavorite` instead; a caller that relied on the star drawing without a toggle gets no star.
