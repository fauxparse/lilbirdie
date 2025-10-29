"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/wishlists");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="container mx-auto px-4 py-8 container-type-inline-size">
      <div className="text-center space-y-6 mb-12">
        <h1 className="text-4xl font-bold text-primary">🐦 Welcome to Lil Birdie</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Share your wishes and coordinate gifts with friends. Create wishlists, claim gifts, and
          keep surprises intact.
        </p>
        <div className="space-x-4">
          <Link href="/login">
            <Button size="large">Get Started</Button>
          </Link>
          <Button variant="outline" size="large">
            Learn More
          </Button>
        </div>
      </div>

      <div className="grid cq-md:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
    </div>
  );
}
