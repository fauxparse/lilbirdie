"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Separator } from "@/components/ui/Separator";
import { signIn, signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/",
      });
      // If successful, Better Auth should handle the redirect
    } catch (error) {
      console.error("Google sign in error:", error);
      setErrorMessage("Google sign in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (isSignUp && password !== confirmPassword) {
      setErrorMessage("Passwords don't match");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Attempting auth with:", { email, isSignUp, name: isSignUp ? name : undefined });

      let result:
        | Awaited<ReturnType<typeof signUp.email>>
        | Awaited<ReturnType<typeof signIn.email>>;
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
        let error = isSignUp ? "Sign up failed" : "Sign in failed";
        if (result.error.message) {
          error += `: ${result.error.message}`;
        } else if (result.error.status) {
          error += `: ${result.error.status} ${result.error.statusText || ""}`;
        }
        setErrorMessage(error);
        return;
      }

      // If we get here, it succeeded - redirect to home
      router.push("/");
    } catch (error) {
      console.error("Email auth error:", error);
      // Try to extract the actual error message
      let errorMsg = isSignUp ? "Sign up failed" : "Sign in failed";
      if (error && typeof error === "object" && "message" in error) {
        errorMsg += `: ${error.message}`;
      }
      setErrorMessage(errorMsg);
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
          {errorMessage && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {errorMessage}
            </div>
          )}
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
