"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, X, Search, Lock, GitBranch, Clock, Star, CheckCircle2, 
  PlusCircle, Copy, RefreshCw 
} from "lucide-react";
import { useEffect, useState } from "react";
import { useProject, Project } from "@/context/ProjectContext";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { getUserId } from "@/lib/storage";

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178C6",
  JavaScript: "#F7DF1E",
  Python: "#3776AB",
  Rust: "#DEA584",
  Go: "#00ADD8",
  "React Native": "#61DAFB",
  Swift: "#F05138",
  Dart: "#0175C2",
};

export default function ProjectsScreen() {
  const router = useRouter();
  const {
    projects: contextProjects,
    activeProject: contextActiveProject,
    setActiveProject: setContextActive,
    refreshProjects,
    refreshBranches,
    isLoading,
  } = useProject();

  const [searchText, setSearchText] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (contextProjects.length === 0) {
      handleRefresh();
    }
  }, []);

  const handleRefresh = async () => {
    setPage(1);
    const newProjects = await refreshProjects(1);
    setHasMore(newProjects.length === 20); // Assuming perPage is 20
  };

  const handleLoadMore = async () => {
    if (isLoading || !hasMore) return;
    const nextPage = page + 1;
    const newProjects = await refreshProjects(nextPage);
    setPage(nextPage);
    setHasMore(newProjects.length === 20);
  };

  const handleSelectProject = async (project: Project) => {
    setContextActive(project);
    setLoadingBranches(project.id);
    try {
      await refreshBranches(project.owner, project.name, project.id);
    } finally {
      setLoadingBranches(null);
    }
  };

  const filteredProjects = contextProjects.filter((p) =>
    p.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "active":
        return "var(--color-accent)";
      case "building":
        return "var(--color-brand-blue)";
      case "idle":
        return "var(--color-muted)";
      default:
        return "var(--color-muted)";
    }
  };

  const getStatusLabel = (status: Project["status"]) => {
    switch (status) {
      case "active":
        return "AI ACTIVE";
      case "building":
        return "BUILDING";
      case "idle":
        return "IDLE";
      default:
        return "IDLE";
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background pb-32">
      {/* Decorative Glow */}
      <div className="pointer-events-none absolute -left-20 -top-40 h-[400px] w-[400px] rounded-full bg-brand-purple opacity-[0.04] blur-[100px]" />

      <div className="relative z-10 px-6 pt-12 md:px-12 md:pt-16 lg:px-16 max-w-6xl mx-auto w-full">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Projects
            </h1>
            <p className="mt-1 text-sm text-muted">
              {contextProjects.length} repositories connected
            </p>
          </div>
          <button
            onClick={() => setShowNewProject(!showNewProject)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent-dim transition-transform hover:scale-105 active:scale-95"
          >
            {showNewProject ? (
              <X className="h-6 w-6 text-accent" />
            ) : (
              <Plus className="h-6 w-6 text-accent" />
            )}
          </button>
        </motion.header>

        {/* New Project Options */}
        <AnimatePresence>
          {showNewProject && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden rounded-[24px] border border-border bg-surface"
            >
              <div className="p-6 md:p-8">
                <h2 className="mb-2 text-xl font-bold text-foreground">Create New Project</h2>
                <p className="mb-6 text-sm text-muted">
                  Start a brand new repo, connect an existing one, or upload a local project folder.
                </p>

                <div className="flex flex-col">
                  {/* Hidden file input for ZIP upload */}
                  <input 
                    type="file" 
                    id="local-upload-input" 
                    accept=".zip" 
                    className="hidden" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      const toastId = toast.loading("Uploading project...");
                      try {
                        const formData = new FormData();
                        formData.append("file", file);
                        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                        const res = await fetch(`${backendUrl}/tasks/upload`, {
                          method: "POST",
                          body: formData,
                        });
                        
                        if (!res.ok) throw new Error("Upload failed");
                        
                        const data = await res.json();
                        
                        // Add local project to context
                        const localProj: Project = {
                          id: "local-" + Date.now(),
                          name: file.name.replace('.zip', ''),
                          owner: "local",
                          description: "Local Project Upload",
                          language: "Unknown",
                          stars: 0,
                          isPrivate: true,
                          lastActive: new Date().toISOString(),
                          branches: ["main"],
                          activeBranch: "main",
                          status: "idle",
                          repoUrl: data.url,
                          isLocal: true,
                        };
                        if (data.envContent) {
                          try {
                            const userId = getUserId();
                            await api.post(`/github/repos/${userId}/local/${encodeURIComponent(localProj.name)}/env`, {
                              envContent: data.envContent
                            });
                            toast.success("Environment variables auto-detected!");
                          } catch (envErr) {
                            console.error("Failed to save auto-detected env", envErr);
                          }
                        }

                        handleSelectProject(localProj);
                        toast.success("Local project uploaded!", { id: toastId });
                        setShowNewProject(false);
                        router.push("/instruction");
                      } catch (err) {
                        toast.error("Failed to upload project", { id: toastId });
                        console.error(err);
                      }
                    }} 
                  />

                  {[
                    {
                      icon: PlusCircle,
                      color: "var(--color-accent)",
                      title: "Upload Local Project (.zip)",
                      sub: "Extracts and runs instantly via PocketDev",
                      action: () => document.getElementById("local-upload-input")?.click(),
                    },
                    {
                      icon: function GithubIcon(props: any) {
                        return (
                          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
                            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                          </svg>
                        );
                      },
                      color: "var(--color-brand-purple)",
                      title: "Import from GitHub",
                      sub: "Connect an existing repo",
                      action: () => router.push("/auth/github"),
                    },
                    {
                      icon: Copy,
                      color: "var(--color-brand-blue)",
                      title: "Use a Template",
                      sub: "Start from Next.js, Expo, Flask...",
                      action: () => toast("Templates feature coming soon!"),
                    },
                  ].map((option, i) => (
                    <button
                      key={i}
                      onClick={option.action}
                      className="group flex items-center gap-4 border-t border-border py-4 transition-colors hover:bg-surface-light px-2 -mx-2 rounded-xl"
                    >
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${option.color} 10%, transparent)`,
                          borderColor: `color-mix(in srgb, ${option.color} 25%, transparent)`,
                        }}
                      >
                        <option.icon className="h-6 w-6" style={{ color: option.color }} />
                      </div>
                      <div className="flex flex-1 flex-col text-left">
                        <span className="text-[15px] font-semibold text-foreground">
                          {option.title}
                        </span>
                        <span className="mt-0.5 text-xs text-muted">{option.sub}</span>
                      </div>
                      <Plus className="h-5 w-5 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <div className="mb-8 flex h-14 items-center gap-3 rounded-2xl border border-border bg-surface px-4 focus-within:border-accent">
          <Search className="h-5 w-5 text-muted" />
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted"
          />
          {searchText && (
            <button onClick={() => setSearchText("")}>
              <X className="h-5 w-5 text-muted hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Project List */}
        <div className="flex flex-col gap-4">
          {filteredProjects.map((project) => {
            const isActive = contextActiveProject?.id === project.id;
            return (
              <button
                key={project.id}
                onClick={() => handleSelectProject(project)}
                className={`flex flex-col rounded-[20px] border p-5 text-left transition-colors md:p-6 ${
                  isActive
                    ? "border-accent/50 bg-surface-light"
                    : "border-border bg-surface hover:border-accent/30"
                }`}
              >
                {/* Card Header */}
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="flex flex-1 items-center gap-2.5">
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: LANG_COLORS[project.language] ?? "var(--color-muted)",
                      }}
                    />
                    <span className="font-mono text-[17px] font-bold text-foreground truncate">
                      {project.name}
                    </span>
                    {project.isPrivate && (
                      <div className="flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 shrink-0">
                        <Lock className="h-2.5 w-2.5 text-muted" />
                        <span className="text-[9px] font-black tracking-wider text-muted">
                          PRIVATE
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${getStatusColor(
                          project.status
                        )} 10%, transparent)`,
                      }}
                    >
                      <div
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: getStatusColor(project.status) }}
                      />
                      <span
                        className="text-[9px] font-black tracking-widest"
                        style={{ color: getStatusColor(project.status) }}
                      >
                        {getStatusLabel(project.status)}
                      </span>
                    </div>

                    {loadingBranches === project.id && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      >
                        <RefreshCw className="h-3 w-3 text-accent" />
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="mb-4 text-[13px] leading-[19px] text-muted line-clamp-2">
                  {project.description}
                </p>

                {/* Meta Row */}
                <div className="flex flex-wrap items-center gap-5">
                  <div className="flex items-center gap-1.5">
                    <GitBranch className="h-3.5 w-3.5 text-muted" />
                    <span className="text-xs text-muted">{project.activeBranch}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted" />
                    <span className="text-xs text-muted">{project.lastActive}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-muted" />
                    <span className="text-xs text-muted">{project.stars}</span>
                  </div>
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span className="text-xs font-bold text-accent">Active Workspace</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Loading / Load More */}
        {isLoading ? (
          <div className="p-8 text-center text-sm italic text-muted">
            Loading repositories...
          </div>
        ) : (
          hasMore &&
          filteredProjects.length >= 20 && (
            <button
              onClick={handleLoadMore}
              className="mt-6 w-full rounded-[20px] border border-dashed border-border bg-surface py-4 text-center text-[15px] font-bold text-accent hover:border-accent hover:bg-surface-light transition-colors"
            >
              Load More Repositories
            </button>
          )
        )}
      </div>
    </div>
  );
}
