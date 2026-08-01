"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, GitBranch, Plus, ChevronDown,
  Cpu, Activity, MessageSquare, Folder,
  Zap, AlertCircle, ShieldCheck, Laptop, Moon, Server, Bug, FlaskConical, RefreshCw, Settings,
  X, Paperclip, Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useProject } from "@/context/ProjectContext";
import { getUserId, saveSelectedModel, getSelectedModel } from "@/lib/storage";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";

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
  const { activeProject, setActiveBranch, refreshBranches, projects, refreshProjects } = useProject();

  const [instruction, setInstruction] = useState("");
  const [branchAction, setBranchAction] = useState<BranchAction>("existing");
  const [selectedBranch, setSelectedBranch] = useState(activeProject?.activeBranch ?? "main");
  const [newBranchName, setNewBranchName] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [secondaryProject, setSecondaryProject] = useState<any>(null);
  const [secondaryBranchAction, setSecondaryBranchAction] = useState<BranchAction>("existing");
  const [secondarySelectedBranch, setSecondarySelectedBranch] = useState("main");
  const [secondaryNewBranchName, setSecondaryNewBranchName] = useState("");

  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [providerId, setProviderId] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");

  const [attachments, setAttachments] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [showEnvModal, setShowEnvModal] = useState(false);
  const [envContent, setEnvContent] = useState("");
  const [isSavingEnv, setIsSavingEnv] = useState(false);
  const [isLoadingEnv, setIsLoadingEnv] = useState(false);
  const [envProjectInfo, setEnvProjectInfo] = useState<{ id: string; owner: string; name: string } | null>(null);

  useEffect(() => {
    if (projects.length === 0) {
      refreshProjects(1, 100).catch(console.error);
    }
  }, [projects.length, refreshProjects]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await api.get("/agent/models");
        const result = res.data;
        if (result.status === "success") {
          setAvailableProviders(result.data);

          const saved = getSelectedModel();
          if (saved) {
            const savedProvider = result.data.find((p: any) => p.providerId === saved.providerId);
            if (savedProvider) {
              setProviderId(savedProvider.providerId);
              const savedModel = savedProvider.models.find((m: any) => m.id === saved.modelId && !m.locked);
              if (savedModel) {
                setSelectedModel(savedModel.id);
              } else {
                const firstUnlocked = savedProvider.models.find((m: any) => !m.locked) || savedProvider.models[0];
                if (firstUnlocked) setSelectedModel(firstUnlocked.id);
              }
            } else if (result.data.length > 0) {
              setProviderId(result.data[0].providerId);
              const firstUnlocked = result.data[0].models.find((m: any) => !m.locked) || result.data[0].models[0];
              if (firstUnlocked) setSelectedModel(firstUnlocked.id);
            }
          } else if (result.data.length > 0) {
            setProviderId(result.data[0].providerId);
            const firstUnlocked = result.data[0].models.find((m: any) => !m.locked) || result.data[0].models[0];
            if (firstUnlocked) setSelectedModel(firstUnlocked.id);
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
    if (secondaryProject) {
      const owner = secondaryProject.owner || secondaryProject.repoUrl?.split("github.com/")[1]?.split("/")[0];
      if (owner) {
        refreshBranches(owner, secondaryProject.name, secondaryProject.id);
      }
    }
  }, [secondaryProject, refreshBranches]);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/tasks/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAttachments((prev) => [...prev, response.data.url]);
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const buildPayload = () => {
    const targetBranch = branchAction === "new"
      ? newBranchName.trim().replace(/\s+/g, "-").toLowerCase()
      : selectedBranch;

    const payload: any = {
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
      attachments: attachments,
      isLocal: activeProject?.isLocal || false,
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

    if (secondaryProject) {
      const secTargetBranch = secondaryBranchAction === "new"
        ? secondaryNewBranchName.trim().replace(/\s+/g, "-").toLowerCase()
        : secondarySelectedBranch;

      payload.secondaryRepo = {
        name: secondaryProject.name,
        url: secondaryProject.repoUrl,
        owner: "user",
      };
      payload.secondaryBranch = {
        action: secondaryBranchAction,
        name: secTargetBranch,
        baseBranch: secondarySelectedBranch,
      };
      payload.meta.secondaryProjectId = secondaryProject.id;
    }

    return payload;
  };

  const handleOpenEnvModal = async (project: any) => {
    if (!project) return;
    const owner = project.owner || project.repoUrl?.split("github.com/")[1]?.split("/")[0];
    if (!owner) {
      toast.error("Could not determine repository owner");
      return;
    }
    setEnvProjectInfo({ id: project.id, owner, name: project.name });
    setShowEnvModal(true);
    setIsLoadingEnv(true);
    try {
      const userId = getUserId();
      const res = await api.get(`/github/repos/${userId}/${owner}/${encodeURIComponent(project.name)}/env`);
      setEnvContent(res.data?.envContent || "");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load environment variables");
    } finally {
      setIsLoadingEnv(false);
    }
  };

  const handleSaveEnv = async () => {
    if (!envProjectInfo) return;
    setIsSavingEnv(true);
    try {
      const userId = getUserId();
      await api.post(`/github/repos/${userId}/${envProjectInfo.owner}/${encodeURIComponent(envProjectInfo.name)}/env`, {
        envContent,
      });
      toast.success("Environment variables saved!");
      setShowEnvModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save environment variables");
    } finally {
      setIsSavingEnv(false);
    }
  };

  const handleSend = async () => {
    const isCreatingAnyBranch = (branchAction === "new" && newBranchName.trim().length > 0) ||
      (secondaryProject && secondaryBranchAction === "new" && secondaryNewBranchName.trim().length > 0);
    const isNewBranchOnly = isCreatingAnyBranch && !instruction.trim();
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
          await api.post(`/github/repos/${userId}/${owner}/${encodeURIComponent(activeProject.name)}/branches`, {
            branchName: branchToCreate,
            baseBranch: selectedBranch,
          });
          setActiveBranch(branchToCreate);
          setBranchAction("existing");
          setSelectedBranch(branchToCreate);
          setNewBranchName("");
        } catch (err: any) {
          throw new Error(err.response?.data?.message || "Failed to create branch");
        }
      }

      if (secondaryProject && secondaryBranchAction === "new" && secondaryNewBranchName.trim()) {
        const secBranchToCreate = secondaryNewBranchName.trim().replace(/\s+/g, "-").toLowerCase();
        const secOwner = secondaryProject.owner || secondaryProject.repoUrl?.split("github.com/")[1]?.split("/")[0];

        if (!secOwner) throw new Error("Could not determine secondary repository owner");

        try {
          await api.post(`/github/repos/${userId}/${secOwner}/${encodeURIComponent(secondaryProject.name)}/branches`, {
            branchName: secBranchToCreate,
            baseBranch: secondarySelectedBranch,
          });
          setSecondaryProject((prev: any) => ({
            ...prev,
            branches: prev.branches?.includes(secBranchToCreate) ? prev.branches : [...(prev.branches || []), secBranchToCreate]
          }));
          setSecondaryBranchAction("existing");
          setSecondarySelectedBranch(secBranchToCreate);
          setSecondaryNewBranchName("");
        } catch (err: any) {
          throw new Error(err.response?.data?.message || "Failed to create secondary branch");
        }
      }

      if (!instruction.trim()) {
        toast.success(`Branch(es) created successfully!`);
        setIsSending(false);
        return;
      }

      const payload = buildPayload();
      const res = await api.post("/tasks", payload);
      const taskId = res.data.id;

      setIsSending(false);
      // Pass taskId in query params
      router.push(`/logs?taskId=${taskId}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong");
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
                <div className="flex flex-col flex-1">
                  <span className="font-mono text-lg font-bold text-foreground">
                    {activeProject.name}
                  </span>
                  <span className="text-sm text-muted line-clamp-1">
                    {activeProject.description}
                  </span>
                </div>
                <button
                  onClick={() => handleOpenEnvModal(activeProject)}
                  className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background transition-transform hover:scale-105 active:scale-95"
                  title="Environment Variables"
                >
                  <Settings className="h-4 w-4 text-muted hover:text-accent" />
                </button>
              </div>

              {/* Branch Selector (Hidden for Local Projects) */}
              {!activeProject.isLocal && (
                <div className="border-t border-border pt-6">
                  <h3 className="mb-4 text-[10px] font-black tracking-widest text-muted">
                    TARGET BRANCH
                  </h3>

                  <div className="mb-4 flex rounded-xl bg-background p-1">
                    <button
                      onClick={() => setBranchAction("existing")}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 transition-colors ${branchAction === "existing"
                          ? "bg-surface-light text-accent"
                          : "text-muted hover:text-foreground"
                        }`}
                    >
                      <GitBranch className="h-4 w-4" />
                      <span className="text-sm font-semibold">Existing</span>
                    </button>
                    <button
                      onClick={() => setBranchAction("new")}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 transition-colors ${branchAction === "new"
                          ? "bg-surface-light text-accent"
                          : "text-muted hover:text-foreground"
                        }`}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="text-sm font-semibold">New Branch</span>
                    </button>
                  </div>

                  {branchAction === "existing" && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mb-4 rounded-xl border border-warning/30 bg-warning/10 p-3 flex items-start gap-3"
                    >
                      <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                      <div className="flex flex-col text-sm text-warning/90">
                        <span className="font-bold text-warning">Pushing to an existing branch?</span>
                        <span>It's highly recommended to create a new branch for AI tasks so you can safely review changes before merging.</span>
                      </div>
                    </motion.div>
                  )}

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
                      <div className="flex items-center text-xs text-muted ml-1 gap-2 mt-1">
                        <span>Will branch from:</span>
                        <select
                          value={selectedBranch}
                          onChange={(e) => setSelectedBranch(e.target.value)}
                          className="bg-transparent font-mono text-accent outline-none cursor-pointer border-b border-accent/30 focus:border-accent"
                        >
                          {activeProject.branches?.map((b) => (
                            <option key={b} value={b} className="bg-surface text-foreground">
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
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

          {/* Secondary Project (Optional) */}
          <div className="rounded-[24px] border border-border bg-surface p-6 md:p-8 relative">
            <h2 className="text-xl font-bold mb-4 text-foreground">Secondary Repository (Optional)</h2>

            {secondaryProject && (
              <button
                onClick={() => handleOpenEnvModal(secondaryProject)}
                className="absolute top-6 right-6 md:top-8 md:right-8 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background transition-transform hover:scale-105 active:scale-95"
                title="Environment Variables"
              >
                <Settings className="h-4 w-4 text-muted hover:text-accent" />
              </button>
            )}

            <select
              value={secondaryProject?.id || ""}
              onChange={(e) => {
                const p = projects.find(p => p.id === e.target.value);
                setSecondaryProject(p || null);
                if (p) setSecondarySelectedBranch(p.activeBranch || "main");
              }}
              className="w-full bg-background border border-border rounded-xl p-3 text-foreground font-mono"
            >
              <option value="">-- None --</option>
              {projects.filter(p => p.id !== activeProject?.id).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {secondaryProject && (
              <div className="mt-6 border-t border-border pt-6">
                {/* Secondary Branch Selector */}
                <h3 className="mb-4 text-[10px] font-black tracking-widest text-muted">
                  TARGET BRANCH
                </h3>

                <div className="mb-4 flex rounded-xl bg-background p-1">
                  <button
                    onClick={() => setSecondaryBranchAction("existing")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 transition-colors ${secondaryBranchAction === "existing"
                        ? "bg-surface-light text-accent"
                        : "text-muted hover:text-foreground"
                      }`}
                  >
                    <GitBranch className="h-4 w-4" />
                    <span className="text-sm font-semibold">Existing</span>
                  </button>
                  <button
                    onClick={() => setSecondaryBranchAction("new")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 transition-colors ${secondaryBranchAction === "new"
                        ? "bg-surface-light text-accent"
                        : "text-muted hover:text-foreground"
                      }`}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-sm font-semibold">New Branch</span>
                  </button>
                </div>

                {secondaryBranchAction === "existing" ? (
                  <div className="flex items-center gap-2">
                    <div className="relative flex flex-1 items-center gap-3 rounded-xl border border-border bg-background px-4 h-14">
                      <GitBranch className="h-4 w-4 text-accent" />
                      <select
                        value={secondarySelectedBranch}
                        onChange={(e) => setSecondarySelectedBranch(e.target.value)}
                        className="flex-1 appearance-none bg-transparent font-mono text-sm font-semibold text-foreground outline-none cursor-pointer"
                      >
                        {[...new Set<string>(projects.find(p => p.id === secondaryProject.id)?.branches || secondaryProject.branches || [])].map((b: string) => (
                          <option key={b} value={b} className="bg-surface text-foreground">
                            {b}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="h-4 w-4 text-muted pointer-events-none" />
                    </div>
                    <button
                      onClick={() => {
                        const owner = secondaryProject.owner || secondaryProject.repoUrl?.split("github.com/")[1]?.split("/")[0];
                        if (owner) refreshBranches(owner, secondaryProject.name, secondaryProject.id);
                      }}
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-surface transition-transform hover:scale-105 active:scale-95"
                      title="Refresh Branches"
                    >
                      <RefreshCw className="h-4 w-4 text-muted" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-background px-4 h-14 focus-within:border-accent">
                      <GitBranch className="h-4 w-4 text-accent" />
                      <input
                        type="text"
                        placeholder="feature/my-new-branch"
                        value={secondaryNewBranchName}
                        onChange={(e) => setSecondaryNewBranchName(e.target.value)}
                        className="flex-1 bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted"
                      />
                    </div>
                    <div className="flex items-center text-xs text-muted ml-1 gap-2 mt-1">
                      <span>Will branch from:</span>
                      <select
                        value={secondarySelectedBranch}
                        onChange={(e) => setSecondarySelectedBranch(e.target.value)}
                        className="bg-transparent font-mono text-accent outline-none cursor-pointer border-b border-accent/30 focus:border-accent"
                      >
                        {[...new Set<string>(projects.find(p => p.id === secondaryProject.id)?.branches || secondaryProject.branches || [])].map((b: string) => (
                          <option key={b} value={b} className="bg-surface text-foreground">
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

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
                    const newProviderId = e.target.value;
                    setProviderId(newProviderId);
                    const prov = availableProviders.find(p => p.providerId === newProviderId);
                    if (prov && prov.models.length > 0) {
                      setSelectedModel(prov.models[0].id);
                      saveSelectedModel(newProviderId, prov.models[0].id);
                    }
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
                  onChange={(e) => {
                    setSelectedModel(e.target.value);
                    saveSelectedModel(providerId, e.target.value);
                  }}
                  className="flex-1 appearance-none bg-transparent text-sm font-semibold text-foreground outline-none cursor-pointer"
                >
                  {availableProviders.find(p => p.providerId === providerId)?.models.map((m: any) => (
                    <option key={m.id} value={m.id} disabled={m.locked} className="bg-surface text-foreground disabled:text-muted disabled:opacity-40">
                      {m.name} {m.locked ? `(🔒 Requires ${m.requiredTier?.toUpperCase()} Plan)` : ''}
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
              
              <div className="mt-4 flex flex-wrap gap-2">
                {attachments.map((url, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
                    <img src={url} alt="upload" className="h-16 w-16 object-cover" />
                    <button 
                      onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 bg-black/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept="image/*"
                  />
                  <label 
                    htmlFor="file-upload" 
                    className="cursor-pointer flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                    <span>Attach Image</span>
                  </label>
                </div>
              </div>
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
              disabled={
                !activeProject ||
                (branchAction === "new" && !newBranchName.trim()) ||
                (!!secondaryProject && secondaryBranchAction === "new" && !secondaryNewBranchName.trim()) ||
                (!instruction.trim() && branchAction !== "new" && (!secondaryProject || secondaryBranchAction !== "new")) ||
                isSending
              }
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

      {/* Env Variables Modal */}
      <AnimatePresence>
        {showEnvModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEnvModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-[24px] border border-border bg-surface shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border p-6">
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold text-foreground">Environment Variables</h2>
                  <span className="text-sm text-muted font-mono mt-1">{envProjectInfo?.owner}/{envProjectInfo?.name}</span>
                </div>
                <button
                  onClick={() => setShowEnvModal(false)}
                  className="rounded-xl p-2 text-muted hover:bg-background hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4 rounded-xl border border-accent/20 bg-accent/5 p-4 text-sm text-accent">
                  Variables added here will be securely injected into the AI workspace at runtime (e.g. into a .env file).
                  Do not paste sensitive production keys if not needed.
                  <br /><br />
                  <span className="font-bold">Note for Local Projects:</span> Your <code>.env</code> file may be automatically detected upon upload. Otherwise, add your variables here.
                </div>
                <div className="relative">
                  {isLoadingEnv && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/50 backdrop-blur-sm rounded-xl">
                      <RefreshCw className="h-6 w-6 animate-spin text-accent" />
                    </div>
                  )}
                  <textarea
                    value={envContent}
                    onChange={(e) => setEnvContent(e.target.value)}
                    placeholder="DATABASE_URL=postgres://...\nAPI_KEY=123..."
                    className="h-[300px] w-full resize-none rounded-xl border border-border bg-background p-4 font-mono text-sm text-foreground outline-none focus:border-accent"
                    spellCheck={false}
                  />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowEnvModal(false)}
                    className="rounded-xl px-6 py-2.5 text-sm font-bold text-muted hover:bg-background"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEnv}
                    disabled={isSavingEnv}
                    className="flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
                  >
                    {isSavingEnv ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Variables"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
