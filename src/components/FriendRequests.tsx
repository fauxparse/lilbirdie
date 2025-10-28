"use client";

import { formatDistanceToNow } from "date-fns";
import { Clock, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useFriendRequests, useHandleFriendRequest } from "@/hooks/useFriends";

interface FriendRequestsProps {
  initialData?: Array<{
    id: string;
    createdAt: string;
    requester: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
  }>;
}

export function FriendRequests({ initialData }: FriendRequestsProps) {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // React Query hooks
  const { data: friendRequests, isLoading: loading } = useFriendRequests(initialData);
  const handleFriendRequestMutation = useHandleFriendRequest();

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

  if (loading || !friendRequests) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Friend Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading friend requests...</p>
        </CardContent>
      </Card>
    );
  }

  if (friendRequests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Friend Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No pending friend requests</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Friend Requests
          {friendRequests.length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
              {friendRequests.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {friendRequests.map((request) => {
          const isProcessing = processingIds.has(request.id);
          return (
            <div
              key={request.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <UserAvatar user={request.requester} size="default" />
                <div>
                  <p className="font-medium">{request.requester.name || request.requester.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="small"
                  variant="default"
                  onClick={() => handleRequest(request.id, "accept")}
                  disabled={isProcessing}
                >
                  <UserCheck className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="small"
                  variant="outline"
                  onClick={() => handleRequest(request.id, "ignore")}
                  disabled={isProcessing}
                >
                  <UserX className="h-4 w-4 mr-1" />
                  Ignore
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
