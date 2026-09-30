import { describe, it, expect, vi } from 'vitest';
import { normalizeSectionField, buildSectionFields, sectionEntryName } from './sectionFields';
import { mapFieldTypeToFormType } from '@object-ui/fields';

const objectSchema = {
  name: 'crm_account',
  fields: {
    name: { type: 'text', label: 'Account Name', required: true, description: 'Legal name' },
    industry: {
      type: 'select',
      label: 'Industry',
      options: [{ label: 'Tech', value: 'tech' }],
    },
    billing_address: { type: 'address', label: 'Billing Address' },
  },
};

const ctx = {
  objectSchema,
  objectName: 'crm_account',
  fieldLabel: (_obj: string, _name: string, fallback?: string) => fallback || _name,
};

describe('normalizeSectionField', () => {
  it('resolves a spec FormFieldSchema object (key `field`, not `name`)', () => {
    // This is the exact shape that crashed the form: react-hook-form received
    // `name === undefined` and threw on `name.split('.')`.
    const f = normalizeSectionField({ field: 'name', required: true, colSpan: 2 }, ctx);
    expect(f.name).toBe('name');           // ← was undefined before the fix
    expect(f.type).toBe(mapFieldTypeToFormType('text')); // merged from object schema
    expect(f.required).toBe(true);         // spec override
    expect((f as any).colSpan).toBe(2);    // spec override
    expect(f.field).toMatchObject({ type: 'text' }); // metadata object, not the string
  });

  it('merges select options + label from the object schema', () => {
    const f = normalizeSectionField({ field: 'industry' }, ctx);
    expect(f.name).toBe('industry');
    expect(f.type).toBe(mapFieldTypeToFormType('select'));
    expect((f as any).options).toEqual([{ label: 'Tech', value: 'tech' }]);
  });

  it('maps spec override keys (helpText→description, readonly→disabled)', () => {
    const f = normalizeSectionField(
      { field: 'name', helpText: 'Custom hint', readonly: true },
      ctx,
    );
    expect(f.description).toBe('Custom hint');
    expect((f as any).disabled).toBe(true);
  });

  it('applies a spec reference override written under either key (`reference` or `reference_to`)', () => {
    // Spec canon is `reference_to` (views.zod.ts) but `reference` (ObjectStack
    // convention) is accepted too; both keys are stamped so any dual-key
    // downstream reader sees the override (#2407 / PR #2587).
    const specCanon = normalizeSectionField({ field: 'name', reference_to: 'accounts' }, ctx) as any;
    expect(specCanon.reference).toBe('accounts');
    expect(specCanon.reference_to).toBe('accounts');

    const stackConvention = normalizeSectionField({ field: 'name', reference: 'contacts' }, ctx) as any;
    expect(stackConvention.reference).toBe('contacts');
    expect(stackConvention.reference_to).toBe('contacts');
  });

  it('builds from the object schema for a string shorthand', () => {
    const f = normalizeSectionField('industry', ctx);
    expect(f.name).toBe('industry');
    expect(f.type).toBe(mapFieldTypeToFormType('select'));
  });

  it('passes a runtime FormField object through unchanged (field = metadata object)', () => {
    const runtime = { name: 'custom', type: 'text', label: 'Custom' };
    const f = normalizeSectionField(runtime as any, ctx);
    expect(f.name).toBe('custom');
    expect(f.type).toBe('text');
  });

  it('still yields a name when the spec field is not in the object schema', () => {
    const f = normalizeSectionField({ field: 'ghost', required: true }, ctx);
    expect(f.name).toBe('ghost'); // never undefined → no `.split` crash
  });

  // View-level conditional visibility (#2212): the spec `P`-template ships
  // `visibleOn` as an Expression object `{ dialect: 'cel', source }`. It must
  // survive normalization verbatim so the form renderer can evaluate it with
  // the canonical engine — the old code only accepted a bare string, and even
  // then attached a dead `visible()` closure instead.
  it('carries a `{ dialect, source }` visibleOn expression through (spec shape, #2212)', () => {
    const expr = { dialect: 'cel', source: "record.priority == 'urgent'" };
    const f = normalizeSectionField({ field: 'name', visibleOn: expr }, ctx);
    expect((f as any).visibleOn).toEqual(expr);
    expect((f as any).visible).toBeUndefined(); // no dead closure
  });

  it('carries a bare-string visibleOn through (#2212)', () => {
    const f = normalizeSectionField(
      { field: 'name', visibleOn: "record.priority == 'urgent'" },
      ctx,
    );
    expect((f as any).visibleOn).toBe("record.priority == 'urgent'");
  });

  it('carries visibleOn on a runtime FormField object too (#2212)', () => {
    const expr = { dialect: 'cel', source: 'record.flag == true' };
    const f = normalizeSectionField({ name: 'custom', type: 'text', visibleOn: expr } as any, ctx);
    expect((f as any).visibleOn).toEqual(expr);
  });

  // ── Spec 17 late-added / renamed keys (#3090) ─────────────────────────────
  // ADR-0089 renamed the view-level predicate to `visibleWhen` — which is also
  // the runtime slot for the OBJECT-level rule. The view predicate must land in
  // the view-level slot (`visibleOn`) so the renderer ANDs both layers
  // (form.tsx evaluates the two slots independently) instead of one clobbering
  // the other. Before the fix the canonical spelling was silently dropped while
  // the DEPRECATED spelling worked.

  it('routes a view-level `visibleWhen` (canonical spelling) into the view-level slot', () => {
    const f = normalizeSectionField(
      { field: 'name', visibleWhen: "record.stage == 'won'" },
      ctx,
    ) as any;
    expect(f.visibleOn).toBe("record.stage == 'won'");
  });

  it('carries a `{ dialect, source }` view-level visibleWhen expression', () => {
    const expr = { dialect: 'cel', source: "record.priority == 'urgent'" };
    const f = normalizeSectionField({ field: 'name', visibleWhen: expr }, ctx) as any;
    expect(f.visibleOn).toEqual(expr);
  });

  it('layers the view predicate OVER the object-level rule instead of clobbering it', () => {
    const rulesCtx = {
      ...ctx,
      objectSchema: {
        ...objectSchema,
        fields: {
          ...objectSchema.fields,
          paid_on: { type: 'date', label: 'Paid on', visibleWhen: "record.status == 'paid'" },
        },
      },
    };
    const f = normalizeSectionField(
      { field: 'paid_on', visibleWhen: 'record.amount > 0' },
      rulesCtx,
    ) as any;
    expect(f.visibleWhen).toBe("record.status == 'paid'"); // object-level rule intact
    expect(f.visibleOn).toBe('record.amount > 0'); // view predicate in the view slot
  });

  it('prefers the canonical spelling when both visibleWhen and deprecated visibleOn are authored', () => {
    // `saveMeta` persists verbatim, so served metadata can carry either (or,
    // after a partial migration, both). Canonical wins.
    const f = normalizeSectionField(
      { field: 'name', visibleWhen: "record.a == 1", visibleOn: "record.b == 2" },
      ctx,
    ) as any;
    expect(f.visibleOn).toBe("record.a == 1");
  });

  it('carries a view-level dependsOn (spec cascading declaration)', () => {
    const f = normalizeSectionField({ field: 'industry', dependsOn: 'country' }, ctx) as any;
    expect(f.dependsOn).toBe('country');
  });

  it('never emits a string `field` — the spec identity key ends at this boundary', () => {
    // On a runtime FormField the declared `field` slot holds the resolved
    // metadata OBJECT (or nothing) — never the spec's string reference. This
    // is the invariant that makes the same-key pun safe (#3090): the string
    // form exists only in AUTHORED defs, and this chokepoint is where it dies.
    const shapes: Array<string | Record<string, any>> = [
      'industry', // string shorthand
      { field: 'industry', required: true }, // spec object
      { field: 'ghost' }, // spec object, unknown to the schema
      { name: 'custom', type: 'text' }, // already-runtime object
    ];
    for (const def of shapes) {
      const out = normalizeSectionField(def as any, ctx);
      expect(typeof out.field, `string field leaked for ${JSON.stringify(def)}`).not.toBe('string');
    }
  });

  it('warns once when an entry mixes both vocabularies, and the spec key wins', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const f = normalizeSectionField({ field: 'industry', name: 'legacy_key' }, ctx);
      expect(f.name).toBe('industry'); // spec branch derives the name from `field`
      normalizeSectionField({ field: 'industry', name: 'legacy_key' }, ctx); // same site again
      const said = warn.mock.calls.map((c) => String(c[0])).filter((m) => m.includes('mixed'));
      expect(said).toHaveLength(1); // deduped — this runs inside render loops
      expect(said[0]).toContain("{ field: 'industry' }");
      expect(said[0]).toContain("name: 'legacy_key'");
    } finally {
      warn.mockRestore();
    }
  });

  it('carries keyField and disclosure through for record/composite widgets', () => {
    const f = normalizeSectionField(
      { field: 'billing_address', keyField: { field: 'name', immutable: true }, disclosure: 'popover' },
      ctx,
    ) as any;
    expect(f.keyField).toEqual({ field: 'name', immutable: true });
    expect(f.disclosure).toBe('popover');
  });

  it('copies field-level conditional rules from the object schema (#2212)', () => {
    const rulesSchema = {
      ...objectSchema,
      fields: {
        ...objectSchema.fields,
        paid_on: {
          type: 'date',
          label: 'Paid on',
          visibleWhen: "record.status == 'paid'",
          requiredWhen: "record.status == 'paid'",
          readonlyWhen: 'record.locked == true',
        },
      },
    };
    const rulesCtx = { ...ctx, objectSchema: rulesSchema };
    for (const def of ['paid_on', { field: 'paid_on' }]) {
      const f = normalizeSectionField(def as any, rulesCtx);
      expect((f as any).visibleWhen).toBe("record.status == 'paid'");
      expect((f as any).requiredWhen).toBe("record.status == 'paid'");
      expect((f as any).readonlyWhen).toBe('record.locked == true');
    }
  });
});

