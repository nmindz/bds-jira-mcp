# GitHub Actions CI/CD Pipeline Documentation

## 🚀 Overview

This repository includes a comprehensive CI/CD pipeline that automatically:

1. **Builds and Tests** the project on every push and pull request
2. **Publishes to NPM** when version changes are detected on main/master branch
3. **Creates GitHub Releases** automatically after successful NPM publication
4. **Provides detailed summaries** and notifications

## 📋 Pipeline Jobs

### Job 1: Build and Test
- ✅ Runs on all pushes and pull requests
- 🔨 Builds the TypeScript project
- 🧪 Runs the complete test suite (`pnpm run test:ci`)
- 📦 Uploads build artifacts and coverage reports
- 🌍 Uses Ubuntu latest with Node.js 18

### Job 2: Version Check and Publish
- ✅ Runs only on master branch pushes
- 🔍 Checks if the current version already exists on NPM
- 🚀 Publishes to NPM only if version is new
- ⏭️ Skips publication if version already exists
- 🔒 Requires NPM authentication token

### Job 3: GitHub Release Creation  
- ✅ Runs only after successful NPM publication
- 🏷️ Creates a GitHub release with the new version tag
- 📝 Extracts changelog content automatically
- 📦 Attaches downloadable release assets:
  - Package tarball (`.tgz`) for offline installation
  - Pre-built archive with compiled TypeScript
  - Source code archives (automatic)
- 🔗 Includes multiple installation methods and instructions

### Job 4: Pipeline Summary
- 📊 Provides a comprehensive summary of all pipeline steps
- ✅ Shows status of build, test, publish, and release steps
- 🔗 Includes relevant links and information

## 🔧 Required Repository Configuration

### 1. GitHub Environment Setup

This pipeline uses GitHub Environments for secure secret management:

#### **🌍 Production Environment** (Required)
1. In your GitHub repo: **Settings** → **Environments**
2. Create environment named `production` (exact name required)
3. Configure deployment protection rules if desired (optional)

#### **🔑 NPM_TOKEN** (Required for publishing)
1. Go to [npmjs.com](https://www.npmjs.com/) and log into your account
2. Navigate to **Account Settings** → **Access Tokens**
3. Click **Generate New Token** → **Classic Token**
4. Select **Automation** token type (for CI/CD)
5. Copy the generated token
6. In your GitHub repo: **Settings** → **Environments** → **production**
7. Under "Environment secrets", click **Add secret**
8. Name: `NPM_TOKEN`
9. Value: Your NPM token
10. Click **Add secret**

#### **🔑 GITHUB_TOKEN** (Automatically provided)
- This is automatically provided by GitHub Actions
- No manual configuration needed
- Used for creating releases and accessing repository information

### 2. Environment Benefits

Using GitHub Environments provides:
- **🔒 Enhanced Security**: Environment-specific secrets with access controls
- **🚦 Deployment Protection**: Optional approval workflows and branch restrictions  
- **📊 Deployment Tracking**: Visibility into production deployments
- **🔄 Environment History**: Track all deployments to production environment

### 3. Package Configuration

Ensure your `package.json` is properly configured:

```json
{
  "name": "bds-jira-mcp",
  "version": "1.1.2",
  "type": "module",
  "main": "build/index.js",
  "files": [
    "build",
    "scripts"
  ],
  "publishConfig": {
    "access": "public"
  }
}
```

### 4. NPM Account Setup

Make sure your NPM account:
- ✅ Has permission to publish the package name
- ✅ Is verified (email verification)
- ✅ Has 2FA enabled (recommended)

## 🎯 Pipeline Triggers

### Automatic Triggers
- **Push to master**: Builds, tests, and publishes if version changed
- **Pull Request**: Builds and tests only (no publishing)
- **Manual Release**: Can be triggered via GitHub releases

### Manual Triggers
You can manually trigger the pipeline by:
1. Creating a new release in GitHub UI
2. Pushing to master branch
3. Creating a pull request

## 📦 Version Management

### Automatic Version Detection
- Pipeline reads version from `package.json`
- Compares with existing versions on NPM
- Only publishes if version is new

### Version Bump Process
1. Update version in `package.json`:
   ```bash
   # Option 1: Manual
   # Edit package.json directly
   
   # Option 2: Using npm commands
   npm version patch  # 1.1.2 → 1.1.3
   npm version minor  # 1.1.2 → 1.2.0  
   npm version major  # 1.1.2 → 2.0.0
   
   # Option 3: Using your existing scripts
   pnpm run bump:patch
   pnpm run bump:minor
   pnpm run bump:major
   ```

2. Commit and push to master:
   ```bash
   git add package.json
   git commit -m "chore: bump version to 1.1.3"
   git push origin master
   ```

3. Pipeline will automatically:
   - Detect the version change
   - Build and test
   - Publish to NPM
   - Create GitHub release with assets:
     - NPM package tarball
     - Pre-built TypeScript archive
     - Source code archives

## 🔍 Monitoring and Troubleshooting

### Viewing Pipeline Status
1. Go to your GitHub repository
2. Click **Actions** tab
3. Select the workflow run to see detailed logs

### Common Issues and Solutions

#### ❌ NPM Publish Failed: "You must be logged in to publish packages"
**Solution**: Check that `NPM_TOKEN` is correctly configured in the `production` environment

#### ❌ NPM Publish Failed: "You cannot publish over the existing version"
**Solution**: This is expected behavior - the pipeline detected the version already exists

#### ❌ Tests Failed in CI
**Solution**: Check the test logs in the Actions tab. Tests run with mock JIRA credentials in CI

#### ❌ GitHub Release Failed: "Release already exists"  
**Solution**: Delete the existing release/tag or bump the version number

### Debug Mode
To enable debug logging, add this to your workflow file:
```yaml
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

## 📊 Pipeline Status Examples

### ✅ Successful Pipeline (New Version)
```
✅ Build & Test: Passed
🚀 Publish: Successfully published v1.1.3 to NPM  
📦 NPM: https://www.npmjs.com/package/bds-jira-mcp/v/1.1.3
🏷️ GitHub Release: Created v1.1.3 with assets
📥 Assets: Package tarball, build archive, source code
```

### ⏭️ Successful Pipeline (Existing Version)
```
✅ Build & Test: Passed
⏭️ Publish: Skipped (version already exists)
⏭️ GitHub Release: Skipped
```

### ❌ Failed Pipeline
```
❌ Build & Test: Failed
⏭️ Publish: Skipped
⏭️ GitHub Release: Skipped
```

## 🔒 Security Notes

- NPM token is stored securely in GitHub Environment secrets
- Token is only accessible during workflow execution in the production environment
- Pipeline only publishes from master branch to production environment
- Environment-based access controls provide additional security layer
- All dependencies are installed with `--frozen-lockfile` for security
- Build artifacts are automatically cleaned up after 7 days

## 🆘 Support

If you encounter issues with the pipeline:

1. **Check the Actions tab** for detailed error logs
2. **Verify environment configuration** and secrets in the `production` environment
3. **Ensure NPM account permissions** are correct
4. **Check package.json configuration** follows NPM standards
5. **Review this documentation** for common solutions

For additional help, check the existing issues or create a new one in the repository.
