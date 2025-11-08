import React, { PropsWithChildren } from "react";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { WishlistCard } from "@/components/WishlistCard";
import { SerializedWishlistSummary } from "@/types/serialized";

type WishlistsProps = {
  lists: SerializedWishlistSummary[];
};

export const Wishlists: React.FC<PropsWithChildren<WishlistsProps>> = ({ lists, children }) => {
  return (
    <ResponsiveGrid>
      {lists.map((list) => (
        <WishlistCard key={list.id} wishlist={list} />
      ))}
      {children}
    </ResponsiveGrid>
  );
};
