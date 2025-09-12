"use client";

import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Link from "next/link";

export default function HomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h1>
          <p className="text-muted-foreground">Ready to manage your wishlists?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>My Wishlists</CardTitle>
              <CardDescription>Create and manage your wishlists</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                You don't have any wishlists yet. Create your first one to get started!
              </p>
              <Button>Create My First Wishlist</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Friends' Wishlists</CardTitle>
              <CardDescription>Browse and claim gifts from friends</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Connect with friends to see their wishlists and coordinate gifts.
              </p>
              <Button variant="outline">Find Friends</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center space-y-6 mb-12">
        <h1 className="text-4xl font-bold text-primary">🐦 Welcome to Lil Birdie</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Share your wishes and coordinate gifts with friends. Create wishlists, claim gifts, and
          keep surprises intact.
        </p>
        <div className="space-x-4">
          <Link href="/login">
            <Button size="lg">Get Started</Button>
          </Link>
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create Wishlists</CardTitle>
            <CardDescription>Build beautiful wishlists for any occasion</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create multiple wishlists with privacy controls. Share them with friends using
              memorable links.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coordinate Gifts</CardTitle>
            <CardDescription>Claim items without spoiling surprises</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Mark items as claimed so friends don't buy duplicates, while keeping recipients in the
              dark.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Real-time Updates</CardTitle>
            <CardDescription>Stay in sync with live collaboration</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              See changes instantly as friends add items or make claims in real-time.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