describe('buildSectionFields', () => {
  it('normalizes a mixed section (string + spec object) with no undefined names', () => {
    const fields = buildSectionFields(
      { fields: ['industry', { field: 'name', required: true, colSpan: 2 }] },
      ctx,
    );
    expect(fields.map((f) => f.name)).toEqual(['industry', 'name']);
    expect(fields.every((f) => typeof f.name === 'string')).toBe(true);
  });
});

/**
 * `SectionFieldsContext.pool` — the seam `ObjectForm`'s default arm builds its
 * sections through (objectui#10475). The render-level pins on all six arms are
 * `__tests__/sectionEntryOverrides-10475.test.tsx`; these rows pin the three
 * facts the pool decides, one variable at a time.
 */
describe('buildSectionFields — with a pool (objectui#10475)', () => {
  // A pool the way the default arm builds one: its own generated fields, which
  // carry facts `fromObjectSchema` does not produce (here the managed-object
  // lock, `disabled: true`, and a marker key standing for the rest).
  const pool = [
    { name: 'name', label: 'Account Name', type: 'field:text', required: true, disabled: true, poolOnly: 'name' },
    { name: 'industry', label: 'Industry', type: 'field:select', disabled: true, poolOnly: 'industry' },
  ] as any[];
  const pooledCtx = { ...ctx, pool };

  it('draws the entries in the SECTION’s order, not the pool’s', () => {
    const fields = buildSectionFields({ fields: ['industry', 'name'] }, pooledCtx);
    expect(fields.map((f) => f.name)).toEqual(['industry', 'name']);
  });

  it('drops an entry the pool does not hold, in every shape — the objectui#9884 intersection', () => {
    const fields = buildSectionFields(
      {
        fields: [
          'billing_address',
          { field: 'billing_address', label: 'X' },
          { name: 'billing_address', type: 'text' },
          'name',
        ],
      },
      pooledCtx,
    );
    expect(
      fields.map((f) => f.name),
      '`billing_address` is declared by the object and absent from the pool',
    ).toEqual(['name']);
    // The control: the SAME section with no pool draws every entry.
    expect(
      buildSectionFields({ fields: ['billing_address', 'name'] }, ctx).map((f) => f.name),
    ).toEqual(['billing_address', 'name']);
  });

  it('a name string draws the POOLED field as it is', () => {
    const [f] = buildSectionFields({ fields: ['industry'] }, pooledCtx);
    expect(f).toBe(pool[1]);
  });

  it('a spec entry writes its overrides onto a COPY of the pooled field', () => {
    const [f] = buildSectionFields(
      {
        fields: [
          {
            field: 'industry',
            label: 'SECTION LABEL',
            required: true,
            helpText: 'Pick one',
            placeholder: 'Choose…',
            visibleWhen: "record.name != ''",
            colSpan: 2,
          },
        ],
      },
      pooledCtx,
    ) as any[];
    expect(f.label).toBe('SECTION LABEL');
    expect(f.required).toBe(true);
    expect(f.description).toBe('Pick one');
    expect(f.placeholder).toBe('Choose…');
    expect(f.visibleOn).toBe("record.name != ''");
    expect(f.colSpan).toBe(2);
    expect(f.poolOnly, 'the base is the pooled field, not `fromObjectSchema`').toBe('industry');
    expect(f.disabled, 'a pool-only fact survives the overrides').toBe(true);
    expect(pool[1].label, 'the pooled field itself is not written').toBe('Industry');
  });

  it('`readonly: false` on an entry cannot re-open a pooled field that is locked', () => {
    const [f] = buildSectionFields({ fields: [{ field: 'industry', readonly: false }] }, pooledCtx) as any[];
    expect(f.disabled).toBe(true);
  });

  it('an already-built runtime FormField entry is its own definition, drawn only when pooled', () => {
    const runtime = { name: 'industry', label: 'RUNTIME', type: 'field:text' };
    const [f] = buildSectionFields({ fields: [runtime as any] }, pooledCtx);
    expect(f.label).toBe('RUNTIME');
    expect((f as any).poolOnly).toBeUndefined();
  });
});

describe('sectionEntryName', () => {
  it('reads the identity of each of the three entry shapes', () => {
    expect(sectionEntryName('note')).toBe('note');
    expect(sectionEntryName({ field: 'note', name: 'legacy' })).toBe('note');
    expect(sectionEntryName({ name: 'note', field: { type: 'text' } })).toBe('note');
    expect(sectionEntryName({ label: 'nameless' })).toBeUndefined();
    expect(sectionEntryName(null)).toBeUndefined();
  });
});
