# Scripts Directory

This directory contains utility scripts for maintaining the ObjectUI project.

## Available Scripts

### validate-docs-links.mjs

**Purpose**: Validates all internal links in the documentation to prevent 404 errors.

**Usage**:
```bash
# Run validation
npm run validate:links

# Or directly
node scripts/validate-docs-links.mjs
```

**What it checks**:
- ✅ Links point to existing files and routes
- ✅ Links use correct path structure with `/docs/` prefix
- ✅ Provides suggestions for fixing common issues

**Exit codes**:
- `0` - All links are valid
- `1` - Broken links found

**CI/CD Integration**: This script runs automatically on PRs that modify documentation files via the `.github/workflows/validate-docs-links.yml` workflow.

## Link Conventions

When adding internal links in documentation, follow these patterns:

### ✅ Correct

```markdown
[Quick Start](/docs/guide/quick-start)
[Components](/docs/components)
[API Reference](/docs/reference/api/core)
[Protocol](/docs/reference/protocol/overview)
[Architecture](/docs/architecture/component)
```

### ❌ Incorrect

```markdown
[Quick Start](/guide/quick-start)       <!-- ❌ Missing /docs/ prefix -->
[API](/api/core)                        <!-- ❌ Should be /docs/reference/api/core -->
[Spec](/spec/component)                 <!-- ❌ Should be /docs/architecture/component -->
```

## Why These Conventions?

Fumadocs is configured with `baseUrl: '/docs'`, which means all documentation pages are served under the `/docs` route. Internal links must include the `/docs/` prefix to match the actual URL structure where the pages are accessible.

## See Also

- [CONTRIBUTING.md](../CONTRIBUTING.md) - Full documentation guidelines
- [Documentation Link Conventions](../CONTRIBUTING.md#documentation-link-conventions)
