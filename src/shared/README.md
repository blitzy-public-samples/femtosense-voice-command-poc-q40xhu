# Shared Components

This directory contains shared components for the Femtosense Voice Command Generation system. These components are designed to be reusable across different parts of the application, promoting code reusability and maintaining consistency throughout the project.

## Overview

The shared components contribute to code reusability and standardization by providing common functionalities, interfaces, and utilities that can be used across different modules of the Femtosense Voice Command Generation system.

## Directory Structure

```
src/shared/
├── constants/
│   ├── api-endpoints.ts
│   ├── aws-config.ts
│   └── voice-registry.ts
├── interfaces/
│   ├── api-response.interface.ts
│   ├── file-storage.interface.ts
│   └── voice-command.interface.ts
├── types/
│   ├── intent.types.ts
│   └── language.types.ts
├── config/
│   ├── logging-config.json
│   └── voice-profiles.json
├── errors/
│   └── custom-errors.ts
├── utils/
│   ├── logger.ts
│   ├── security.ts
│   ├── validators.ts
│   ├── api-client.ts
│   └── file-manager.ts
└── tests/
    ├── interfaces.test.ts
    └── utils.test.ts
```

## Usage Guidelines

### Importing Shared Components

To use shared components in your code, import them as follows:

```typescript
import { ApiResponse } from '../shared/interfaces/api-response.interface';
import { logger } from '../shared/utils/logger';
import { API_ENDPOINTS } from '../shared/constants/api-endpoints';
```

### Contributing New Shared Resources

When adding new shared resources:

1. Place the new file in the appropriate subdirectory (e.g., constants, interfaces, utils).
2. Ensure the new resource is properly exported for use in other modules.
3. Update this README if necessary to reflect any new subdirectories or significant changes.
4. Add appropriate unit tests in the `tests/` directory.

### Maintaining Consistency

- Follow the established naming conventions and coding style.
- Ensure all shared components are well-documented with JSDoc comments.
- Keep shared components focused and avoid adding application-specific logic.

## Component Descriptions

### Constants

Centralized constant values used across the application:
- `api-endpoints.ts`: API endpoint URLs
- `aws-config.ts`: AWS configuration settings
- `voice-registry.ts`: Voice profile registry

### Interfaces

TypeScript interfaces for consistent typing:
- `api-response.interface.ts`: Standardized API response structure
- `file-storage.interface.ts`: File storage operations interface
- `voice-command.interface.ts`: Voice command data structure

### Types

TypeScript type definitions:
- `intent.types.ts`: Voice command intent types
- `language.types.ts`: Supported language types

### Config

Configuration files:
- `logging-config.json`: Logging configuration settings
- `voice-profiles.json`: Voice profile definitions

### Errors

Custom error definitions:
- `custom-errors.ts`: Application-specific error classes

### Utils

Common utility functions:
- `logger.ts`: Centralized logging utility
- `security.ts`: Security-related utilities
- `validators.ts`: Input validation functions
- `api-client.ts`: Reusable API client
- `file-manager.ts`: File system operations utility

## Testing Guidelines

- All shared components should have corresponding unit tests in the `tests/` directory.
- Use Jest for writing and running tests.
- Ensure high test coverage for all shared utilities and functions.

To run shared component tests:

```bash
npm run test:shared
```

## Contribution Guidelines

When contributing to shared components:

1. Ensure the new component is genuinely reusable across different parts of the application.
2. Write clear and comprehensive documentation for the new component.
3. Add appropriate unit tests with good coverage.
4. Update this README if adding new categories of shared components.
5. Follow the project's coding standards and best practices.

## Version History

### v1.0.0 (2023-11-15)
- Initial setup of shared components structure
- Added core utilities, interfaces, and constants

### v1.1.0 (2023-11-20)
- Added file storage interface and implementation
- Expanded voice registry with additional profiles

### v1.2.0 (2023-11-25)
- Introduced custom error classes
- Enhanced logging utilities with configurable options

For a detailed changelog, please refer to the project's main CHANGELOG.md file.