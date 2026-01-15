# Changeset and Automated Release Setup

## Overview

This document describes the changeset-based automated release workflow that has been set up for the Object UI monorepo.

## What Changed

### 1. Dependencies
- Added `@changesets/cli` as a development dependency
- Configured changesets for the monorepo structure

### 2. Configuration Files
- **`.changeset/config.json`**: Changeset configuration
  - Set to public access for npm packages
  - Ignores example and app packages
  - Configured for `main` as the base branch
  
- **`.changeset/README.md`**: Enhanced documentation for changeset usage

### 3. Package Scripts
Added the following scripts to `package.json`:
- `pnpm changeset`: Create a new changeset
- `pnpm changeset:version`: Bump versions based on changesets
- `pnpm changeset:publish`: Publish packages to npm

### 4. GitHub Actions Workflows

#### `changeset-release.yml`
- **Trigger**: Push to `main` branch
- **Purpose**: Automates version bumping and package publishing
- **Process**:
  1. Detects changesets in merged PRs
  2. Creates/updates a "Version Packages" PR
  3. When merged, publishes to npm and creates GitHub releases

#### `changeset-check.yml`
- **Trigger**: Pull requests
- **Purpose**: Ensures PRs include changesets when modifying packages
- **Behavior**:
  - Checks for changeset files when packages are modified
  - Fails if no changeset found
  - Can be bypassed with `skip-changeset` label

### 5. Documentation Updates
- **CONTRIBUTING.md**: Added comprehensive section on version management
- **.github/WORKFLOWS.md**: Documented the new workflows
- **.changeset/README.md**: Object UI-specific changeset guide

## How to Use

### For Contributors

#### Making Changes to Packages

1. **Make your code changes**
   ```bash
   # Edit files in packages/
   ```

2. **Create a changeset**
   ```bash
   pnpm changeset
   ```
   
3. **Follow the prompts**:
   - Select which packages changed
   - Choose version bump type (major/minor/patch)
   - Write a description of the changes

4. **Commit the changeset**
   ```bash
   git add .changeset/*.md
   git commit -m "feat: add new feature"
   ```

5. **Create PR**
   - Your PR will now include the changeset
   - The changeset-check workflow will pass

#### When You Don't Need a Changeset

If your PR doesn't modify package code (e.g., docs only, examples, tests), add the `skip-changeset` label to bypass the check.

### For Maintainers

#### Publishing a Release

1. **Merge PRs with changesets**
   - Contributors create PRs with changesets
   - Merge them to `main` after review

2. **Review the Version PR**
   - The changeset-release workflow automatically creates a "Version Packages" PR
   - This PR updates version numbers and CHANGELOGs
   - Review the changes

3. **Merge the Version PR**
   - When you merge it, packages are automatically published to npm
   - GitHub releases are created with tags

#### Emergency Manual Release

If needed, you can manually bump versions and publish:

```bash
# Bump versions
pnpm changeset:version

# Review changes
git diff

# Commit
git add .
git commit -m "chore: release packages"

# Build
pnpm build

# Publish
pnpm changeset:publish
```

## Required Secrets

For automated publishing to work, ensure the following secrets are configured in GitHub repository settings:

- `NPM_TOKEN`: npm authentication token with publish permissions

## Benefits

1. **Automated Version Management**: No manual version number editing
2. **Comprehensive Changelogs**: Auto-generated from changeset descriptions
3. **Coordinated Releases**: All packages updated together correctly
4. **Semantic Versioning**: Enforced through changeset type selection
5. **Clear History**: Each release has a dedicated PR for review
6. **Reduced Errors**: Eliminates manual version conflicts and mistakes

## Semantic Versioning Guide

Choose the appropriate version bump type:

- **Patch (0.0.x)**: Bug fixes, minor improvements
  - Example: "Fix validation error in form component"
  
- **Minor (0.x.0)**: New features (backwards compatible)
  - Example: "Add DatePicker component"
  
- **Major (x.0.0)**: Breaking changes
  - Example: "Remove deprecated API methods"

## Troubleshooting

### Changeset check failing but I have a changeset

Ensure:
1. The changeset file is in `.changeset/` directory
2. It's named `*.md` (not `README.md`)
3. It follows the correct format (see examples in `.changeset/`)

### Version PR not created

Check:
1. Changesets exist in `.changeset/` directory
2. The changeset-release workflow ran successfully
3. GitHub Actions has proper permissions

### Publishing failed

Verify:
1. `NPM_TOKEN` secret is set correctly
2. Token has publish permissions
3. Package names are available on npm
4. All tests and builds pass

## Example Changeset

Here's what a changeset file looks like:

```markdown
---
"@object-ui/react": minor
"@object-ui/components": patch
---

Add support for custom validation rules in form components

This change introduces a new `validators` prop that allows developers to define custom validation logic for form fields. The components package is updated to use these validators in the form renderer.
```

## Resources

- [Changesets Documentation](https://github.com/changesets/changesets)
- [Contributing Guide](../CONTRIBUTING.md#versioning-and-releases)
- [Workflows Documentation](../.github/WORKFLOWS.md)
- [Semantic Versioning](https://semver.org/)

---

For questions or issues with the changeset workflow, please open a GitHub issue or discussion.
