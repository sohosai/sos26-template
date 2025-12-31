# @sos26/shared

Shared types, utilities, and constants for the SOS26 monorepo.

## Structure

```
src/
├── types/       # Shared TypeScript types and interfaces
├── utils/       # Shared utility functions
├── constants/   # Shared constants and configurations
└── index.ts     # Main export file
```

## Usage

Import shared code in your apps:

```typescript
import { User, ApiResponse, formatDate, HTTP_STATUS } from '@sos26/shared';
```

## Development

This package is part of the SOS26 monorepo and uses Bun as the runtime.
