# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern wishlist web application built with Next.js, TypeScript, and PostgreSQL. Users can create and share wishlists, coordinate gift-giving while preserving surprises, and collaborate in real-time.

## Tech Stack

- **Frontend**: Next.js with App Router, TypeScript, shadcn/ui, Tailwind CSS v4
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL, Better Auth
- **Tools**: pnpm (package manager), Biome (linting/formatting), Vitest (testing)
- **Real-time**: WebSockets via Socket.io or native WebSocket API
- **Storage**: Vercel Blob Storage for images (1MB max)
- **Deployment**: Vercel platform

## Commands

Standard Next.js commands apply once the project is set up:

- `pnpm install` - Install dependencies
- `pnpm dev` - Start development server (user manages this, don't start it yourself)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `npx biome check` - Run Biome linting
- `npx biome check --write` - Run Biome linting with auto-fix
- `tsc --noEmit` - Run TypeScript type checking
- `pnpm test` - Run tests with Vitest

**IMPORTANT**: Always run `npx biome check --write` and `tsc --noEmit` after making changes to fix linting and type errors immediately.

## Architecture

### Database Schema
- Complete schema defined in `prisma/schema.prisma` (when implemented)
- Key models: User, Wishlist, WishlistItem, Friendship, FriendRequest, Claim, Occasion
- Features soft deletion for undo functionality
- WebSocket connection tracking for real-time features

### Authentication
- Google OAuth integration via Better Auth
- Session management for user authentication state

### Real-time Features
- WebSocket connections for live updates
- Room-based broadcasting for wishlist-specific events
- Events: item claims/unclaims, additions/updates/deletions, wishlist metadata changes

### Privacy & Sharing
- Wishlist privacy levels: Public, Friends only, Private
- Memorable permalink generation using 2-3 word phrases
- Collaborative editing permissions system

### Gift Coordination
- Claim system prevents duplicate gifts
- Recipients cannot see claims on their own wishlists
- Real-time claim notifications for coordination

## Key Features

1. **Multi-currency support** with daily exchange rate updates
2. **URL scraping** for auto-populating product data from OpenGraph metadata
3. **Friend system** with email-based requests
4. **Soft deletion** with undo functionality via toast notifications
5. **Offline capability** using Service Workers
6. **Real-time collaboration** via WebSockets

## Development Guidelines

### Code Quality & Standards
- **Documentation First**: Always read official documentation before implementing features
- **No Guesswork**: Never implement solutions based on assumptions - read the docs
- **Fix Immediately**: Address all linting and TypeScript errors as you make changes
- **Type Safety**: Use TypeScript strict mode with proper type-only imports
- Use `import type` for type imports to avoid runtime imports

### File Naming Conventions
- **Component Files**: Name after primary export using PascalCase (e.g., `MyComponent.tsx`, not `my-component.tsx`)
- **Hook Files**: Name after primary export using camelCase (e.g., `useStuff.ts`, not `use-stuff.ts`)
- **Consistency**: File names should always match their primary export exactly

### Biome Configuration
- **Formatting**: 2 spaces, 100 character line width, double quotes, semicolons always
- **Linting**: Recommended rules enabled with custom overrides:
  - `noUnusedVariables`: error
  - `noExplicitAny`: warn
  - `noNonNullAssertion`: warn
  - `useConst`: error
- **Import Organization**: Automatic import sorting enabled

### Service Layer Architecture
- **Service-First**: Always create service layer functions before API routes
- **Separation**: API routes handle HTTP, services handle business logic
- **Pattern**: Use `ServiceResult<T>` pattern for consistent error handling
- **Structure**: Services in `lib/services/` with static methods
- **Access Control**: Use Better Auth's RBAC instead of custom permissions

### Testing Strategy
- **Test-First**: Write tests before implementing features
- **High Coverage**: Aim for 90%+ service layer, 80%+ overall
- **User-Centric**: Test behavior, not implementation details
- **Isolation**: Use separate test database with proper cleanup
- Place tests in `__tests__` directories or `.test.ts` files

### File Search & Organization
- **Never search** in `node_modules` - use `ignore_globs` parameter
- Focus on source directories: `app/`, `components/`, `lib/`, `test/`
- Use specific directory targets rather than broad searches

### README-First Workflow
- Always check README.md first when asked "what's next"
- README contains comprehensive TODO list and implementation status
- Update README TODO list when completing tasks
- README is single source of truth for project progress