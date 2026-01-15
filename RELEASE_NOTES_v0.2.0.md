# Release Notes for Object UI v0.2.0

## Release Preparation Completed ✅

This document contains instructions for completing the release of Object UI version 0.2.0.

## What Has Been Done

### 1. Version Updates ✅
All 11 packages have been updated from version `0.1.0` to `0.2.0`:
- `@object-ui/types`
- `@object-ui/core`
- `@object-ui/react`
- `@object-ui/components`
- `@object-ui/designer`
- `@object-ui/cli`
- `@object-ui/data-objectql`
- `@object-ui/plugin-charts`
- `@object-ui/plugin-editor`
- `@object-ui/plugin-kanban`
- `@object-ui/plugin-markdown`

### 2. CHANGELOG.md Updated ✅
The CHANGELOG.md has been updated to:
- Move unreleased changes to version `[0.2.0] - 2026-01-15`
- Add proper release links
- Document all new features and changes

### 3. Quality Assurance ✅
- ✅ All tests pass (95 tests across 16 test files)
- ✅ All packages build successfully
- ✅ No linting errors

### 4. Git Tag Created ✅
A git tag `v0.2.0` has been created locally with the release notes.

## What's New in v0.2.0

### Added
- **Comprehensive test suite** using Vitest and React Testing Library
- **Test coverage** for @object-ui/core, @object-ui/react, @object-ui/components, and @object-ui/designer packages
- **GitHub Actions CI/CD workflows**:
  - CI workflow for automated testing, linting, and building
  - Release workflow for publishing new versions
- **Test coverage reporting** with @vitest/coverage-v8
- **Contributing guidelines** (CONTRIBUTING.md)
- **Documentation** for testing and development workflow in README
- **README files** for all core packages

### Changed
- Updated package.json scripts to use Vitest instead of placeholder test commands
- Enhanced README with testing instructions and CI status badges

## Next Steps to Complete the Release

### Option 1: Merge PR and Tag Manually (Recommended)

1. **Merge this PR** to the main branch

2. **After merging, checkout main and pull latest changes:**
   ```bash
   git checkout main
   git pull origin main
   ```

3. **Create and push the release tag:**
   ```bash
   git tag -a v0.2.0 -m "Release version 0.2.0"
   git push origin v0.2.0
   ```

4. **The GitHub Actions Release workflow will automatically:**
   - Run tests
   - Build all packages
   - Create a GitHub Release with the tag
   - (Optional) Publish to npm if you uncomment the publish steps in `.github/workflows/release.yml`

### Option 2: Tag from This Branch

1. **Checkout this branch:**
   ```bash
   git checkout copilot/release-new-version
   ```

2. **Push the tag that was created:**
   ```bash
   git push origin v0.2.0
   ```

3. **Then merge the PR to main**

Note: The tag `v0.2.0` already exists locally on this branch.

## Publishing to npm (Optional)

If you want to publish the packages to npm, you need to:

1. **Ensure you have an npm token** with publish permissions

2. **Add the token as a GitHub Secret** named `NPM_TOKEN`

3. **Uncomment the npm publish step** in `.github/workflows/release.yml`:
   ```yaml
   - name: Publish to npm
     run: pnpm publish -r --access public
     env:
       NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
   ```

4. **Ensure all packages have the correct npm settings** in their package.json:
   - `"publishConfig": { "access": "public" }` for scoped packages
   - Proper `main`, `module`, `types`, and `exports` fields

## Verification

After the release workflow completes, verify:

1. ✅ GitHub Release is created at: https://github.com/objectstack-ai/objectui/releases/tag/v0.2.0
2. ✅ All packages are tagged correctly
3. ✅ (If publishing) Packages are available on npm:
   - https://www.npmjs.com/package/@object-ui/types
   - https://www.npmjs.com/package/@object-ui/core
   - https://www.npmjs.com/package/@object-ui/react
   - https://www.npmjs.com/package/@object-ui/components
   - (and other packages)

## Rollback Plan

If something goes wrong:

1. **Delete the tag locally:**
   ```bash
   git tag -d v0.2.0
   ```

2. **Delete the tag remotely:**
   ```bash
   git push origin :refs/tags/v0.2.0
   ```

3. **Delete the GitHub Release** from the GitHub UI

4. **Fix the issues** and retry the release process

## Support

For questions or issues with this release:
- Check the [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines
- Review the [release workflow](.github/workflows/release.yml)
- Open an issue on GitHub

---

**Release prepared by:** GitHub Copilot Workspace Agent
**Date:** 2026-01-15
