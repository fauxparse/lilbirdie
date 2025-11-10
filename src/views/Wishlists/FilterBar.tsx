import { PropsWithChildren } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { useWishlist } from "@/contexts/WishlistContext";

export const FilterBar: React.FC<PropsWithChildren> = ({ children }) => {
  const { sortBy, setSortBy, isOwner, hideClaimedItems, setHideClaimedItems } = useWishlist();

  return (
    <div className="flex gap-3 items-center justify-center py-3 bg-secondary rounded-md my-6">
      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger id="sort-select" size="small" className="w-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="priority">Priority (High to Low)</SelectItem>
          <SelectItem value="price">Price (Low to High)</SelectItem>
          <SelectItem value="date">Date Added (Newest First)</SelectItem>
          <SelectItem value="name">Name (A to Z)</SelectItem>
        </SelectContent>
      </Select>
      {!isOwner && (
        <div className="flex items-center justify-between gap-3">
          <Switch
            id="hide-claimed"
            checked={hideClaimedItems}
            onCheckedChange={setHideClaimedItems}
          />
          <span className="text-sm">Hide claimed items</span>
        </div>
      )}
      {children}
    </div>
  );
};
