"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Folder, GitBranch, Trash2, Check, RefreshCw, FolderOpen, Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/axios";

import { useProject, Project } from "@/context/ProjectContext";

type ConnectState = "idle" | "connecting" | "success";

export default function GitHubScreen() {
  const [connectState, setConnectState] = useState<ConnectState>("idle");
  const [selectedRepo, setSelectedRepo] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  const { refreshProjects, setActiveProject } = useProject();

  const router = useRouter();

  const handleConnect = () => {
    setConnectState("connecting");
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    window.location.href = `${backendUrl}/auth/github/login?platform=web`;
  };

  useEffect(() => {
    // Check if we just returned from OAuth with a token
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userId = params.get("userId");

    if (token && userId) {
      import("@/lib/storage").then(({ saveAuthData }) => {
        saveAuthData(token, userId);
        setConnectState("success");
        setIsLoading(true);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);

        // Fetch real projects from GitHub API via context
        refreshProjects(1, 100).then((data) => {
          setProjects(data || []);
          setIsLoading(false);
        });
      });
    }
  }, [refreshProjects]);

  const handleContinue = () => {
    if (selectedRepo) {
      setActiveProject(selectedRepo);
    }
    router.push("/dashboard");
  };

  const getLangColor = (lang: string) => {
    const LANG_COLORS: Record<string, string> = {
      TypeScript: "#3178C6",
      JavaScript: "#F7DF1E",
      "Node.js": "#68A063",
      "React Native": "#61DAFB",
    };
    return LANG_COLORS[lang] || "var(--color-muted)";
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground overflow-hidden">
      {/* Decorative Grid */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0F0F14_1px,transparent_1px),linear-gradient(to_bottom,#0F0F14_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="pointer-events-none absolute -left-20 -top-40 h-80 w-[150%] rounded-[300px] bg-accent opacity-[0.05] blur-3xl md:-left-40 md:w-[120%]" />

      <main className={`relative z-10 flex flex-1 flex-col px-8 pt-16 pb-16 md:mx-auto md:w-full lg:pt-20 transition-all duration-500 ${connectState === 'success' ? 'md:max-w-5xl' : 'md:max-w-xl'}`}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <button
            onClick={() => router.back()}
            className="mb-8 flex items-center gap-3 text-sm font-semibold hover:opacity-80 transition-opacity"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface">
              <ChevronLeft className="h-5 w-5" />
            </div>
            Back
          </button>
        </motion.div>

        <div className={`flex flex-col transition-all duration-500 ${connectState === 'success' ? 'md:flex-row md:items-start md:gap-12' : ''}`}>
          <div className={`flex flex-col transition-all duration-500 ${connectState === 'success' ? 'md:w-[45%]' : 'w-full'}`}>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="mb-5 flex items-center gap-1.5 self-start rounded-full border border-[rgba(0,255,133,0.2)] bg-accent-dim px-3 py-1.5 w-fit">
            <div className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[10px] font-black tracking-[1.5px] text-accent">
              STEP 2 OF 3
            </span>
          </div>
          <h1 className="mb-4 whitespace-pre-line text-[48px] font-extrabold leading-[52px] tracking-tight">
            Connect{"\n"}GitHub
          </h1>
          <p className="text-base font-normal leading-6 text-muted">
            PocketDev needs access to your repositories to clone, edit, and push changes.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 rounded-[20px] border border-border bg-surface p-6 md:p-8"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background">
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="h-7 w-7 text-foreground">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-lg font-bold">github.com</span>
              <span className="text-[13px] text-muted">OAuth Authorization</span>
            </div>
          </div>

          <div className="my-5 h-px w-full bg-border" />

          <h3 className="mb-4 text-xs font-extrabold tracking-[1.5px] text-muted">
            PERMISSIONS:
          </h3>
          <div className="flex flex-col gap-3.5">
            {[
              { icon: Folder, label: "Read repositories", ok: true },
              { icon: GitBranch, label: "Push branches", ok: true },
              { icon: Trash2, label: "Delete repos", ok: false },
            ].map((perm, i) => (
              <div key={i} className="flex items-center gap-3">
                <perm.icon
                  className={`h-4 w-4 ${perm.ok ? "text-accent" : "text-muted"}`}
                />
                <span
                  className={`flex-1 text-sm font-medium ${perm.ok ? "text-text-dim" : "text-muted line-through"
                    }`}
                >
                  {perm.label}
                </span>
                <span
                  className={`rounded-md px-2 py-1 text-[10px] font-black ${perm.ok
                    ? "bg-accent-dim text-accent"
                    : "bg-[rgba(255,71,87,0.1)] text-[#FF4757]"
                    }`}
                >
                  {perm.ok ? "YES" : "NO"}
                </span>
              </div>
            ))}
          </div>

          <div className="my-5 h-px w-full bg-border" />

          {connectState === "idle" && (
            <button
              onClick={handleConnect}
              className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-accent transition-all hover:scale-[0.98] hover:opacity-90 active:scale-95"
            >
              <span className="text-lg font-bold text-background">
                Authorize with GitHub
              </span>
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="h-5 w-5 text-background">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </button>
          )}

          {connectState === "connecting" && (
            <div className="flex h-16 items-center justify-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <RefreshCw className="h-6 w-6 text-accent" />
              </motion.div>
              <span className="text-sm text-muted">Reaching GitHub servers...</span>
            </div>
          )}

          {connectState === "success" && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-4 rounded-2xl border border-accent bg-surface-light p-4 md:p-5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                <Check className="h-5 w-5 text-background" />
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-base font-bold text-foreground">Connected!</span>
                <span className="text-xs text-muted">OAuth Active</span>
              </div>
              <button
                onClick={() => setConnectState("idle")}
                className="rounded-lg border border-[rgba(255,71,87,0.2)] bg-[rgba(255,71,87,0.1)] px-2.5 py-1.5 text-[11px] font-bold text-[#FF4757] hover:bg-[rgba(255,71,87,0.15)]"
              >
                Disconnect
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>

        <AnimatePresence>
          {connectState === "success" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-3 md:w-[55%] mt-8 md:mt-0"
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <h2 className="mb-1 text-2xl font-extrabold text-foreground">
                    Select a repository
                  </h2>
                  <p className="mb-3 text-sm text-muted">
                    You can swap this anytime later
                  </p>
                </div>
                {projects.length > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface-light px-3 py-1.5">
                    <FolderOpen className="h-3.5 w-3.5 text-accent" />
                    <span className="font-mono text-[13px] font-bold text-accent">
                      {projects.length}
                    </span>
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="py-10 text-center text-muted">
                  Fetching your repositories...
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {projects.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => setSelectedRepo(repo)}
                      className={`flex items-center justify-between rounded-2xl border p-5 text-left transition-colors md:p-6 ${selectedRepo?.id === repo.id
                        ? "border-accent bg-surface-light"
                        : "border-border bg-surface hover:border-accent/50"
                        }`}
                    >
                      <div className="flex flex-1 flex-col gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-base font-bold text-foreground">
                            {repo.name}
                          </span>
                          {repo.isPrivate && (
                            <div className="rounded-md border border-border bg-surface px-1.5 py-0.5">
                              <span className="text-[9px] font-black text-muted">
                                PRIVATE
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: getLangColor(repo.language) }}
                            />
                            <span className="text-[13px] text-muted">
                              {repo.language}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-[#E3B341] text-[#E3B341]" />
                            <span className="text-[13px] text-muted">{repo.stars}</span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${selectedRepo?.id === repo.id
                          ? "border-accent"
                          : "border-border"
                          }`}
                      >
                        {selectedRepo?.id === repo.id && (
                          <div className="h-3 w-3 rounded-full bg-accent" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                  <button
                    onClick={handleContinue}
                    disabled={!selectedRepo}
                    className="mt-3 flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-accent transition-all hover:scale-[0.98] hover:opacity-90 active:scale-95 disabled:pointer-events-none disabled:bg-surface disabled:border disabled:border-border"
                  >
                    <span
                      className={`text-lg font-bold ${selectedRepo ? "text-background" : "text-muted"
                        }`}
                    >
                      Continue
                    </span>
                    <ArrowRight
                      className={`h-5 w-5 ${selectedRepo ? "text-background" : "text-muted"
                        }`}
                    />
                  </button>

                  <button
                    onClick={handleContinue}
                    className="mt-2 py-3 text-center text-sm font-semibold text-muted hover:text-white"
                  >
                    Skip for now
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
