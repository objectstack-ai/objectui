/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#7181 — the two extension-host readers honour `children`, the
 * spelling the rest of the platform declares.
 *
 * ## The defect these pins were built for
 *
 * `children` is declared on four faces: the TypeScript declaration and the zod
 * mirror in `@object-ui/types`, `validateSchema` in `@object-ui/core` (which
 * reads `schema.children || schema.body`, children FIRST), and the manifest
 * tier's `BASE_PROPS` in `@object-ui/sdui-parser` (which carries `children` and
 * does NOT carry `body`). Both readers in this package guarded their child-list
 * recursion on `schema.body` ALONE.
 *
 * So an author who wrote the declared spelling got, from the tool that is
 * supposed to be teaching them the format:
 *
 *   - a VS Code preview that rendered the node EMPTY — no error, no diagnostic,
 *     just a blank card or container; and
 *   - every child silently skipped by the validator, so a child missing its
 *     required `type` drew no warning at all.
 *
 * Both failures are SILENT, which is the worst direction for a metadata tool:
 * the author's file is fine, the platform blesses it, and the tooling reports
 * nothing while showing them nothing.
 *
 * ## Why these run the SHIPPED source instead of importing the modules
 *
 * Two different reasons, one per reader, and both are the same reason the
 * sibling `export-to-react-*` pins give:
 *
 *   - `PreviewProvider`'s renderer is not a module at all. It lives as JS text
 *     inside a TEMPLATE LITERAL that becomes the webview's inline script, so
 *     this package's `tsc --noEmit` sees one string and nothing type-checks or
 *     executes it. Extracting and running that text is the only way to observe
 *     the code the user's preview actually runs — and it means the pin is on
 *     the SHIPPED text, not on a copy of it that can drift.
 *   - `SchemaValidator` imports `vscode`, which has no runtime module outside
 *     the extension host and no alias in this repo's vitest config. It is
 *     transpiled here and executed against a stub of the seven `vscode` members
 *     it touches, so the pin exercises the real recursion rather than asserting
 *     on source text.
 *
 * ⚠️ Source-text assertions were deliberately NOT used for either. An assertion
 * that the string `schema.children` appears would pass against a `children` arm
 * that is present but unreachable, which is precisely the failure being pinned.
 *
 * ## The `body` arm is expected to keep working
 *
 * Each pin asserts BOTH spellings. Removing the `body` arm is objectui#6771
 * step 2, not this change, so a `body`-spelled document rendering or validating
 * differently than before is a regression these pins must also catch.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));

const PREVIEW_SOURCE = readFileSync(
  resolve(HERE, '../providers/PreviewProvider.ts'),
  'utf8'
);
const VALIDATOR_SOURCE = readFileSync(
  resolve(HERE, '../providers/SchemaValidator.ts'),
  'utf8'
);

/* ------------------------------------------------------------------ *
 * Reader 1 — the preview's shipped inline renderer
 * ------------------------------------------------------------------ */

interface StubElement {
  tag: string;
  className: string;
  textContent: string;
  rows: number;
  type: string;
  placeholder: string;
  children: StubElement[];
  appendChild(child: StubElement): void;
}

function createStubElement(tag: string): StubElement {
  return {
    tag,
    className: '',
    textContent: '',
    rows: 0,
    type: '',
    placeholder: '',
    children: [],
    appendChild(child: StubElement) {
      this.children.push(child);
    },
  };
}

/** Every element below the one returned, at any depth. */
function countDescendants(element: StubElement): number {
  return element.children.reduce(
    (total, child) => total + 1 + countDescendants(child),
    0
  );
}

type RendererFn = (schema: unknown) => StubElement;

/**
 * Lift `createElementFromSchema` out of the webview HTML template and make it
 * callable. The anchors are asserted rather than assumed: if either moves, this
 * fails loudly instead of silently pinning nothing.
 */
