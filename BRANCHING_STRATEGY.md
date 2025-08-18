# Branching Strategy for mrRobotoV3

## Overview
This project uses a modified Git Flow strategy to ensure stability for users while enabling active development.

## Branch Types

### 🔒 `main` Branch
- **Purpose**: Production-ready code that users can safely pull
- **Protection**: Always stable, thoroughly tested
- **Updates**: Only from `develop` via pull requests
- **Rules**: 
  - Never commit directly to main
  - All merges must be reviewed
  - Must pass all tests before merging

### 🔄 `develop` Branch  
- **Purpose**: Integration branch for completed features
- **Protection**: Should be relatively stable
- **Updates**: From feature branches via pull requests
- **Rules**:
  - Features must be tested before merging
  - All tests must pass
  - Code review required

### 🚀 `feature/*` Branches
- **Purpose**: Individual feature development
- **Naming**: `feature/description-of-feature`
- **Examples**: 
  - `feature/add-logging-tests`
  - `feature/websocket-improvements`
  - `feature/new-command-parser`
- **Workflow**:
  - Branch from `develop`
  - Merge back to `develop` when complete

### 🔧 `hotfix/*` Branches
- **Purpose**: Emergency fixes for production issues
- **Naming**: `hotfix/description-of-fix`
- **Workflow**:
  - Branch from `main`
  - Merge to both `main` AND `develop`

## Workflow Steps

### Starting New Feature Development
```bash
# Switch to develop and pull latest
git checkout develop
git pull origin develop

# Create new feature branch
git checkout -b feature/your-feature-name

# Work on your feature...
git add .
git commit -m "Add new feature functionality"
git push origin feature/your-feature-name

# Create pull request to merge into develop
```

### Preparing for Release (Develop → Main)
```bash
# Switch to develop and ensure it's up to date
git checkout develop
git pull origin develop

# Run all tests to ensure stability
npm test
npm run test:coverage

# If tests pass, create pull request to merge develop → main
```

### Emergency Hotfix
```bash
# Branch from main for hotfix
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# Make the fix...
git add .
git commit -m "Fix critical bug"
git push origin hotfix/critical-bug-fix

# Create pull requests to merge into BOTH main and develop
```

## Protection Rules (Recommended)

### For `main` branch:
- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date before merging
- Restrict pushes to main branch

### For `develop` branch:
- Require pull request reviews  
- Require status checks to pass
- Allow squash merging

## Testing Requirements

Before merging to `develop`:
- [ ] All unit tests pass (`npm test`)
- [ ] Coverage thresholds met (`npm run test:coverage`)
- [ ] Code review completed
- [ ] Feature tested locally

Before merging to `main`:
- [ ] All tests pass on develop branch
- [ ] Integration testing completed
- [ ] Documentation updated
- [ ] Release notes prepared

## Branch Lifecycle

```
main ←←←←←←←←←← develop ←←←←←← feature/new-feature
  ↑                     ↑
  ↑                     ↑
hotfix/bug-fix ←←←←←←←←←←←←
```

## Current Migration Plan

1. **Create develop branch** from current main
2. **Set up branch protection** rules
3. **Move active development** to feature branches
4. **Use develop** as integration branch
5. **Keep main** for stable releases

## Commands to Set Up

```bash
# Create develop branch from main
git checkout main
git checkout -b develop
git push origin develop

# Set develop as default branch for new features
git checkout develop

# Future feature work
git checkout -b feature/next-enhancement
```

## Benefits of This Strategy

✅ **Users always have stable code** (main branch)
✅ **Active development doesn't break user experience**
✅ **Features can be developed in parallel**
✅ **Easy to rollback problematic changes**
✅ **Clear release process**
✅ **Emergency fixes can be deployed quickly**

## Tools & Integration

- **GitHub**: Set up branch protection rules
- **CI/CD**: Run tests automatically on pull requests
- **Code Review**: Require approvals before merging
- **Release Tags**: Tag releases on main branch
