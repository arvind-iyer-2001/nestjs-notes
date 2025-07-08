# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a **monorepo** using pnpm workspaces with:
- `backend/` - NestJS API with Prisma ORM
- `frontend/` - (To be created)

## Commands

### Root-level commands
- `pnpm install` - Install dependencies for all workspaces
- `pnpm --filter backend <command>` - Run commands in backend workspace
- `pnpm --filter frontend <command>` - Run commands in frontend workspace

### Backend Development (from root)
- `pnpm --filter backend run start:dev` - Start backend development server
- `pnpm --filter backend run build` - Build backend
- `pnpm --filter backend run lint` - Lint backend code
- `pnpm --filter backend run test` - Run backend tests
- `pnpm --filter backend run test:e2e` - Run backend e2e tests

### Database Operations (from backend directory)
- `pnpm run db:migrate` - Create and apply migration
- `pnpm run db:generate` - Generate Prisma client
- `pnpm run db:studio` - Open Prisma Studio GUI
- `pnpm run db:seed` - Run database seeding
- `pnpm run db:reset` - Reset database and run migrations
- `pnpm run db:push` - Push schema changes without migration
- `pnpm run db:format` - Format Prisma schema files

## Architecture Overview

### Backend (NestJS Notes API)
The backend is a **notes management API** with user authentication, built with:
- **NestJS** framework with TypeScript
- **Prisma ORM** with PostgreSQL
- **JWT authentication** (currently hardcoded userId=1 for development)
- **Soft delete pattern** throughout all models

### Core Features
1. **User Management** - CRUD operations with soft delete
2. **Notes Management** - Create, share, and access control
3. **Access Control System** - Fine-grained permissions via UserNoteAccess table
4. **Public Notes** - Notes can be marked public for unrestricted access

### Database Schema
- **Users** ↔ **Notes** via ownership and shared access
- **UserNoteAccess** junction table with VIEW/EDIT permissions
- All models include audit fields: `createdAt`, `updatedAt`, `deletedAt`
- Schema split across files in `prisma/models/`

### Module Structure
Each domain follows consistent NestJS patterns:
```
module/
├── dto/                    # DTOs with validation
├── *.controller.ts         # REST endpoints
├── *.service.ts           # Business logic
├── *.module.ts            # Module config
└── *.spec.ts              # Tests
```

## Development Patterns

### Pre-commit Hooks
- **Husky** + **lint-staged** configured at root level
- Auto-formats backend TypeScript files on commit
- Run `pnpm run prepare` after fresh clone

### Testing Strategy
- Unit tests for services with mocking
- Controller tests with service isolation
- E2E tests for full API workflows
- Use `pnpm --filter backend run test:watch` for TDD

### Error Handling
- Typed NestJS exceptions with proper HTTP codes
- Service-layer error handling with meaningful messages
- Database error mapping in `handleDatabaseError()` methods

## Key Implementation Details

### Authentication Status
- Currently hardcoded `userId = 1` for development
- JWT infrastructure exists but not fully integrated
- Auth guards and strategies implemented but not enforced

### Access Control Logic
- **Owners** have full control over notes
- **Shared users** get VIEW or EDIT permissions
- **Public notes** bypass permission checks for read operations
- Permission validation happens in service layer

### Performance Considerations
- Content field excluded from list endpoints
- Soft delete awareness in all queries
- Pagination and filtering standardized across modules

For detailed backend-specific guidance, see `backend/CLAUDE.md`.