function loadShippedPreviewRenderer(): RendererFn {
  const start = PREVIEW_SOURCE.indexOf('function createElementFromSchema');
  expect(
    start,
    'anchor "function createElementFromSchema" not found in PreviewProvider.ts — ' +
      'the renderer moved and this pin is measuring nothing'
  ).toBeGreaterThan(-1);

  const end = PREVIEW_SOURCE.indexOf('// Render the schema', start);
  expect(
    end,
    'anchor "// Render the schema" not found after the renderer in PreviewProvider.ts'
  ).toBeGreaterThan(start);

  // The renderer is written inside a template literal, so its backticks and
  // interpolations are escaped in the TypeScript source. Undo exactly that.
  const source = PREVIEW_SOURCE.slice(start, end)
    .replace(/\\`/g, '`')
    .replace(/\\\$\{/g, '${')
    .replace(/\\\\/g, '\\');

  const document = { createElement: createStubElement };
  return new Function(
    'document',
    `${source}\nreturn createElementFromSchema;`
  )(document) as RendererFn;
}

describe('objectui#7181 — the VS Code preview renders `children`, not only `body`', () => {
  const render = loadShippedPreviewRenderer();
  const child = { type: 'text', content: 'Hello' };

  it('renders a `card` node the same whichever child-list spelling it uses', () => {
    const viaBody = countDescendants(
      render({ type: 'card', title: 'T', body: [child] })
    );
    const viaChildren = countDescendants(
      render({ type: 'card', title: 'T', children: [child] })
    );

    // The title element plus the one rendered child. Asserted absolutely, so a
    // renderer that dropped BOTH spellings could not satisfy this by symmetry.
    expect(viaBody).toBe(2);
    expect(viaChildren).toBe(2);
  });

  it('renders a generic container node the same whichever spelling it uses', () => {
    const viaBody = countDescendants(render({ type: 'div', body: [child] }));
    const viaChildren = countDescendants(
      render({ type: 'div', children: [child] })
    );

    expect(viaBody).toBe(1);
    expect(viaChildren).toBe(1);
  });

  it('renders nested `children` all the way down', () => {
    const tree = {
      type: 'div',
      children: [{ type: 'card', title: 'T', children: [child] }],
    };
    // div -> card -> (title, text)
    expect(countDescendants(render(tree))).toBe(3);
  });

  it('still honours a single non-array child node under either spelling', () => {
    expect(countDescendants(render({ type: 'div', body: child }))).toBe(1);
    expect(countDescendants(render({ type: 'div', children: child }))).toBe(1);
  });
});

/* ------------------------------------------------------------------ *
 * Reader 2 — the extension's schema validator
 * ------------------------------------------------------------------ */

interface CapturedDiagnostic {
  message: string;
}

/**
 * Transpile and execute `SchemaValidator.ts` against a stub of the `vscode`
 * members it touches, returning the diagnostics it publishes for `json`.
 */
function validateWithShippedValidator(schema: unknown): CapturedDiagnostic[] {
  const published: CapturedDiagnostic[] = [];

  const vscodeStub = {
    languages: {
      createDiagnosticCollection: () => ({
        set: (_uri: unknown, diagnostics: CapturedDiagnostic[]) => {
          published.splice(0, published.length, ...diagnostics);
        },
        clear: () => undefined,
        dispose: () => undefined,
      }),
    },
    window: {
      setStatusBarMessage: () => undefined,
      showErrorMessage: () => undefined,
      showInformationMessage: () => undefined,
    },
    // `Diagnostic` is captured by message only; the range is not under test.
    Diagnostic: class {
      constructor(
        public range: unknown,
        public message: string,
        public severity?: unknown
      ) {}
    },
    Range: class {
      constructor(...args: unknown[]) {
        this.args = args;
      }
      args: unknown[];
      translate() {
        return this;
      }
    },
    DiagnosticSeverity: { Error: 0, Warning: 1, Information: 2, Hint: 3 },
  };

  const transpiled = ts.transpileModule(VALIDATOR_SOURCE, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const moduleShim: { exports: Record<string, unknown> } = { exports: {} };
  new Function(
    'require',
    'module',
    'exports',
    transpiled
  )(
    (specifier: string) => {
      if (specifier === 'vscode') return vscodeStub;
      throw new Error(`unexpected require("${specifier}") in SchemaValidator`);
    },
    moduleShim,
    moduleShim.exports
  );

  const SchemaValidatorClass = moduleShim.exports.SchemaValidator as new () => {
    validateDocument(document: unknown): Promise<void>;
  };

  const text = JSON.stringify(schema, null, 2);
  const validator = new SchemaValidatorClass();
  // `validateDocument` is synchronous in everything it does before publishing.
  void validator.validateDocument({
    getText: () => text,
    positionAt: () => ({ translate: () => ({}) }),
    uri: { toString: () => 'stub://doc.objectui.json' },
  });

  return published;
}

describe('objectui#7181 — the VS Code validator recurses into `children`, not only `body`', () => {
  // A child missing its required `type` is the observable: the validator warns
  // about it ONLY if the recursion actually reached that child.
  const untypedChild = { className: 'p-4' };

  it('reaches a child spelled `children` and reports its missing `type`', () => {
    const diagnostics = validateWithShippedValidator({
      type: 'card',
      children: [untypedChild],
    });

    expect(diagnostics.map((d) => d.message)).toContain(
      'Missing required property "type"'
    );
  });

  it('still reaches a child spelled `body` and reports its missing `type`', () => {
    const diagnostics = validateWithShippedValidator({
      type: 'card',
      body: [untypedChild],
    });

    expect(diagnostics.map((d) => d.message)).toContain(
      'Missing required property "type"'
    );
  });

  it('reports nothing for a well-formed tree under either spelling', () => {
    const typedChild = { type: 'text', content: 'Hello' };

    expect(
      validateWithShippedValidator({ type: 'card', children: [typedChild] })
    ).toHaveLength(0);
    expect(
      validateWithShippedValidator({ type: 'card', body: [typedChild] })
    ).toHaveLength(0);
  });
});
