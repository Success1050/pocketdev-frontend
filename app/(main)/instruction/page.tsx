"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, GitBranch, Plus, ChevronDown, 
  Cpu, Activity, MessageSquare, Folder, 
  Zap, AlertCircle, ShieldCheck, Laptop, Moon, Server, Bug, FlaskConical
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useProject } from "@/context/ProjectContext";
import { getUserId } from "@/lib/storage";
import api from "@/lib/axios";

const SUGGESTIONS = [
  { text: "Add authentication with Supabase", icon: ShieldCheck },
  { text: "Create a landing page", icon: Laptop },
  { text: "Add dark mode toggle", icon: Moon },
  { text: "Setup a REST API", icon: Server },
  { text: "Fix all TypeScript errors", icon: Bug },
  { text: "Write unit tests", icon: FlaskConical },
];

type BranchAction = "existing" | "new";

export default function InstructionScreen() {
  const router = useRouter();
  const { activeProject, setActiveBranch, refreshBranches } = useProject();

  const [instruction, setInstruction] = useState("");
  const [branchAction, setBranchAction] = useState<BranchAction>("existing");
  const [selectedBranch, setSelectedBranch] = useState(activeProject?.activeBranch ?? "main");
  const [newBranchName, setNewBranchName] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [providerId, setProviderId] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await api.get("/agent/models");
        const result = res.data;
        if (result.status === "success") {
          setAvailableProviders(result.data);
          if (result.data.length > 0) {
            setProviderId(result.data[0].providerId);
            if (result.data[0].models.length > 0) {
              setSelectedModel(result.data[0].models[0].id);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch models", err);
      }
    };
    fetchModels();
  }, []);

  const fetchedProjectIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeProject && activeProject.id !== fetchedProjectIdRef.current) {
      const owner = activeProject.owner || activeProject.repoUrl?.split("github.com/")[1]?.split("/")[0];
      if (owner) {
        refreshBranches(owner, activeProject.name, activeProject.id);
        fetchedProjectIdRef.current = activeProject.id;
      }
    }
  }, [activeProject, refreshBranches]);

  useEffect(() => {
    if (activeProject?.activeBranch) {
      setSelectedBranch((prev) => {
        // Only set it initially if it's currently default "main" and activeBranch is different
        // OR we can just let it initialize via useState.
        // Actually, we want to update it if the user switches projects globally.
        return prev === "main" ? activeProject.activeBranch : prev;
      });
    }
  }, [activeProject?.id, activeProject?.activeBranch]);

  const buildPayload = () => {
    const targetBranch = branchAction === "new"
      ? newBranchName.trim().replace(/\s+/g, "-").toLowerCase()
      : selectedBranch;

    return {
      repo: {
        name: activeProject?.name,
        url: activeProject?.repoUrl,
        owner: "user",
      },
      branch: {
        action: branchAction,
        name: targetBranch,
        baseBranch: selectedBranch,
      },
      instruction: instruction.trim(),
      llm: {
        provider: providerId,
        model: selectedModel,
      },
      meta: {
        language: activeProject?.language,
        projectId: activeProject?.id,
        timestamp: new Date().toISOString(),
      },
    };
  };

  const handleSend = async () => {
    const isNewBranchOnly = branchAction === "new" && newBranchName.trim().length > 0 && !instruction.trim();
    const hasInstruction = instruction.trim().length > 0;

    if (!activeProject || (!hasInstruction && !isNewBranchOnly)) return;

    setIsSending(true);

    try {
      const userId = getUserId();
      if (!userId) throw new Error("User not found");

      if (branchAction === "new" && newBranchName.trim()) {
        const branchToCreate = newBranchName.trim().replace(/\s+/g, "-").toLowerCase();
        const owner = activeProject.owner || activeProject.repoUrl?.split("github.com/")[1]?.split("/")[0];

        if (!owner) throw new Error("Could not determine repository owner");

        try {
          await api.post(`/github/repos/${userId}/${owner}/${activeProject.name}/branches`, {
            branchName: branchToCreate,
            baseBranch: selectedBranch,
          });
          setActiveBranch(branchToCreate);
        } catch (err: any) {
          throw new Error(err.response?.data?.message || "Failed to create branch");
        }

        if (!instruction.trim()) {
          alert(`Branch '${branchToCreate}' created successfully!`);
          setIsSending(false);
          router.back();
          return;
        }
      }

      const payload = buildPayload();
      const res = await api.post("/tasks", payload);
      const taskId = res.data.id;

      setIsSending(false);
      // Pass taskId in query params
      router.push(`/logs?taskId=${taskId}`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong");
      setIsSending(false);
    }
  };

  const targetBranch = branchAction === "new"
    ? (newBranchName.trim().replace(/\s+/g, "-").toLowerCase() || "new-branch")
    : selectedBranch;

  return (
    <div className="relative flex min-h-screen flex-col bg-background pb-32 overflow-hidden">
      {/* Decorative Glow */}
      <div className="pointer-events-none absolute -left-20 -top-40 h-[400px] w-[400px] rounded-full bg-accent opacity-[0.05] blur-[100px]" />

      <div className="relative z-10 px-6 pt-12 md:px-12 md:pt-16 lg:px-16 max-w-4xl mx-auto w-full">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex items-center gap-6"
        >
          <button
            onClick={() => router.back()}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface transition-transform hover:scale-105"
          >
            <ChevronLeft className="h-6 w-6 text-foreground" />
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            New Instruction
          </h1>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-8"
        >
          {/* Active Project Card */}
          {activeProject ? (
            <div className="rounded-[24px] border border-border bg-surface p-6 md:p-8">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-background">
                  <Folder className="h-6 w-6 text-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-lg font-bold text-foreground">
                    {activeProject.name}
                  </span>
                  <span className="text-sm text-muted line-clamp-1">
                    {activeProject.description}
                  </span>
                </div>
              </div>

              {/* Branch Selector */}
              <div className="border-t border-border pt-6">
                <h3 className="mb-4 text-[10px] font-black tracking-widest text-muted">
                  TARGET BRANCH
                </h3>
                
                <div className="mb-4 flex rounded-xl bg-background p-1">
                  <button
                    onClick={() => setBranchAction("existing")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 transition-colors ${
                      branchAction === "existing"
                        ? "bg-surface-light text-accent"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    <GitBranch className="h-4 w-4" />
                    <span className="text-sm font-semibold">Existing</span>
                  </button>
                  <button
                    onClick={() => setBranchAction("new")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 transition-colors ${
                      branchAction === "new"
                        ? "bg-surface-light text-accent"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-sm font-semibold">New Branch</span>
                  </button>
                </div>

                {branchAction === "existing" ? (
                  <div className="relative flex items-center gap-3 rounded-xl border border-border bg-background px-4 h-14">
                    <GitBranch className="h-4 w-4 text-accent" />
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="flex-1 appearance-none bg-transparent font-mono text-sm font-semibold text-foreground outline-none cursor-pointer"
                    >
                      {activeProject.branches?.map((b) => (
                        <option key={b} value={b} className="bg-surface text-foreground">
                          {b}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="h-4 w-4 text-muted pointer-events-none" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-background px-4 h-14 focus-within:border-accent">
                      <GitBranch className="h-4 w-4 text-accent" />
                      <input
                        type="text"
                        placeholder="feature/my-new-branch"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        className="flex-1 bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted"
                      />
                    </div>
                    <span className="text-xs text-muted ml-1">
                      Will branch from: <span className="text-accent">{selectedBranch}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[24px] border border-border bg-surface p-12 text-center">
              <AlertCircle className="h-8 w-8 text-muted" />
              <div className="flex flex-col gap-1">
                <span className="text-lg font-bold text-foreground">No active project</span>
                <span className="text-sm text-muted">Go to Projects to select a repository</span>
              </div>
              <button 
                onClick={() => router.push("/projects")}
                className="mt-4 rounded-xl bg-accent-dim px-6 py-2.5 text-sm font-bold text-accent hover:bg-accent/20"
              >
                Go to Projects
              </button>
            </div>
          )}

          {/* AI Model Selector */}
          <div>
            <h3 className="mb-4 text-[10px] font-black tracking-widest text-muted">
              AI MODEL
            </h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex flex-1 items-center gap-3 rounded-xl border border-border bg-surface px-4 h-14">
                <Cpu className="h-4 w-4 text-accent" />
                <select
                  value={providerId}
                  onChange={(e) => {
                    setProviderId(e.target.value);
                    const prov = availableProviders.find(p => p.providerId === e.target.value);
                    if (prov && prov.models.length > 0) setSelectedModel(prov.models[0].id);
                  }}
                  className="flex-1 appearance-none bg-transparent text-sm font-semibold text-foreground outline-none cursor-pointer"
                >
                  {availableProviders.map(p => (
                    <option key={p.providerId} value={p.providerId} className="bg-surface text-foreground">
                      {p.name}
                    </option>
                  ))}
                  {availableProviders.length === 0 && <option value="">Loading...</option>}
                </select>
                <ChevronDown className="h-4 w-4 text-muted pointer-events-none" />
              </div>

              <div className="relative flex flex-[1.5] items-center gap-3 rounded-xl border border-border bg-surface px-4 h-14">
                <Activity className="h-4 w-4 text-accent" />
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="flex-1 appearance-none bg-transparent text-sm font-semibold text-foreground outline-none cursor-pointer"
                >
                  {availableProviders.find(p => p.providerId === providerId)?.models.map((m: any) => (
                    <option key={m.id} value={m.id} className="bg-surface text-foreground">
                      {m.name}
                    </option>
                  ))}
                  {!providerId && <option value="">Loading...</option>}
                </select>
                <ChevronDown className="h-4 w-4 text-muted pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Instruction Input */}
          <div>
            <h3 className="mb-4 text-[10px] font-black tracking-widest text-muted">
              INSTRUCTION
            </h3>
            <div className="rounded-2xl border border-border bg-surface p-5 focus-within:border-accent transition-colors">
              <textarea
                placeholder="What should the AI build?"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                className="min-h-[120px] w-full resize-none bg-transparent text-base font-medium text-foreground outline-none placeholder:text-muted"
              />
            </div>
          </div>

          {/* Quick Start Suggestions */}
          <div>
            <h3 className="mb-4 text-[10px] font-black tracking-widest text-muted">
              QUICK START
            </h3>
            <div className="flex flex-wrap gap-3">
              {SUGGESTIONS.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setInstruction(item.text)}
                  className="flex items-center gap-2 rounded-xl bg-surface px-4 py-2.5 transition-colors hover:bg-surface-light border border-border hover:border-accent/30"
                >
                  <item.icon className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium text-text-dim">{item.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payload Preview */}
          <AnimatePresence>
            {instruction.trim().length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-2xl border border-border bg-background p-5 mt-4">
                  <h3 className="mb-4 text-[10px] font-black tracking-widest text-muted">
                    WILL SEND TO ENGINE
                  </h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Folder className="h-4 w-4 text-accent" />
                      <span className="text-sm font-mono text-text-dim">{activeProject?.name ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <GitBranch className="h-4 w-4 text-brand-blue" />
                      <span className="text-sm font-mono text-text-dim">
                        {branchAction === "new" ? `Create: ${targetBranch}` : targetBranch}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 text-brand-purple" />
                      <span className="text-sm text-text-dim line-clamp-1">{instruction.trim()}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Send Button */}
        <div className="fixed bottom-[90px] md:bottom-8 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
          <div className="w-full max-w-4xl mx-auto flex justify-end pointer-events-auto">
            <button
              onClick={handleSend}
              disabled={!activeProject || (!instruction.trim() && (branchAction !== "new" || !newBranchName.trim())) || isSending}
              className="flex h-16 w-full md:w-auto md:min-w-[200px] items-center justify-center gap-3 rounded-2xl bg-accent px-8 shadow-[0_8px_20px_rgba(0,255,133,0.2)] transition-all hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50 disabled:grayscale"
            >
              {isSending ? (
                <span className="text-lg font-bold text-background">
                  {instruction.trim() ? "Starting Engine..." : "Creating Branch..."}
                </span>
              ) : (
                <>
                  <span className="text-lg font-bold text-background">
                    {instruction.trim() ? "Start Engine" : "Create Branch"}
                  </span>
                  {instruction.trim() ? (
                    <Zap className="h-5 w-5 text-background fill-background" />
                  ) : (
                    <GitBranch className="h-5 w-5 text-background" />
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
