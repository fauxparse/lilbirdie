"use client";
import { PriceDisplay } from "@/components/PriceDisplay";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useCurrencyConversion } from "@/hooks/useCurrencyConversion";
import { useUserPreferredCurrency } from "@/hooks/useUserPreferredCurrency";
import { Edit, ExternalLink, Gift, Heart, Star, Trash } from "lucide-react";
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
  onEdit?: (item: any) => void;
  onDelete?: (itemId: string) => void;
  isClaimPending?: boolean;
}

export function WishlistItemCard({
  item,
  isOwner,
  onClaim,
  onEdit,
  onDelete,
  isClaimPending = false,
}: WishlistItemCardProps) {
  const { preferredCurrency, isLoading: isCurrencyLoading } = useUserPreferredCurrency();
  const { convertedPrice, convertedCurrency } = useCurrencyConversion(
    Number(item.price) || 0,
    item.currency,
    preferredCurrency
  );

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
            {Array.from({ length: item.priority || 0 }).map((_, i) => (
              <Star key={i} className="h-3 w-3 mr-1" />
            ))}
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
          {item.price && !isCurrencyLoading && (
            <PriceDisplay
              originalPrice={Number(item.price)}
              originalCurrency={item.currency}
              convertedPrice={convertedPrice || undefined}
              convertedCurrency={convertedCurrency || undefined}
              className="font-semibold text-lg"
            />
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
            {isOwner ? (
              <>
                {onEdit && (
                  <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button size="sm" variant="outline" onClick={() => onDelete(item.id)}>
                    <Trash className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
              </>
            ) : (
              onClaim && (
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
              )
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
