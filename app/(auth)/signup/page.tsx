"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/loading-spinner";
import { setAppSession } from "@/lib/app-tab-session";
import {
  isValidUsername,
  normalizeUsername,
  usernameToEmail,
} from "@/lib/auth-credentials";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup() {
    setError("");

    if (!username || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (!isValidUsername(username)) {
      setError("Username must be 3–32 characters (letters, numbers, underscore)");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const normalized = normalizeUsername(username);
      const { data: signUpData, error: authError } = await supabase.auth.signUp({
        email: usernameToEmail(normalized),
        password,
        options: {
          data: { username: normalized },
        },
      });

      if (authError) {
        setError(
          authError.message.toLowerCase().includes("already")
            ? "Username is already taken"
            : authError.message,
        );
        return;
      }

      if (!signUpData.session) {
        setError(
          "Account created. Check your email to confirm, then sign in.",
        );
        return;
      }

      const syncRes = await fetch("/api/users/sync", { method: "POST" });
      if (!syncRes.ok) {
        const body = (await syncRes.json()) as { error?: string };
        setError(body.error ?? "Account created but profile sync failed");
        return;
      }

      setAppSession();

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Studimate
            </span>
          </Link>
          <p className="text-muted-foreground mt-2">
            Create your account and start studying smarter.
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-lg shadow-black/30">
          <div className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-input border-border focus:ring-2 focus:ring-primary"
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input border-border focus:ring-2 focus:ring-primary pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-input border-border focus:ring-2 focus:ring-primary"
                autoComplete="new-password"
              />
            </div>

            <Button
              onClick={() => void handleSignup()}
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg h-11 transition-all duration-200"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" className="text-white" />
              ) : (
                "Create Account"
              )}
            </Button>
            {isLoading ? (
              <p className="text-center text-sm text-muted-foreground">
                Creating account…
              </p>
            ) : null}
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link
              href="/login"
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
