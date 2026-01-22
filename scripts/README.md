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
- ✅ Links don't contain incorrect `/docs/` prefix
- ✅ Links point to existing files and routes
- ✅ Provides suggestions for fixing common issues

**Exit codes**:
- `0` - All links are valid
- `1` - Broken links found

**CI/CD Integration**: This script runs automatically on PRs that modify documentation files via the `.github/workflows/validate-docs-links.yml` workflow.

### fix-links.sh

**Purpose**: Bulk fix common broken link patterns in documentation.

**Usage**:
```bash
# Run the fix script
bash scripts/fix-links.sh
```

**What it fixes**:
- Removes `/docs/` prefix from internal links
- Corrects path references (`/spec/` → `/architecture/`, `/api/` → `/reference/api/`)
- Updates protocol paths to include `/reference/` prefix

**Note**: This is a one-time fix script. After fixing links, you should rely on the validation script to prevent future issues.

## Link Conventions

When adding internal links in documentation, follow these patterns:

### ✅ Correct

```markdown
[Quick Start](/guide/quick-start)
[Components](/components)
[API Reference](/reference/api/core)
[Protocol](/reference/protocol/overview)
[Architecture](/architecture/component)
```

### ❌ Incorrect

```markdown
[Quick Start](/docs/guide/quick-start)  <!-- ❌ Don't include /docs/ -->
[API](/api/core)                        <!-- ❌ Should be /reference/api/core -->
[Spec](/spec/component)                 <!-- ❌ Should be /architecture/component -->
```

## Why These Conventions?

Fumadocs configures the base URL as `/docs` in the site routing. When you add `/docs/` to links, it creates invalid paths like `/docs/docs/guide/quick-start`.

## See Also

- [CONTRIBUTING.md](../CONTRIBUTING.md) - Full documentation guidelines
- [Documentation Link Conventions](../CONTRIBUTING.md#documentation-link-conventions)
