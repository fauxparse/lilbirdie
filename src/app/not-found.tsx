import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="space-y-4">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't
          exist.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/wishlists">View Wishlists</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
