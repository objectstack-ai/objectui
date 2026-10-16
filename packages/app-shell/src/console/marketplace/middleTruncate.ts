/**
 * Middle truncation for a package's manifest id on a marketplace card
 * (objectui#12616).
 *
 * A manifest id reads from its namespace to its package name
 * (`app.objectstack.hotcrm`), and the package name at the end is the part a
 * reader tells two cards apart by. An end ellipsis drops exactly that part, so
 * a card that cannot fit the whole id keeps its head and its package suffix,
 * with `…` between them. The caller keeps the whole id reachable (the element's
 * `title`), so this is a display form only and is never parsed back.
 *
 * The budget is in characters because the id is set in a monospace face, where
 * every character advances the same width: the caller derives `maxChars` from
 * the narrowest box the id is drawn in.
 */

/** The single character that marks the cut. */
export const MIDDLE_ELLIPSIS = '…';

/**
 * `id` unchanged when it has at most `maxChars` characters; otherwise exactly
 * `maxChars` characters: a head, `…`, and a tail.
 *
 * The tail is the package suffix (the segment after the last `.`) whole, as
 * long as that leaves the head a third of the room; a longer suffix keeps its
 * own end, and an id with no `.` splits the room in half. Characters are
 * counted by code point, so a surrogate pair is never cut in two.
 */
export function middleTruncate(id: string, maxChars: number): string {
  if (!Number.isInteger(maxChars) || maxChars < 3) {
    throw new RangeError(`middleTruncate: maxChars must be an integer of at least 3, got ${maxChars}`);
  }
  const chars = Array.from(id);
  if (chars.length <= maxChars) return id;

  const room = maxChars - 1; // one place is the ellipsis
  const minHead = Math.ceil(room / 3);
  const dot = id.lastIndexOf('.');
  const suffixLength = dot >= 0 ? Array.from(id.slice(dot + 1)).length : 0;
  const tailLength = suffixLength > 0 ? Math.min(suffixLength, room - minHead) : Math.floor(room / 2);
  const headLength = room - tailLength;

  return chars.slice(0, headLength).join('') + MIDDLE_ELLIPSIS + chars.slice(chars.length - tailLength).join('');
}
