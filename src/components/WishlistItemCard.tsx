"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ExternalLink, Gift, Heart, Star } from "lucide-react";
import Link from "next/link";

interface WishlistItemCardProps {
  item: {
    id: string;
    name: string;
    description?: string;
    url?: string;
    imageUrl?: string;
    price?: number | string;
    currency: string;
    priority: number;
    claims?: Array<{
      userId: string;
      createdAt: string;
    }>;
  };
  isOwner: boolean;
  onClaim?: (itemId: string, isClaimed: boolean) => void;
  isClaimPending?: boolean;
}

export function WishlistItemCard({
  item,
  isOwner,
  onClaim,
  isClaimPending = false,
}: WishlistItemCardProps) {
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3:
        return "destructive";
      case 2:
        return "default";
      case 1:
        return "secondary";
      default:
        return "outline";
    }
  };

  const isClaimed = (item.claims?.length || 0) > 0;

  return (
    <Card className="group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2">{item.name}</CardTitle>
          <div className="flex items-center gap-1">
            {item.priority > 0 && (
              <Badge variant={getPriorityColor(item.priority)} className="text-xs">
                <Star className="h-3 w-3 mr-1" />
                {item.priority}
              </Badge>
            )}
          </div>
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-32 object-cover rounded-md"
          />
        )}

        <div className="flex items-center justify-between">
          {item.price && (
            <span className="font-semibold text-lg">
              ${Number(item.price).toFixed(2)} {item.currency}
            </span>
          )}
          <div className="flex items-center gap-2">
            {item.url && (
              <Button variant="outline" size="sm" asChild>
                <Link href={item.url as any} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View
                </Link>
              </Button>
            )}
            {!isOwner && onClaim && (
              <Button
                size="sm"
                variant={isClaimed ? "outline" : "default"}
                disabled={isClaimPending}
                onClick={() => onClaim(item.id, isClaimed)}
              >
                {isClaimed ? (
                  <>
                    <Heart className="h-4 w-4 mr-1 fill-current" />
                    Unclaim
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-1" />
                    Claim
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {isClaimed && (
          <p className="text-xs text-muted-foreground">
            Claimed by {item.claims?.length || 0} person
            {(item.claims?.length || 0) > 1 ? "s" : ""}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
