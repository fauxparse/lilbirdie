# Wishlist App - Product Requirements Document

## Overview

A modern, user-friendly web application for creating, managing, and sharing wishlists. Users can create multiple wishlists for different occasions, share them with friends, and coordinate gift-giving while keeping surprises intact.

## Tech Stack

### Frontend

- **Next.js** - React framework with App Router
- **TypeScript** - Type-safe development
- **shadcn/ui** - Component library
- **Tailwind CSS v4** - Utility-first styling
- **Tanstack Form** - Form management
- **Zod** - Schema validation
- **Tanstack Query** - Data fetching and caching

### Backend

- **Next.js API Routes** - Server-side logic
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database
- **Better Auth** - Authentication system
- **WebSockets** - Real-time updates via Socket.io or native WebSocket API

### Development Tools

- **pnpm** - Package management
- **Biome** - Linting and formatting (replaces ESLint/Prettier)
- **Vitest** - Fast unit and integration testing
- **React Testing Library** - Component testing utilities
- **MSW (Mock Service Worker)** - API mocking for tests

## Core Features

### 1. User Management & Authentication

- **Google OAuth** integration via Better Auth
- User profiles with birthday and preferences
- Friend relationships (mutual)
- Dark/light mode preferences

### 2. Wishlist Management

- **Multiple wishlists per user** with one default wishlist
- **Privacy controls**:
  - Public (visible to everyone)
  - Friends only
  - Private
- **Collaborative editing** - owners can grant edit permissions
- **Short permalinks** using memorable 2-3 word phrases
- Custom permalink editing with conflict prevention

### 3. Product Management

- **Product information**:
  - Name, description, URL
  - Price with currency
  - Image (max 1MB)
  - Priority (0-3 stars)
  - Custom tags
- **URL scraping** - Auto-populate product data from OpenGraph metadata
  - Fallback to blank form with friendly message if metadata unavailable
  - No rate limiting or caching initially
- **Manual editing** - Full control over all product fields
- **Image upload** - Replace product images via Vercel Blob Storage

### 4. Gift Coordination

- **Claim system** - Mark items as purchased without notifying recipient
- **Real-time updates** - Claims and wishlist changes visible instantly via WebSockets
- **Visibility rules**:
  - Recipients don't see claims on their own wishlists
  - Other users see claims and claimer (if friends)
- **Occasion tracking** - Christmas, Valentine's Day, birthdays, etc.

### 5. Currency & Localization

- **Multi-currency support** with daily conversion updates
- **User preference** for display currency
- **Free currency API** integration (accuracy not critical)

### 6. Social Features

- **Friend system** - Email-based friend requests with accept/ignore workflow
- **Birthday notifications** - Upcoming friend birthdays
- **Occasion reminders** - Track gift-giving occasions

### 7. Public Experience

- **Attractive splash page** for non-authenticated users
- **Easy onboarding** for new users
- **Clear login/signup flow**
- **User profile pages** - Public pages for each user showing their wishlists
  - Accessible via `/profile/[userId]` or `/user/[username]` routes
  - Shows wishlists visible to current user (public + friends-only if authenticated and friends)
  - Shows only public wishlists for non-authenticated users
  - Clean, organized display of user's wishlists with item counts
  - Links to individual wishlist pages for detailed viewing

### 8. Offline Capability

- **Service Workers** for offline functionality
- **Basic offline access** to previously loaded wishlists
- **Sync when connection restored**

### 9. Real-Time Features

- **WebSocket connections** for live updates
- **Real-time claim notifications** - See when items are claimed/unclaimed
- **Live wishlist updates** - See items added/removed/edited in real-time
- **Collaborative editing** - Multiple users editing simultaneously
- **Connection management** - Graceful handling of connection drops

## Testing Strategy

### Test Coverage Requirements

- **Unit Tests** - Individual functions, utilities, and components
- **Integration Tests** - API routes, database operations, and component interactions
- **End-to-End Tests** - Complete user workflows and critical paths
- **Visual Regression Tests** - UI component consistency

### Testing Tools & Setup

- **Vitest** - Fast test runner with TypeScript support
- **React Testing Library** - Component testing with user-centric approach
- **MSW (Mock Service Worker)** - API mocking for isolated testing
- **Test Database** - Separate PostgreSQL instance for testing
- **Prisma Test Utils** - Database seeding and cleanup utilities

