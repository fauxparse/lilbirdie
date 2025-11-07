# Route Modal Implementation Guide

This guide explains how to use the `RouteModal` component to create routed modals using Next.js parallel and intercepting routes.

## Overview

The `RouteModal` component solves a critical problem with Next.js routes: routes unmount immediately when you navigate away, preventing exit animations from playing. This component delays the unmount until after the animation completes, giving you smooth transitions.

## How It Works

1. **Parallel Routes**: We use a `@modal` slot in the layout to render modals alongside regular page content
2. **Intercepting Routes**: We use the `(.)` syntax to intercept routes when navigating from within the app
3. **Direct Access**: The original route still works when accessed directly via URL
4. **Smooth Animations**: The RouteModal component handles exit animations before unmounting

## File Structure

```
app/
  layout.tsx           # Root layout with @modal slot
  @modal/
    default.tsx        # Returns null (no modal by default)
    (...)your-feature/
      new/
        page.tsx       # Modal version (intercepted route)
  your-feature/
    page.tsx           # Your main page
    new/
      page.tsx         # Full page version (accessed directly)
```

**Note:** The `@modal` slot is at the root level, not within each feature. This allows intercepting routes from anywhere in the app.

## Implementation Steps

### 1. Update Root Layout with Modal Slot (One-time setup)

The root `app/layout.tsx` should include the `modal` slot:

```tsx
export default async function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html>
      <body>
        {/* Your providers */}
        {children}
        {modal}  {/* Add this line */}
        {/* Other components */}
      </body>
    </html>
  );
}
```

### 2. Create the Default Modal (One-time setup)

Create `app/@modal/default.tsx`:

```tsx
export default function Default() {
  return null;
}
```

### 3. Keep Your Full Page Route

Your existing `your-feature/new/page.tsx` stays as-is. This will be shown when someone accesses the URL directly.

### 4. Create the Intercepting Route

Create `app/@modal/(...)your-feature/new/page.tsx`:

**Note:** Use `(...)` to intercept from the root, allowing the modal to work from any page in your app.

```tsx
"use client";

import { useRouter } from "next/navigation";
import { RouteModal } from "@/components/ui/RouteModal";
import { ModalTitle, ModalDescription } from "@/components/ui/Modal";

export default function YourFeatureModal() {
  const router = useRouter();

  const handleClose = () => {
    // RouteModal will handle the animation and navigation
    // You can also navigate to a specific route if needed
    router.back();
  };

  return (
    <RouteModal
      title={<ModalTitle>Your Title</ModalTitle>}
      description={<ModalDescription>Your description</ModalDescription>}
      size="xl" // small | md | large | xl | 2xl | full
      closeOnEscape={true}
      closeOnOverlayClick={true}
    >
      {/* Your modal content goes here */}
      <YourFormOrContent onCancel={handleClose} />
    </RouteModal>
  );
}
```

## RouteModal Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | required | The content to display in the modal |
| `title` | `ReactNode` | optional | Modal title (usually wrapped in ModalTitle) |
| `description` | `ReactNode` | optional | Modal description (usually wrapped in ModalDescription) |
| `size` | `"small" \| "md" \| "large" \| "xl" \| "2xl" \| "full"` | `"xl"` | Modal size |
| `closeOnEscape` | `boolean` | `true` | Whether pressing Escape closes the modal |
| `closeOnOverlayClick` | `boolean` | `true` | Whether clicking outside closes the modal |

## Animation Timing

The RouteModal uses these animation timings:
- **Enter**: 10ms delay before showing (ensures DOM is ready)
- **Exit**: 220ms delay before navigation (matches Modal exit animation)

These timings are synchronized with the Modal component's animation variants to ensure smooth transitions.

## Navigation Behavior

### From Within the App
When you use `router.push('/your-feature/new')` or a Link component:
- The intercepting route `@modal/(.)new/page.tsx` catches it
- Shows as a modal over the current page
- Smooth animations on open and close
- `router.back()` returns to the previous page

### Direct URL Access
When someone visits `/your-feature/new` directly:
- By default, the original `new/page.tsx` is shown as a full page (not the modal)
- To always show the modal even on direct access, use the redirect pattern (see below)

## Example: Wishlist Creation Modal

Here's the complete implementation for the wishlist creation modal:

### Structure
```
app/
  layout.tsx              # Root layout with @modal slot
  @modal/
    default.tsx           # Default (empty) modal state
    (...)wishlists/
      new/
        page.tsx          # Modal version (intercepted)
  wishlists/
    page.tsx              # Wishlists list page
    new/
      page.tsx            # Full page (direct access)
```

### The Intercepting Route
```tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { WishlistForm, type WishlistFormData } from "@/components/WishlistForm";
import { ModalDescription, ModalTitle } from "@/components/ui/Modal";
import { RouteModal } from "@/components/ui/RouteModal";

export default function NewWishlistModal() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createWishlistMutation = useMutation({
    mutationFn: async (data: WishlistFormData) => {
      // ... your mutation logic
    },
    onSuccess: (wishlist) => {
      queryClient.invalidateQueries({ queryKey: ["wishlists"] });
      router.push(`/w/${wishlist.permalink}`);
    },
  });

  return (
    <RouteModal
      title={<ModalTitle>Create New Wishlist</ModalTitle>}
      description={
        <ModalDescription>
          Start collecting your favorite items in a new wishlist
        </ModalDescription>
      }
    >
      <WishlistForm
        mode="create"
        onSubmit={(data) => createWishlistMutation.mutate(data)}
        isSubmitting={createWishlistMutation.isPending}
        error={createWishlistMutation.error?.message || null}
        onCancel={() => router.back()}
      />
    </RouteModal>
  );
}
```

