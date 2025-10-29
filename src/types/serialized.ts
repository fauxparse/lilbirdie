// Serialized types for server-side data (with string dates and number prices)

export interface SerializedClaim {
  id: string;
  itemId: string;
  wishlistId: string;
  userId: string;
  sent: boolean;
  sentAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
}

export interface SerializedWishlistItem {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  imageUrl: string | null;
  blurhash: string | null;
  price: number | null;
  currency: string | null;
  priority: number;
  tags: string[];
  isDeleted: boolean;
  deletedAt: string | null;
  wishlistId: string;
  createdAt: string;
  updatedAt: string;
  claims: SerializedClaim[];
}

export interface SerializedWishlist {
  id: string;
  title: string;
  description: string | null;
  permalink: string;
  privacy: "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE";
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  ownerId: string;
  items: SerializedWishlistItem[];
  owner: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
}

export interface SerializedWishlistSummary {
  id: string;
  title: string;
  description?: string;
  permalink: string;
  privacy: "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE";
  isDefault: boolean;
  createdAt: string;
  _count: {
    items: number;
  };
  items?: Array<{
    id: string;
    name: string;
    imageUrl?: string;
    imageBlurhash?: string;
  }>;
}

export interface SerializedUser {
  id: string;
  name: string | null | undefined;
  email: string;
  image: string | null | undefined;
  profile?: {
    birthday?: string;
  };
}

export interface SerializedUserProfile {
  user: SerializedUser;
  friendshipStatus: "friends" | "none" | "pending_sent" | "pending_received";
  wishlists: SerializedWishlistSummary[];
  isOwnProfile: boolean;
}

export interface SerializedFriend {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface SerializedFriendRequest {
  id: string;
  createdAt: string;
  requester: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export interface SerializedDashboardData {
  wishlists: SerializedWishlistSummary[];
  upcomingGifts: Array<{
    friend: {
      id: string;
      name: string;
      email: string;
      image?: string;
      profile?: {
        birthday?: string;
      };
    };
    occasion: "birthday" | "christmas";
    daysUntil: number;
    date: string;
  }>;
  claimedGifts: Array<{
    id: string;
    createdAt: string;
    sent: boolean;
    item: {
      id: string;
      name: string;
      description?: string;
      price?: number;
      imageUrl?: string;
      wishlist: {
        id: string;
        title: string;
        owner: {
          id: string;
          name: string;
          email: string;
        };
      };
    };
  }>;
}

export interface SerializedFriendsData {
  friends: SerializedFriend[];
  friendRequests: SerializedFriendRequest[];
}