### Test Categories

#### 1. Component Tests
- UI component rendering and behavior
- User interactions (clicks, form submissions)
- Accessibility compliance
- Theme switching functionality
- Responsive design behavior

#### 2. API Route Tests
- Authentication and authorization
- CRUD operations for all entities
- Input validation and error handling
- Rate limiting and security measures
- WebSocket event handling

#### 3. Database Tests
- Prisma schema validation
- Data integrity constraints
- Soft deletion functionality
- Relationship management
- Migration testing

#### 4. Integration Tests
- Complete user workflows
- Authentication flows
- Wishlist sharing and collaboration
- Real-time updates via WebSockets
- Currency conversion functionality

#### 5. Utility Tests
- URL scraping functionality
- Currency conversion logic
- Permalink generation
- Form validation schemas
- Helper functions

### Test Database Strategy

- **Separate Test Database** - Isolated PostgreSQL instance
- **Automatic Cleanup** - Reset database state between tests
- **Seed Data** - Consistent test data for reliable testing
- **Transaction Rollback** - Isolate test data changes
- **Parallel Testing** - Support for concurrent test execution

### CI/CD Integration

- **GitHub Actions** - Automated test execution on PRs
- **Test Coverage Reports** - Track coverage metrics
- **Performance Testing** - Monitor test execution time
- **Database Migrations** - Validate schema changes

## Database Schema

The complete database schema is defined in `prisma/schema.prisma` and documented in `DATABASE.md`.

### Key Models

- **User** - User accounts (integrates with Better Auth)
- **Wishlist** - User wishlists with privacy controls
- **WishlistItem** - Individual items with soft deletion support
- **Friendship** - Mutual friend relationships
- **FriendRequest** - Email-based friend request workflow
- **WishlistEditor** - Collaborative editing permissions
- **Claim** - Gift claim system to prevent duplicates
- **Occasion** - Birthday and gift-giving occasion tracking
- **WebSocketConnection** - Real-time connection management
- **CurrencyRate** - Exchange rate caching
- **ScrapedUrl** - URL scraping result caching
- **AuditLog** - Action tracking for analytics

### Key Features

- **Soft Deletion** - Undo functionality for items
- **Performance Indexes** - Optimized for common queries
- **Real-time Support** - WebSocket connection tracking
- **Caching** - Currency rates and scraped URLs
- **Audit Trail** - Complete action logging
- **Data Integrity** - Proper constraints and relationships

## User Stories

### Authentication & Onboarding

1. **As a new user**, I want to sign up with Google so that I can quickly create an account
2. **As a returning user**, I want to easily log in and access my wishlists
3. **As a visitor**, I want to see an attractive landing page that explains the app's value

### Wishlist Management

4. **As a user**, I want to create multiple wishlists for different occasions
5. **As a user**, I want to set privacy levels for each wishlist
6. **As a user**, I want to share wishlists with friends via memorable permalinks
7. **As a wishlist owner**, I want to grant edit permissions to friends

### Product Management

8. **As a user**, I want to add products by pasting URLs and having the app auto-populate details
9. **As a user**, I want to manually edit all product information
10. **As a user**, I want to set priority levels and add custom tags to products
11. **As a user**, I want to upload custom images for products

### Gift Coordination

12. **As a friend**, I want to mark items as purchased without the recipient knowing
13. **As a user**, I want to see which items have been claimed by others
14. **As a user**, I want to track upcoming birthdays and gift-giving occasions

### Currency & Localization

15. **As a user**, I want to set my preferred currency and see all prices converted
16. **As a user**, I want exchange rates to be regularly updated

## Key API Endpoints

### Authentication

- `POST /api/auth/signin/google` - Google OAuth signin
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session

### Wishlists

- `GET /api/wishlists` - Get user's wishlists
- `POST /api/wishlists` - Create new wishlist
- `GET /api/wishlists/[permalink]` - Get wishlist by permalink
- `PUT /api/wishlists/[id]` - Update wishlist
- `DELETE /api/wishlists/[id]` - Delete wishlist
- `POST /api/wishlists/[id]/editors` - Add editor
- `DELETE /api/wishlists/[id]/editors/[userId]` - Remove editor

### Items

