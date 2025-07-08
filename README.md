# Notes App

A full-stack notes management application with user authentication, sharing capabilities, and access control.

## Project Structure

This is a **monorepo** using pnpm workspaces:
- `backend/` - NestJS API with Prisma ORM and PostgreSQL
- `frontend/` - (To be created)

## Features

### Core Functionality
- **User Management** - Registration, authentication, and profile management
- **Notes Management** - Create, edit, delete, and organize notes
- **Access Control** - Share notes with specific users (VIEW/EDIT permissions)
- **Public Notes** - Make notes publicly accessible without authentication
- **Soft Delete** - Restore deleted users and notes
- **Full-text Search** - Search across note titles and content

### Technical Features
- **JWT Authentication** - Secure token-based authentication
- **Role-based Access Control** - Fine-grained permission system
- **Audit Logging** - Track creation, updates, and deletions
- **Database Migrations** - Version-controlled schema changes
- **Comprehensive Testing** - Unit, integration, and E2E tests

## Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm 8+
- PostgreSQL 14+

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd notes-app
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials
```

4. Set up the database
```bash
cd backend
pnpm run db:migrate
pnpm run db:seed
```

5. Start development server
```bash
# From root directory
pnpm --filter backend run start:dev
```

The API will be available at `http://localhost:3000`

## Development Commands

### Root-level commands
```bash
pnpm install                           # Install dependencies for all workspaces
pnpm --filter backend <command>        # Run commands in backend workspace
pnpm --filter frontend <command>       # Run commands in frontend workspace
```

### Backend Development
```bash
pnpm --filter backend run start:dev    # Start development server
pnpm --filter backend run build        # Build backend
pnpm --filter backend run lint         # Lint code
pnpm --filter backend run test         # Run unit tests
pnpm --filter backend run test:e2e     # Run e2e tests
```

### Database Operations
```bash
cd backend
pnpm run db:migrate                    # Create and apply migration
pnpm run db:generate                   # Generate Prisma client
pnpm run db:studio                     # Open Prisma Studio GUI
pnpm run db:seed                       # Seed database with test data
pnpm run db:reset                      # Reset database and run migrations
```

## API Endpoints

### Users
- `POST /users` - Create user
- `GET /users` - List users (with filtering)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Soft delete user
- `POST /users/:id/restore` - Restore deleted user

### Notes
- `POST /notes` - Create note
- `GET /notes` - List user's notes (with search and filtering)
- `GET /notes/:id` - Get note by ID
- `PUT /notes/:id` - Update note
- `DELETE /notes/:id` - Delete note
- `POST /notes/:id/share` - Share note with user
- `DELETE /notes/:id/share/:userId` - Revoke note access
- `GET /notes/public` - List public notes

## Database Schema

### Core Models
- **User** - User account information
- **Note** - Notes with content and metadata
- **UserNoteAccess** - Permission junction table

### Key Features
- **Soft Delete** - All models include `deletedAt` timestamp
- **Audit Fields** - `createdAt`, `updatedAt` tracking
- **Access Control** - `VIEW` and `EDIT` permission levels
- **Public Access** - Notes can be marked public for unrestricted access

## Testing

### Running Tests
```bash
# Unit tests
pnpm --filter backend run test

# Watch mode for TDD
pnpm --filter backend run test:watch

# Coverage report
pnpm --filter backend run test:cov

# E2E tests
pnpm --filter backend run test:e2e
```

### Testing Strategy
- **Unit tests** for business logic with mocking
- **Controller tests** with service isolation
- **E2E tests** for complete API workflows
- **Database tests** with test database isolation

## Architecture

### Backend Stack
- **NestJS** - Progressive Node.js framework
- **Prisma** - Database ORM with PostgreSQL
- **JWT** - Authentication tokens
- **Class-validator** - Request validation
- **Jest** - Testing framework

### Design Patterns
- **Modular architecture** - Domain-driven module organization
- **Service layer** - Business logic separation
- **Repository pattern** - Data access abstraction via Prisma
- **Dependency injection** - NestJS IoC container

### Security Features
- **Authentication guards** - JWT token validation
- **Authorization** - Role-based access control
- **Input validation** - Request DTO validation
- **SQL injection prevention** - Parameterized queries via Prisma

## Development Status

### Current State
- ✅ Backend API fully functional
- ✅ Database schema and migrations
- ✅ Authentication system (development mode)
- ✅ Comprehensive test coverage
- ⏳ Frontend development pending

### Known Limitations
- Authentication currently hardcoded to `userId = 1` for development
- Frontend application not yet implemented
- Production deployment configuration pending

## Contributing

### Code Quality
- **Pre-commit hooks** - Husky + lint-staged
- **Code formatting** - Prettier
- **Linting** - ESLint with TypeScript
- **Type checking** - Full TypeScript strict mode

### Development Workflow
1. Create feature branch from `main`
2. Implement changes with tests
3. Run `pnpm run lint` and `pnpm run test`
4. Submit pull request
5. Automated checks must pass

### Commit Standards
- Use conventional commits format
- Include test coverage for new features
- Update documentation for API changes

## Support

For questions or issues:
1. Check the backend-specific guide in `backend/CLAUDE.md`
2. Review the API documentation and test examples
3. Ensure database is properly configured and migrated
4. Verify all dependencies are installed with `pnpm install`

## License

This project is licensed under the ISC License.