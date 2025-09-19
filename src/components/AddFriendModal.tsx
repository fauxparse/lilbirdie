"use client";

import { Search, UserPlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/Modal";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useSendFriendRequest, useUserSearch } from "@/hooks/useFriends";

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddFriendModal({ isOpen, onClose }: AddFriendModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // React Query hooks
  const userSearchQuery = useUserSearch(debouncedQuery);
  const sendFriendRequestMutation = useSendFriendRequest();

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Clear search when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setDebouncedQuery("");
    }
  }, [isOpen]);

  const searchResults = userSearchQuery.data || [];

  const sendFriendRequest = (userId: string) => {
    sendFriendRequestMutation.mutate(userId, {
      onSuccess: () => {
        // Invalidate search query to refresh friendship status
        userSearchQuery.refetch();
      },
    });
  };

  const clearSearch = () => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader>
        <ModalTitle>Add Friend</ModalTitle>
      </ModalHeader>
      <ModalContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search by name or email..."
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <Button
                size="icon-small"
                variant="ghost"
                className="absolute right-1 top-1"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {searchResults.length === 0 &&
            debouncedQuery.trim().length >= 2 &&
            !userSearchQuery.isLoading && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No users found. Try a different search term.
              </p>
            )}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((user) => {
                const isSending = sendFriendRequestMutation.isPending;
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} size="default" />
                      <div>
                        <p className="font-medium">{user.name || "Anonymous User"}</p>
                      </div>
                    </div>
                    {user.friendshipStatus === "none" && (
                      <Button
                        size="small"
                        onClick={() => sendFriendRequest(user.id)}
                        disabled={isSending}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        {isSending ? "Sending..." : "Add"}
                      </Button>
                    )}
                    {user.friendshipStatus === "pending_sent" && (
                      <Button size="small" variant="outline" disabled>
                        Request Sent
                      </Button>
                    )}
                    {user.friendshipStatus === "friends" && (
                      <Button size="small" variant="outline" disabled>
                        Friends
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