- `GET /api/wishlists/[id]/items` - Get wishlist items
- `POST /api/wishlists/[id]/items` - Add item to wishlist
- `PUT /api/items/[id]` - Update item
- `DELETE /api/items/[id]` - Delete item
- `POST /api/items/[id]/claim` - Claim item
- `DELETE /api/items/[id]/claim` - Unclaim item

### Friends

- `GET /api/friends` - Get user's friends
- `POST /api/friends` - Send friend request
- `DELETE /api/friends/[id]` - Remove friend

### Occasions

- `GET /api/occasions` - Get user's occasions
- `POST /api/occasions` - Create occasion
- `PUT /api/occasions/[id]` - Update occasion
- `DELETE /api/occasions/[id]` - Delete occasion

### WebSocket Events

- `wishlist:join` - Join wishlist room for real-time updates
- `wishlist:leave` - Leave wishlist room
- `item:claimed` - Broadcast when item is claimed
- `item:unclaimed` - Broadcast when item is unclaimed
- `item:added` - Broadcast when item is added
- `item:updated` - Broadcast when item is updated
- `item:deleted` - Broadcast when item is deleted
- `wishlist:updated` - Broadcast when wishlist metadata changes

## Design Principles

### Visual Design

- **Modern and friendly** - Clean, approachable interface
- **Bright and welcoming** - Positive, gift-giving focused aesthetic
- **Responsive** - Works seamlessly across devices
- **Accessible** - WCAG 2.1 AA compliance

### User Experience

- **Intuitive navigation** - Clear information architecture
- **Progressive disclosure** - Show relevant information at the right time
- **Feedback loops** - Clear confirmation of actions
- **Error handling** - Graceful error states and recovery

### Performance

- **Fast loading** - Optimized images and code splitting
- **Offline capability** - Service Workers for basic functionality without internet
- **Real-time updates** - WebSocket connections for live collaborative features
- **Connection resilience** - Automatic reconnection and message queuing
- **Soft deletion** - Undo functionality with toast notifications

## Deployment & Infrastructure

### Vercel Deployment

- **Platform**: Vercel for hosting and deployment
- **Database**: Vercel Postgres for primary data storage
- **Environment**: Production, Preview, and Development environments
- **Edge Functions**: Utilize Vercel Edge Runtime for optimal performance
- **Analytics**: Vercel Analytics for performance monitoring

### Infrastructure Considerations

- **Image Storage**: Vercel Blob Storage for user-uploaded images (1MB max)
- **CDN**: Automatic global CDN via Vercel Edge Network
- **Environment Variables**: Secure configuration management
- **Database Migrations**: Automated via Vercel deployment hooks
- **Service Workers**: Built into deployment for offline functionality

## Future Considerations

### Potential Enhancements

- **Mobile app** - Native iOS/Android applications
- **Email notifications** - Birthday reminders, new items added
- **Gift suggestions** - AI-powered recommendations
- **Integration APIs** - Connect with e-commerce platforms
- **Group wishlists** - Collaborative family wishlists
- **Gift tracking** - Track delivery and thank you notes

### Technical Debt

- **Performance optimization** - Database query optimization
- **Caching strategy** - Redis for frequently accessed data
- **Monitoring** - Application performance monitoring

## Implementation Decisions

### URL Scraping

- No rate limiting or caching initially
- Fallback to blank form with friendly message if OpenGraph data unavailable

### Database & Storage

- **Database**: Vercel Postgres
- **Image Storage**: Vercel Blob Storage (1MB max per image)

### Currency Conversion

- Free currency API provider (accuracy not critical)
- Daily rate updates

### Permalink Generation

- Use `unique-names-generator` library
- Allow users to edit permalinks or refresh for new suggestions

### Friend System

- Email-based friend requests
- Pending requests with accept/ignore workflow
- Notifications for new friend requests

### Data Management

- Soft deletion with undo functionality
- Toast notifications with undo buttons for destructive actions

### Offline Support

- Service Workers for offline functionality
- Basic offline access to previously loaded data
- Sync when connection restored

### Real-Time Updates

- WebSocket implementation for live updates
- Room-based broadcasting for wishlist-specific events
- Automatic reconnection with message queuing
- Real-time claim notifications and collaborative editing

---

_This PRD serves as a living document and should be updated as requirements evolve and new features are identified._
