// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * The served form of a picklist-bound field, turned back into the authored
 * form before an object designer writes it (objectui#10202).
 *
 * ## Why the designer has to do this
 *
 * A select field may name a shared list instead of carrying its own options:
 * `picklist: 'industry'` (`FieldSchema.picklist`, `@objectstack/spec`
 * `data/picklist.zod.ts`). The runtime serves such a field with BOTH keys:
 * `picklist`, still naming the list, and `options`, RESOLVED from that list and
 * from every `picklistExtensions` entry other packages add to it
 * (`PicklistServedFieldSchema`). Every object read the designers seed from
 * carries that served form — `GET /meta/object/NAME` and the `effective` layer
 * of `GET /meta/object/NAME/layers` alike.
 *
 * The authoring door refuses the two keys together: `FieldSchema` adds an issue
 * at `fields.FIELD.options` whose prescription is "Keep `picklist` and delete
 * `options`". So a designer that writes its seed back unchanged gets
 * `422 INVALID_METADATA` for the whole object, whatever the author edited.
 * The resolved list belongs to the picklist, not to the field: the producer of
 * the PUT drops it (objectstack's producer obligation, pinned server-side in
 * `protocol-picklist-served-roundtrip.test.ts`).
 *
 * ## What this changes, and what it never touches
 *
 * EVERY field that names a picklist leaves without `options` — not only the one
 * the author edited, because the whole document is re-sent and any bound field
 * in it is refused. A field that names no picklist is not touched at all: its
 * inline `options` stay byte-identical. No other key of any field, and no key of
 * the document, is touched.
 *
 * "Names a picklist" is the spec's own test, `picklist !== undefined` (the
 * `FieldSchema` refinement), so this drops `options` on exactly the fields the
 * door would refuse for carrying both.
 *
 * Both `fields` shapes a document can carry are handled: the spec's record keyed
 * by field name, and the array `readFields` / `writeFields` round-trip for a
 * document that arrived that way.
 *
 * ⛔ Not at the transport. `MetadataClient.save` and the other metadata-write
 * doors cannot tell a served copy from an author who wrote both keys, and the
 * second must stay a loud refusal with its prescription. The designer can tell:
 * it seeded its draft from the served read.
 *
 * Pure: the input is never mutated, and a document with nothing to drop comes
 * back BY REFERENCE, so a caller can tell "unchanged" by identity.
 */
export function dropServedPicklistOptions<T extends Record<string, unknown>>(body: T): T {
  if (!body || typeof body !== 'object') return body;
  const fields = body.fields;
  if (Array.isArray(fields)) {
    let changed = false;
    const next = fields.map((def) => {
      const stripped = withoutServedOptions(def);
      if (stripped !== def) changed = true;
      return stripped;
    });
    return changed ? { ...body, fields: next } : body;
  }
  if (fields && typeof fields === 'object') {
    let changed = false;
    // `Object.fromEntries` keeps a field literally named `__proto__` as an own
    // key, where assignment into a literal would invoke the prototype setter
    // and drop it (the hazard `MetadataService.toFieldsMap` documents).
    const next = Object.fromEntries(
      Object.entries(fields as Record<string, unknown>).map(([name, def]) => {
        const stripped = withoutServedOptions(def);
        if (stripped !== def) changed = true;
        return [name, stripped];
      }),
    );
    return changed ? { ...body, fields: next } : body;
  }
  return body;
}

/** One field without its served `options` — the same reference when there is nothing to drop. */
function withoutServedOptions(def: unknown): unknown {
  if (!def || typeof def !== 'object' || Array.isArray(def)) return def;
  const record = def as Record<string, unknown>;
  if (record.picklist === undefined) return def;
  if (!Object.prototype.hasOwnProperty.call(record, 'options')) return def;
  const { options: _served, ...authored } = record;
  return authored;
}
