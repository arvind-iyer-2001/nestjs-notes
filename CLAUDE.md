# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `pnpm install` - Install dependencies
- `pnpm run start:dev` - Start development server with hot reload
- `pnpm run start` - Start production server
- `pnpm run start:prod` - Start production server (built)

### Build & Quality
- `pnpm run build` - Build the application
- `pnpm run lint` - Run ESLint with auto-fix
- `pnpm run format` - Format code with Prettier

### Testing
- `pnpm run test` - Run unit tests
- `pnpm run test:watch` - Run tests in watch mode
- `pnpm run test:cov` - Run tests with coverage report
- `pnpm run test:e2e` - Run end-to-end tests
- `pnpm test specific-file.spec.ts` - Run tests for specific file

### Database
- `npx prisma migrate dev` - Create and apply migration
- `npx prisma generate` - Generate Prisma client (required after schema changes)
- `npx prisma studio` - Open Prisma Studio GUI

## Architecture

### Framework & Stack
- **NestJS** - Progressive Node.js framework with TypeScript
- **Prisma** - Database ORM with PostgreSQL
- **Class-validator & Class-transformer** - Request validation and transformation

### Core Application Structure
This is a **notes management API** with user authentication capabilities. The application follows a modular architecture with two primary domains:

1. **User Management** - User CRUD operations with soft delete
2. **Notes Management** - Note creation, sharing, and access control

### Database Design
- **Soft delete pattern** throughout - `deletedAt` timestamps instead of hard deletes
- **Audit fields** - All models include `createdAt`, `updatedAt`, `deletedAt`
- **Schema modularity** - Split into separate files under `prisma/models/`
- **Access control system** - Fine-grained permissions via `UserNoteAccess` junction table

### Key Models & Relationships
- **User** → **Note** (one-to-many via `ownerId`)
- **User** ↔ **Note** (many-to-many via `UserNoteAccess` for shared access)
- **AccessType enum** - `VIEW` or `EDIT` permissions for shared notes
- **Public notes** - `isPublic` boolean for unrestricted access

### Module Structure Pattern
Each domain follows consistent NestJS module organization:
```
module/
├── dto/                    # Data Transfer Objects with validation
│   ├── create-*.dto.ts
│   ├── update-*.dto.ts  
│   ├── query-*.dto.ts
│   └── index.ts           # Barrel exports
├── *.controller.ts        # REST API endpoints
├── *.service.ts          # Business logic layer
├── *.module.ts           # NestJS module configuration
└── *.spec.ts             # Unit tests
```

### Service Layer Architecture
Services contain all business logic and follow these patterns:
- **Permission validation** - Check ownership/access before operations
- **Soft delete awareness** - Exclude deleted records by default
- **Comprehensive error handling** - Typed exceptions with appropriate HTTP codes
- **Pagination & filtering** - Standardized query patterns across modules
- **Cross-service dependencies** - UserService methods used by NotesService to avoid duplication

### Notes-Specific Patterns
- **Access control logic** - Notes can be accessed by owner, users with explicit permissions, or public visibility
- **Content separation** - List endpoints exclude `content` field for performance
- **Permission hierarchy** - Owners have full control, EDIT users can modify, VIEW users read-only
- **Search functionality** - Full-text search across title and owner information

### Authentication Status
- **Current state** - Hardcoded `userId = 1` in controllers for development
- **TODO** - Replace with auth guards and JWT token extraction
- **Pattern** - All controller methods expect authenticated user context

### Database Schema Files
- Main schema: `prisma/schema.prisma`
- User model: `prisma/models/user.prisma`  
- Notes & access: `prisma/models/note.prisma`
- Enums: `prisma/models/enum.prisma`
- Migrations: `prisma/migrations/`

## Development Notes

### Working with Notes
- Notes have **ownership-based access control** - only owners can delete
- **Shared access** via UserNoteAccess table with VIEW/EDIT permissions
- Use `includeDeleted: true` in service methods to include soft-deleted notes
- **Public notes** bypass permission checks for read operations
- Content field excluded from list views for performance

### Working with Users  
- Email uniqueness validation only applies to active (non-deleted) users
- UserService.`ensureUserExists()` is public for cross-service validation
- Restore functionality available through `restoreUser()` method

### Error Handling Conventions
- Use typed NestJS exceptions (`NotFoundException`, `ForbiddenException`, etc.)
- Database errors handled in service layer with meaningful messages  
- Validation automatically handled by ValidationPipe with class-validator DTOs
- Custom `handleDatabaseError()` methods map Prisma errors to HTTP codes

### Testing Strategy
- **Unit tests** for all services with comprehensive mocking
- **Controller tests** with service mocking for dependency isolation
- Mock data follows real schema structure with proper relationships
- Test both success and error scenarios for all business logic paths