## Always Show Modal (Even on Direct URL Access)

If you want the modal to **always** appear, even when someone directly visits the URL, use this query parameter pattern:

**Step 1: Update the action route (your-feature/new/page.tsx):**
```tsx
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server/auth";

/**
 * This page redirects to /your-feature with a query parameter.
 * The your-feature page will detect the parameter and open the modal.
 * This ensures the base page loads first, then the modal opens on top.
 */
export default async function NewFeaturePage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Redirect to base page with query param to trigger modal
  redirect("/your-feature?openModal=new");
}
```

**Step 2: Update the base page client component (YourFeatureClient.tsx):**
```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export function YourFeatureClient({ initialData }: YourFeatureClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasOpenedModalRef = useRef(false);

  // Check if we should open a modal based on query param (only once)
  useEffect(() => {
    const openModal = searchParams.get("openModal");
    if (openModal === "new" && !hasOpenedModalRef.current) {
      hasOpenedModalRef.current = true;
      // First, clear the query param from the URL
      // Use window.history.replaceState for immediate, synchronous effect
      window.history.replaceState({}, "", "/your-feature");
      // Then navigate to the modal route
      setTimeout(() => {
        router.push("/your-feature/new");
      }, 10);
    }
  }, [searchParams, router]);

  // ... rest of your component
}
```

**Step 3: The modal can use router.back() since we cleaned the history:**
```tsx
export default function NewFeatureModal() {
  const router = useRouter();

  const handleCancel = () => {
    // Since we used router.replace() to clean the URL before opening the modal,
    // router.back() now works correctly
    router.back();
  };

  return (
    <RouteModal>
      <YourForm onCancel={handleCancel} />
    </RouteModal>
  );
}
```

**How it works:**
1. User visits `/your-feature/new` directly or refreshes the page
2. Server checks authentication
3. If not authenticated, server redirects to `/login`
4. If authenticated, server redirects to `/your-feature?openModal=new`
5. Base page loads with all its data and renders
6. Client component detects the `openModal=new` query param (useRef ensures this only happens once)
7. Client uses `window.history.replaceState()` to immediately clean the URL (removes query param synchronously)
8. Client navigates to `/your-feature/new`, triggering the intercepting route
9. Modal shows over the loaded page
10. When modal closes with `router.back()`, it returns to the clean `/your-feature` URL

**Important Notes:**
- The `useRef` guard prevents the modal from reopening if the user navigates back in history
- Using `window.history.replaceState()` instead of `router.replace()` ensures the URL is immediately and synchronously updated
- This removes the query param from history so `router.back()` works correctly
- The history stack ends up as: `[...previous pages, /your-feature, /your-feature/new]` with no query params

**Benefits:**
- ✅ Modal always shows, regardless of how the user accessed the URL
- ✅ Base page fully loads before modal opens (no empty background)
- ✅ Server-side auth check prevents race conditions on page refresh
- ✅ Back button works correctly (goes to `/your-feature` without reopening modal)
- ✅ Clean URL (query param is removed from history)
- ✅ Simple and maintainable with standard `router.back()` behavior
- ✅ No infinite modal loops or history issues

## Common Patterns

### Success Navigation
After a successful action, navigate to the new resource:
```tsx
onSuccess: (data) => {
  queryClient.invalidateQueries({ queryKey: ["items"] });
  router.push(`/items/${data.id}`); // Navigate to new item
}
```

### Cancel Action
Simply go back:
```tsx
onCancel={() => router.back()}
```

### Loading State
Show a loading indicator while fetching initial data:
```tsx
if (isLoading) {
  return (
    <RouteModal title={<ModalTitle>Loading...</ModalTitle>}>
      <div className="py-8 text-center">
        <LoadingSpinner />
      </div>
    </RouteModal>
  );
}
```

## Benefits

1. **Clean URLs**: Full routes mean shareable, bookmarkable URLs
2. **Better UX**: Modals for quick actions, full pages for direct access
3. **Smooth Animations**: Proper exit animations unlike raw route changes
4. **Reusable**: One component handles all routed modal needs
5. **Type Safe**: Full TypeScript support
6. **Accessible**: Built on Radix UI primitives

## Troubleshooting

### Modal doesn't animate
- Ensure you're using `RouteModal` not just `Modal`
- Check that the animation timings in RouteModal match your Modal component

### Route doesn't intercept
- Verify the `(...)` syntax in your folder name (for root-level interception)
- Ensure the root layout has the `@modal` slot
- Check that `app/@modal/default.tsx` exists and returns null
- Make sure the folder structure matches: `app/@modal/(...)your-feature/action/page.tsx`

### Navigation issues
- Use `router.back()` for cancel actions
- Use `router.push()` for success navigation
- Don't mix `Link` and `router.push` unnecessarily

## Next Steps

Use this pattern for any feature that needs routed modals:
- Edit forms
- Delete confirmations
- Multi-step wizards
- Preview overlays
- Quick actions

The pattern is fully reusable and maintainable!

