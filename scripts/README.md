# Version Bumping

This directory contains scripts for managing the version of the Techne extension.

## Semantic Versioning

The project follows [Semantic Versioning](https://semver.org/) (SemVer) principles:

- **MAJOR** version when you make incompatible API changes (X.0.0)
- **MINOR** version when you add functionality in a backward compatible manner (0.X.0)
- **PATCH** version when you make backward compatible bug fixes (0.0.X)

## How to Bump the Version

You can bump the version using npm scripts:

```bash
# Bump patch version (1.0.0 -> 1.0.1)
npm run version:patch

# Bump minor version (1.0.0 -> 1.1.0)
npm run version:minor

# Bump major version (1.0.0 -> 2.0.0)
npm run version:major
```

Alternatively, you can run the script directly:

```bash
node scripts/bump-version.js [patch|minor|major]
```

## What Gets Updated

The script updates the version in:
- `package.json`
- `public/manifest.json`
- `package-lock.json` (via npm)

## After Bumping

After bumping the version, you should:

1. Verify the changes
2. Commit the changes with a message like: `git commit -am "Bump version to X.Y.Z"`
3. Consider creating a git tag: `git tag vX.Y.Z`
4. Push changes and tags: `git push && git push --tags` 