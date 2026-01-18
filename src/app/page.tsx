"use client";

import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";


function LoginForm() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const error = searchParams.get("error");

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (err) {
      console.error("Login failed", err);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 text-center">
      {/* Logo/Brand */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          FamOps
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          The calm operating system for your family.
        </p>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {error && (
          <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 rounded-md dark:bg-red-900/20 dark:text-red-400">
            {error === "AccessDenied" ? "Unable to sign in. Please try again." : "Authentication failed"}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-slate-900 px-8 py-3 font-medium text-white shadow-lg transition-all hover:bg-slate-800 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="relative flex items-center gap-2">
              Continue with Google
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          )}
        </button>

        <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
          Private & secure. Invite-only access.
        </p>
      </motion.div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <Suspense fallback={<div className="text-slate-500">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
