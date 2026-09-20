// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * The object-metadata write invariant, placed at the DOOR rather than at the
 * writers (objectui#8676).
 *
 * ## Why this module exists — the enumeration, not the count
 *
 * objectui#7714 ruled one client behaviour: *a half-filled relationship stays
 * client-side and the PUT body never carries a `lookup` without a non-empty
 * `reference`*. Its PR implemented that ruling by naming the writers it knew
 * about — two of them — and putting the assertion inside each one's array-to-map
 * conversion (`toFieldsMap`). objectui#8057 then reproduced the very failure the
 * ruling was written against, on a THIRD writer neither conversion covers, in
 * that card's own required dogfood. objectui#8676 swept and found nine more.
 *
 * The durable half of that card is a sentence about method, not a number:
 *
 * > a ruling that enumerates writers is only as good as the enumeration.
 *
 * A hand list of writers is stale the next time somebody adds one, and nothing
 * says so. So this invariant is not attached to writers at all. It is attached
 * to the DOORS — the places that put bytes on the wire — because the doors are a
 * CLOSED set that this repository owns, while the writers are an OPEN set it
 * does not. Three in-repo transports can PUT `/meta/:type/:name`, and
 * `scripts/check-object-metadata-write-doors.mjs` derives that set on every run
 * rather than restating it:
 *
 *   1. `MetadataClient.save`           `packages/data-objectstack/src/metadata-client.ts`
 *   2. `importObjectDraft`             `packages/app-shell/src/views/metadata-admin/external/api.ts`
 *   3. the `@objectstack/client` SDK's `meta.saveItem`, reached in this repo
 *      through `MetadataService`'s one seam
 *
 * Every writer in the repo reaches the server through one of those three. Guard
 * them and the writer count stops mattering; add a fourth transport and the gate
 * turns red naming it. That is the whole design: ⛔ do not re-open this by
 * adding a writer list anywhere.
 *
 * ## What it asserts, and the two things it deliberately does NOT
 *
 * It asserts objectui#7714's invariant and nothing else.
 *
 * ⛔ **NOT a client-side revalidation of the document.** Parsing the whole body
 * through `ObjectSchema` before the PUT would refuse plugin-registered keys the
 * SERVER accepts, and it would promote a client PREDICTION into a block — which
 * is exactly what objectui#4306 / objectui#6980 ruled against for the designer's
 * live Zod pass, on the stated ground that a schema issue on a draft the server
 * ACCEPTS would dead-bolt Save with no on-screen editor able to clear it. This
 * refusal cannot dead-bolt anything the server would have taken: the same body
 * is refused one layer down with a 422 on `fields.NAME.reference`, so the guard
 * forecloses nothing and only moves an identical refusal earlier, where it can
 * name the field while it is still on screen.
 *
 * ⛔ **NOT strip-and-report-saved.** Dropping the half-filled field and
 * reporting success would trade a visible refusal for an invisible deletion —
 * objectstack#4001's shape, ruled out for this family in objectui#7714 and again
 * in objectui#8057. It throws; the caller surfaces the message.
 *
 * ## The type list is pinned to the contract, not to memory
 *
 * {@link RELATIONSHIP_TYPES_REQUIRING_REFERENCE} is the one list this module
 * keeps, and it is the same class of hazard the module exists to close, so it
 * does not get to be a remembered list either.
 * `object-metadata-write-guard.derivation.test.ts` DERIVES the set from the
 * installed `@objectstack/spec` — every member of `FieldType`, parsed as
 * `{ type, label }` through `FieldSchema`, keeping those refused at path
 * `reference` — and asserts it equals this array. A spec release that makes a
 * third field type require a target turns that pin red instead of leaving a
 * guard that quietly stopped covering the contract.
 *
 * The derivation is a TEST and not a runtime probe on purpose: parsing 50
 * field-type documents on the way to every save is a cost paid on the hot path
 * to re-learn something that changes at most once per spec release, and a probe
 * that throws at runtime has to choose between blocking writes and failing open.
 * A pin has neither problem — it fails at CI time, loudly, with nothing at stake.
 */

/**
 * Field types whose `reference` — the target object a relationship links to —
 * `@objectstack/spec` requires to be present and non-empty.
 *
 * Derived from the installed artifact by the pin named above, never recalled.
 */
export const RELATIONSHIP_TYPES_REQUIRING_REFERENCE: readonly string[] = ['lookup', 'master_detail'];

/** The metadata type whose documents carry the `fields` map this guard reads. */
export const OBJECT_METADATA_TYPE = 'object';

/**
 * Whether a `reference` value names an object the server could resolve.
 *
 * The trim is not cosmetic: `ObjectSchema.fields`' own key grammar
 * (`/^[a-z_][a-z0-9_]*$/`) admits no whitespace-bearing name, so a
 * whitespace-only target names nothing at either end. Measured on the installed
 * spec by the derivation pin, which asserts the contract refuses `'   '` exactly
 * as it refuses `''` and an absent key.
 */
function isUsableTarget(reference: unknown): boolean {
  return typeof reference === 'string' && reference.trim() !== '';
}

/** Name the state of an unusable target, so the message says which of them it is. */
function describeTarget(reference: unknown): string {
  if (reference === undefined) return 'no `reference` key at all';
  if (reference === null) return 'a `null` `reference`';
  if (typeof reference !== 'string') return `a \`reference\` of type \`${typeof reference}\``;
  if (reference === '') return 'an empty `reference`';
  return 'a whitespace-only `reference`';
}

/**
 * The `fields` member of an object document, in either shape a writer may hand
 * the door.
 *
 * Both are real. The spec's stored shape is a RECORD keyed by field name, and
 * that is what `MetadataService.toFieldsMap` and `MetadataFieldsPage` emit. The
 * ARRAY shape is what `readFields`/`writeFields` round-trip for documents that
 * arrived that way, and `StudioDesignSurface` PUTs the result verbatim — so a
 * door that read only the record shape would be silently blind to a whole
 * surface, which is this card's failure mode wearing a different hat.
 */
function fieldEntries(fields: unknown): Array<{ name: string; def: Record<string, unknown> }> {
  if (Array.isArray(fields)) {
    return fields.flatMap((raw, index) => {
      if (!raw || typeof raw !== 'object') return [];
      const record = raw as Record<string, unknown>;
      const name = typeof record.name === 'string' && record.name ? record.name : `[${index}]`;
      return [{ name, def: record }];
    });
  }
  if (fields && typeof fields === 'object') {
    return Object.entries(fields as Record<string, unknown>).flatMap(([name, def]) =>
      def && typeof def === 'object' ? [{ name, def: def as Record<string, unknown> }] : [],
    );
  }
  return [];
}

/**
 * Refuse an object-metadata write whose body carries a relationship field with
 * no usable target.
 *
 * A no-op for every other metadata type and for any body with no readable
 * `fields` member — this door serves `view`, `app`, `flow`, `permission`,
 * `hook` and `dashboard` writes too, and has no opinion about them.
 *
 * @param type   the metadata type segment of the write (`'object'`, `'view'`, …)
 * @param item   the body about to be serialised onto the wire
 * @param writer a short label for the door, so the message names where it fired
 * @throws Error naming the offending field, before any request is issued
 */
export function assertObjectMetadataWritable(type: unknown, item: unknown, writer: string): void {
  if (String(type) !== OBJECT_METADATA_TYPE) return;
  if (!item || typeof item !== 'object') return;
  const fields = (item as Record<string, unknown>).fields;
  for (const { name, def } of fieldEntries(fields)) {
    if (!RELATIONSHIP_TYPES_REQUIRING_REFERENCE.includes(String(def.type))) continue;
    if (isUsableTarget(def.reference)) continue;
    throw new Error(
      `${writer} refused this object metadata write: the field \`${name}\` is a ` +
        `\`${String(def.type)}\` and carries ${describeTarget(def.reference)}, so it names no object ` +
        'to link to. `@objectstack/spec` refuses the same document at the server with a 422 on ' +
        `\`fields.${name}.reference\`, and that refusal blocks every later save of this object for ` +
        'as long as the half-filled field rides along in the draft (objectui#7714, objectui#8057). ' +
        'Pick the target object, or change the field to a non-relationship type.',
    );
  }
}
