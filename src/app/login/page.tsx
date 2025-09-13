"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Separator } from "@/components/ui/Separator";
import { signIn, signUp } from "@/lib/auth-client";
import { useState } from "react";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (error) {
      console.error("Google sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSignUp && password !== confirmPassword) {
      alert("Passwords don't match");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Attempting auth with:", { email, isSignUp, name: isSignUp ? name : undefined });

      let result;
      if (isSignUp) {
        result = await signUp.email({
          email,
          password,
          name,
          callbackURL: "/",
        });
      } else {
        result = await signIn.email({
          email,
          password,
          callbackURL: "/",
        });
      }

      console.log("Auth result:", result);

      // Check if the result contains an error
      if (result.error) {
        console.error("Auth error in result:", result.error);
        let errorMessage = isSignUp ? "Sign up failed" : "Sign in failed";
        if (result.error.message) {
          errorMessage += `: ${result.error.message}`;
        } else if (result.error.status) {
          errorMessage += `: ${result.error.status} ${result.error.statusText || ""}`;
        }
        alert(errorMessage);
        return;
      }

      // If we get here, it succeeded
      alert(isSignUp ? "Sign up successful!" : "Sign in successful!");
    } catch (error) {
      console.error("Email auth error:", error);
      // Try to extract the actual error message
      let errorMessage = isSignUp ? "Sign up failed" : "Sign in failed";
      if (error && typeof error === "object" && "message" in error) {
        errorMessage += `: ${error.message}`;
      }
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Lil Birdie</CardTitle>
          <CardDescription>
            {isSignUp
              ? "Create an account to get started"
              : "Sign in to create and share your wishlists"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="relative">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-background px-2 text-xs text-muted-foreground">OR</span>
            </div>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            variant="outline"
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            Continue with Google
          </Button>

          <div className="text-center">
            <Button variant="ghost" onClick={() => setIsSignUp(!isSignUp)} disabled={isLoading}>
              {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            By {isSignUp ? "creating an account" : "signing in"}, you agree to our terms of service
            and privacy policy.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
