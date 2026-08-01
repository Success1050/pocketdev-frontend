"use client";

import { motion } from "framer-motion";
import { RefreshCw, AlertCircle, ShieldAlert, Zap, ExternalLink, Activity, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/axios";

export default function SettingsPage() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [usageData, setUsageData] = useState<any>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await api.get("/tasks/usage");
        setUsageData(res.data);
      } catch (err) {
        console.warn("Failed to fetch usage statistics", err);
      } finally {
        setIsLoadingUsage(false);
      }
    };
    fetchUsage();
  }, []);

  useEffect(() => {
    if (searchParams.get("auth_success") === "true") {
      toast.success("Successfully updated GitHub permissions!");
      // Clean up URL
      router.replace("/settings");
    }
  }, [searchParams, router]);

  const handleReauthorize = () => {
    setIsAuthenticating(true);
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    window.location.href = `${backendUrl}/auth/github/login?platform=web_settings&prompt=consent`;
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-x-hidden pb-32">
      {/* Background Decor */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0F0F14_1px,transparent_1px),linear-gradient(to_bottom,#0F0F14_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="relative z-10 px-6 pt-12 md:px-12 md:pt-16 lg:px-16 max-w-4xl mx-auto w-full">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Settings
          </h1>
          <p className="mt-2 text-sm text-muted">
            Manage your account and integration preferences.
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-6"
        >
          {/* Subscription & Usage Section */}
          <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[rgba(138,43,226,0.1)] border border-purple-500/30">
                  <Zap className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-foreground">Plan & Consumption</h2>
                    <span className="rounded-full bg-purple-500/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-purple-300 border border-purple-500/30">
                      {usageData?.tier || "FREE"} TIER
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted max-w-xl">
                    Track your monthly AI task quotas and token usage. Upgrade your plan to unlock premium models and unlimited generations.
                  </p>
                </div>
              </div>
            </div>

            {/* Quota Progress Bars */}
            {!isLoadingUsage && usageData && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-background/50 border border-border p-4">
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-muted flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-accent" /> Tasks Executed
                    </span>
                    <span className="text-foreground">
                      {usageData.usage?.tasksUsed || 0} / {usageData.limits?.tasksPerMonth === -1 ? 'Unlimited' : usageData.limits?.tasksPerMonth}
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-500 rounded-full"
                      style={{
                        width: `${usageData.limits?.tasksPerMonth === -1 ? 100 : Math.min(100, ((usageData.usage?.tasksUsed || 0) / (usageData.limits?.tasksPerMonth || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-background/50 border border-border p-4">
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-muted flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-purple-400" /> Tokens Used
                    </span>
                    <span className="text-foreground">
                      {((usageData.usage?.tokensUsed || 0) / 1000).toFixed(1)}k / {((usageData.limits?.tokensPerMonth || 500000) / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full bg-purple-500 transition-all duration-500 rounded-full"
                      style={{
                        width: `${Math.min(100, ((usageData.usage?.tokensUsed || 0) / (usageData.limits?.tokensPerMonth || 500000)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Plan Upgrade Cards */}
            {usageData?.tier !== 'pro' && (
              <div className="mt-8 pt-6 border-t border-border/50">
                <h3 className="text-sm font-bold text-foreground mb-4">Upgrade Your Power</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-purple-500/30 bg-[rgba(138,43,226,0.05)] p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-base text-foreground">Premium Plan</span>
                        <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">$19/mo</span>
                      </div>
                      <p className="text-xs text-muted mb-4">Unlock Claude Sonnet 4.5, 50 monthly tasks, and 5M token quota.</p>
                    </div>
                    <a
                      href={process.env.NEXT_PUBLIC_LEMONSQUEEZY_PREMIUM_URL || "https://lemonsqueezy.com"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-500 py-2.5 px-4 font-bold text-white text-sm transition-all shadow-lg shadow-purple-500/20"
                    >
                      <span>Upgrade to Premium</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  <div className="rounded-xl border border-accent/40 bg-accent/5 p-5 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-accent text-background text-[10px] font-black uppercase px-2 py-0.5 rounded-bl">Best Value</div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-base text-foreground">Pro Plan</span>
                        <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-accent/20 text-accent">$49/mo</span>
                      </div>
                      <p className="text-xs text-muted mb-4">Unlock Claude Opus 4.6 & 4.1, Unlimited tasks, multi-repo, and 20M tokens!</p>
                    </div>
                    <a
                      href={process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_URL || "https://lemonsqueezy.com"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-lg bg-accent hover:bg-accent/90 py-2.5 px-4 font-bold text-background text-sm transition-all shadow-lg shadow-accent/20"
                    >
                      <span>Get Pro Access</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* GitHub Integration Section */}
          <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background border border-border">
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="h-6 w-6 text-foreground">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-foreground">GitHub Integration</h2>
                <p className="text-sm text-muted max-w-xl">
                  Connect PocketDev to your GitHub account to allow the AI to clone repositories, create branches, and push code on your behalf.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-[rgba(255,165,0,0.2)] bg-[rgba(255,165,0,0.05)] p-4">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-orange-400" />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-orange-400">Missing Permissions?</span>
                  <p className="text-xs text-orange-400/80">
                    If you are getting a "Resource not accessible by integration" error, it means you didn't grant the app permission to access certain repositories. Click the button below to re-authorize and manually add the missing repositories to your installation.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleReauthorize}
              disabled={isAuthenticating}
              className="mt-6 flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 font-bold text-background transition-all hover:scale-[0.98] hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Re-directing to GitHub...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4" />
                  <span>Re-Authorize GitHub App</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
