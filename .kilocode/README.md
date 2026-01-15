# KiloCode Index Configuration

This directory contains the KiloCode indexing configuration for the **gmb-everywhere-mobile** project.

## Overview

The gmb-everywhere-mobile project is a React Native + Expo mobile application for Google My Business management. This configuration enables KiloCode's Antigravity feature for semantic code search and AI-assisted development.

## Configuration Files

### [`config.json`](config.json:1)
Basic KiloCode project configuration with managed indexing enabled.

### [`index.json`](index.json:1)
Comprehensive indexing configuration that defines:
- Project metadata and repository information
- File inclusion/exclusion patterns
- Semantic search and AI features
- React Native/Expo-specific optimizations

## Project Information

- **Project Name**: gmb-everywhere-mobile
- **Repository**: https://github.com/yjones-coder/gmb-everywhere-mobile.git
- **Language**: TypeScript
- **Framework**: React Native + Expo

## Indexing Strategy

### Included Files

The index includes:
- **Source Code**: All TypeScript/TSX and JavaScript/JSX files
- **Configuration**: Config files (`.ts`, `.js`, `.cjs`, `.json`)
- **Documentation**: Markdown files including design docs and implementation guides
- **Project Files**: `package.json`, `tsconfig.json`, `app.config.ts`

### Excluded Files

The index excludes:
- **Dependencies**: `node_modules/`, lock files
- **Build Artifacts**: `.expo/`, `dist/`, `build/`, `.next/`
- **Test Files**: `*.test.ts`, `*.spec.ts`, `__tests__/`, `tests/`
- **Assets**: Images, fonts, and other binary files
- **System Files**: `.git/`, `.vscode/`

### Priority Paths

High-priority directories for indexing:
- `app/` - Main application code (Expo Router)
- `components/` - Reusable UI components
- `hooks/` - Custom React hooks
- `lib/` - Utility libraries and helpers
- `server/` - Backend/API code
- `shared/` - Shared types and constants
- `constants/` - Application constants

## Features Enabled

### Semantic Search
- **Code Completion**: AI-powered code suggestions
- **Code Navigation**: Intelligent navigation through codebase
- **Refactoring Suggestions**: Automated refactoring recommendations
- **Documentation Generation**: Auto-generated documentation
- **Type Inference**: Enhanced TypeScript type inference
- **Import Optimization**: Automatic import management

### React Native Optimizations
- Platform-specific file handling (`.ios.tsx`, `.android.tsx`, `.web.tsx`)
- Expo configuration awareness
- Metro bundler integration
- Native module support

### Performance Optimizations
- **Incremental Indexing**: Only re-index changed files
- **Caching**: Persistent cache for faster subsequent indexing
- **Parallel Processing**: Multi-threaded indexing
- **Index on Save**: Automatic re-indexing when files are saved

## Usage

Once configured, KiloCode will automatically:
1. Index the project according to the patterns defined in [`index.json`](index.json:1)
2. Enable semantic code search across the codebase
3. Provide AI-assisted development features
4. Keep the index updated as files change

## File Size Limits

- Maximum file size for indexing: **500 KB**
- Files larger than this limit will be excluded from the index

## Maintenance

The index configuration is designed to be low-maintenance:
- Automatically excludes common build artifacts and dependencies
- Focuses on source code and documentation
- Optimized for React Native/Expo project structure

## Troubleshooting

If you experience issues with indexing:
1. Ensure [`config.json`](config.json:1) has `managedIndexingEnabled: true`
2. Check that file patterns in [`index.json`](index.json:1) match your project structure
3. Verify that excluded patterns aren't blocking important files
4. Check file sizes - files over 500 KB are automatically excluded

## Customization

To customize the indexing behavior, edit [`index.json`](index.json:1):
- Add/remove file patterns in `indexing.include` or `indexing.exclude`
- Adjust `priority_paths` to focus on specific directories
- Modify `max_file_size_kb` if needed
- Enable/disable specific features in the `features` section

## Best Practices

1. **Keep Dependencies Excluded**: Never index `node_modules/` or lock files
2. **Exclude Test Files**: Test files can clutter search results
3. **Prioritize Source Code**: Focus on application code over configuration
4. **Regular Updates**: Update patterns as project structure evolves
5. **Monitor Performance**: Adjust `max_file_size_kb` if indexing is slow

## Related Documentation

- [Project README](../README.md)
- [Design Documentation](../design.md)
- [Implementation Guide](../implementation.md)
- [Security Guidelines](../SECURITY.md)

---

*This configuration was created to optimize KiloCode's Antigravity feature for React Native + Expo development.*
