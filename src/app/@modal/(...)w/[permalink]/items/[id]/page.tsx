"use client";

import { useQuery } from "@tanstack/react-query";
import React from "react";
import { ModalDescription, ModalTitle } from "@/components/ui/Modal";
import { RouteModal } from "@/components/ui/RouteModal";
import type { WishlistItemResponse } from "@/types";
import { ItemDetails } from "@/views/Wishlists/ItemDetails";

interface ItemDetailsModalProps {
  params: Promise<{
    permalink: string;
    id: string;
  }>;
}

export default function ItemDetailsModal({ params }: ItemDetailsModalProps) {
  const unwrappedParams = React.use(params);
  const { permalink, id } = unwrappedParams;

  const {
    data: item,
    isLoading,
    error,
  } = useQuery<WishlistItemResponse>({
    queryKey: ["item", id],
    queryFn: async () => {
      const response = await fetch(`/api/items/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch item");
      }
      return response.json();
    },
  });

  if (error) {
    return (
      <RouteModal
        title={<ModalTitle>Error</ModalTitle>}
        description={<ModalDescription>Failed to load item details</ModalDescription>}
        size="2xl"
      >
        <div className="p-6 text-center text-destructive">
          {error instanceof Error ? error.message : "An error occurred"}
        </div>
      </RouteModal>
    );
  }

  if (isLoading || !item) {
    return (
      <RouteModal size="2xl">
        <div className="p-6 space-y-4 animate-pulse">
          <div className="w-full aspect-video bg-muted rounded-lg" />
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-10 bg-muted rounded w-32" />
        </div>
      </RouteModal>
    );
  }

  return (
    <RouteModal size="2xl" title={<ModalTitle>{item.name}</ModalTitle>}>
      <ItemDetails item={item} permalink={permalink} />
    </RouteModal>
  );
}
