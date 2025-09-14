# Lil Birdie - Wishlist App

A modern wishlist web application built with Next.js, TypeScript, and PostgreSQL. Users can create and share wishlists, coordinate gift-giving while preserving surprises, and collaborate in real-time.

## Tech Stack

- **Frontend**: Next.js with App Router, TypeScript, shadcn/ui, Tailwind CSS v4
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL, Better Auth
- **Tools**: pnpm (package manager), Biome (linting/formatting), Vitest (testing)

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. Set up the database:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

4. Run the development server:
   ```bash
   pnpm dev
   ```

## Development Commands

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `npx biome check --write` - Run linting with auto-fix
- `tsc --noEmit` - Run TypeScript type checking
- `pnpm test` - Run tests with Vitest

## Implementation Status

### ✅ Completed
- [x] Project setup and dependencies
- [x] Tailwind CSS v4 configuration
- [x] Basic UI components (shadcn/ui)
- [x] Database schema design (Prisma)
- [x] Landing page with basic styling
- [x] Better Auth configuration with Google OAuth
- [x] Authentication API routes
- [x] Database connection setup
- [x] Login/signup pages
- [x] Authentication context and user session management
- [x] User authentication flow
- [x] Wishlist CRUD operations (create, read, update, delete)
- [x] Shared form component for wishlist create/edit
- [x] User profiles with theme preferences
- [x] Dashboard with user overview
- [x] Privacy controls (Public, Friends Only, Private)
- [x] Occasion tracking system with recurrence
- [x] Service layer architecture with comprehensive testing
- [x] Friend system API routes
- [x] Gift claiming system API routes
- [x] Database migrations and seeding
- [x] Environment configuration
- [x] Error handling patterns
- [x] Test coverage (63 tests, 90%+ service layer coverage)

### ✅ Completed (continued)
- [x] Wishlist item management UI (add/edit/delete items within wishlists)
- [x] WishlistItemService for item CRUD operations
- [x] Item form component with full field support
- [x] Item management integration into wishlist pages
- [x] URL scraping for product data with auto-populate functionality
- [x] URL scraping API endpoint with OpenGraph metadata extraction
- [x] Auto-fetch on URL paste with loading states and error handling

### 📋 TODO - Core Features
- [ ] Friend system frontend (requests, management)
- [ ] Gift claiming frontend UI
- [ ] Real-time updates (WebSockets)
- [ ] Multi-currency support
- [ ] Image upload functionality
- [ ] Collaborative editing
- [ ] Soft deletion with undo

### 📋 TODO - Advanced Features
- [ ] Email notifications
- [ ] Offline functionality (Service Workers)
- [ ] Mobile responsiveness improvements
- [ ] Performance optimization
- [ ] Deployment setup

### 🔧 TODO - Infrastructure
- [ ] Logging system
- [ ] Security measures audit
- [ ] API documentation

## Architecture

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
│   └── ui/             # shadcn/ui components
├── lib/                # Utilities and configurations
│   ├── auth/           # Better Auth setup
│   ├── db/             # Database connection
│   └── utils/          # Helper functions
└── types/              # TypeScript type definitions
```

## Key Features

1. **Multi-currency support** with daily exchange rate updates
2. **URL scraping** for auto-populating product data
3. **Friend system** with email-based requests
4. **Real-time collaboration** via WebSockets
5. **Gift coordination** to prevent duplicate gifts
6. **Soft deletion** with undo functionality
7. **Offline capability** using Service Workers

## Contributing

1. Create a feature branch
2. Run linting: `npx biome check --write`
3. Run type checking: `tsc --noEmit`
4. Run tests: `pnpm test`
5. Submit a pull request

---

For detailed requirements and specifications, see [PRD.md](PRD.md).