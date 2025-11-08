"use client";

import { UserRoundPlus } from "lucide-react";
import { useState } from "react";
import { ProfileCard } from "@/components/ui/ProfileCard";
import {
  useCancelFriendRequest,
  useFriendRequests,
  useHandleFriendRequest,
} from "@/hooks/useFriends";
import { FriendRequestCard } from "./FriendRequestCard";

interface FriendRequest {
  id: string;
  createdAt: string;
  type: "incoming" | "outgoing";
  requester?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  email?: string;
}

interface FriendRequestsProps {
  initialData: FriendRequest[];
  onAddFriend: () => void;
}

export function FriendRequests({ initialData, onAddFriend }: FriendRequestsProps) {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // React Query hooks - use server data as initial data
  const { data: friendRequests = initialData } = useFriendRequests(initialData);
  const handleFriendRequestMutation = useHandleFriendRequest();
  const cancelFriendRequestMutation = useCancelFriendRequest();

  const handleRequest = (requestId: string, action: "accept" | "ignore") => {
    setProcessingIds((prev) => new Set(prev).add(requestId));

    handleFriendRequestMutation.mutate(
      { requestId, action },
      {
        onSettled: () => {
          setProcessingIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(requestId);
            return newSet;
          });
        },
      }
    );
  };

  const handleCancel = (requestId: string) => {
    setProcessingIds((prev) => new Set(prev).add(requestId));

    cancelFriendRequestMutation.mutate(requestId, {
      onSettled: () => {
        setProcessingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(requestId);
          return newSet;
        });
      },
    });
  };

  const incomingRequests = friendRequests.filter((r) => r.type === "incoming");
  const outgoingRequests = friendRequests.filter((r) => r.type === "outgoing");

  return (
    <>
      <ProfileCard
        as="button"
        type="button"
        onClick={onAddFriend}
        avatar={
          <div className="flex items-center justify-center rounded-full squircle w-auto h-full aspect-square self-stretch border-2 border-dashed border-border">
            <UserRoundPlus className="size-10 text-muted-foreground" />
          </div>
        }
        primaryText={<div className="text-base font-medium">Add a friend</div>}
      />

      {incomingRequests.map((request) => (
        <FriendRequestCard
          key={request.id}
          friendRequest={request}
          isProcessing={processingIds.has(request.id)}
          onAccept={() => handleRequest(request.id, "accept")}
          onIgnore={() => handleRequest(request.id, "ignore")}
        />
      ))}

      {outgoingRequests.map((request) => (
        <FriendRequestCard
          key={request.id}
          friendRequest={request}
          isProcessing={processingIds.has(request.id)}
          onCancel={() => handleCancel(request.id)}
        />
      ))}
    </>
  );
}
