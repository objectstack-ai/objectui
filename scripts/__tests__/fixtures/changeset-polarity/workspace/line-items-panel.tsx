/**
 * The fixture WORKSPACE root for objectui#9767 -- this repo, outside the
 * indexed tree.
 *
 * ⭐ This spelling is why the split is NOT decided on "resolves in a declared
 * dependency" alone: measured on the live corpus, one symbol in the bucket is
 * declared in a sibling package of this very repo, and the narrow predicate
 * would have filed it as a schema that is gone. Same corpus boundary, different
 * side of it.
 */
export interface RepoOnlySchema {
  rows: string[];
}
