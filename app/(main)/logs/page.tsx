"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, Trash2, Folder, GitBranch, Cpu, MessageSquare, 
  CheckCircle2, XCircle, Globe, GitPullRequest, TerminalSquare, Eye,
  RefreshCw, Radio, X, Paperclip, Loader2
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";
import { useProject } from "@/context/ProjectContext";
import api from "@/lib/axios";
import ReactMarkdown from 'react-markdown';
import { toast } from "react-hot-toast";
import { io, Socket } from 'socket.io-client';

type LogEntry = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
};

type TaskData = {
  id: string;
  description: string;
  status: string;
  repoName: string | null;
  branchName: string | null;
  llmProvider: string | null;
  llmModel: string | null;
  previewUrl: string | null;
  plan: string | null;
  diff: string | null;
  taskLogs: LogEntry[];
  isLocal?: boolean;
};

function LogsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams?.get("taskId");
  const { activeProject } = useProject();

  const [task, setTask] = useState<TaskData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPolling, setIsPolling] = useState(true);
  const [activeTab, setActiveTab] = useState<"logs" | "plan" | "diff" | "preview">("logs");
  const [effectiveTaskId, setEffectiveTaskId] = useState<string | null>(null);
  
  const [refinementInstruction, setRefinementInstruction] = useState("");
  const [isSubmittingRefinement, setIsSubmittingRefinement] = useState(false);
  const [isProvidingFeedback, setIsProvidingFeedback] = useState(false);
  const [planFeedbackText, setPlanFeedbackText] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);


  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishRepoName, setPublishRepoName] = useState("");
  const [isPublishPrivate, setIsPublishPrivate] = useState(false);
  const [isSubmittingPublish, setIsSubmittingPublish] = useState(false);

  const handlePublishToGithub = async () => {
    if (!publishRepoName.trim() || !effectiveTaskId) return;
    setIsSubmittingPublish(true);
    const toastId = toast.loading("Publishing to GitHub...");
    try {
      await api.post(`/tasks/${effectiveTaskId}/publish-github`, {
        repoName: publishRepoName.trim(),
        isPrivate: isPublishPrivate
      });
      toast.success("Successfully published to GitHub!", { id: toastId });
      setIsPublishModalOpen(false);
      setTask(prev => prev ? { ...prev, status: "completed" } : prev);
      router.push("/projects");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to publish", { id: toastId });
      console.error(err);
    } finally {
      setIsSubmittingPublish(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      setEffectiveTaskId(taskId);
      localStorage.setItem("activeTaskId", taskId);
    } else {
      const stored = localStorage.getItem("activeTaskId");
      if (stored) {
        setEffectiveTaskId(stored);
      }
    }
  }, [taskId]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const hasAutoSwitchedToPreview = useRef(false);

  useEffect(() => {
    if (task?.status === "awaiting-approval") setActiveTab("plan");
  }, [task?.status]);

  useEffect(() => {
    if (task?.previewUrl && !hasAutoSwitchedToPreview.current && activeTab !== "preview") {
      setActiveTab("preview");
      hasAutoSwitchedToPreview.current = true;
    }
  }, [task?.previewUrl, activeTab]);

  useEffect(() => {
    hasAutoSwitchedToPreview.current = false;
  }, [effectiveTaskId]);

  useEffect(() => {
    if (!effectiveTaskId) return;

    let socket: Socket;

    const fetchTaskAndConnect = async () => {
      try {
        const res = await api.get(`/tasks/${effectiveTaskId}`);
        const data: TaskData = res.data;
        setTask(data);
        setLogs(data.taskLogs || []);

        if (data.status === "completed" || data.status === "failed" || data.status === "cancelled" || data.status === "awaiting-review") {
          setIsPolling(false);
        } else {
          setIsPolling(true);
          
          socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
          
          socket.on('connect', async () => {
            socket.emit('joinTask', effectiveTaskId);
            
            // Refetch to catch any events missed between initial fetch and socket connection
            try {
              const freshRes = await api.get(`/tasks/${effectiveTaskId}`);
              const freshData = freshRes.data;
              setTask(freshData);
              setLogs(freshData.taskLogs || []);
              if (["completed", "failed", "cancelled", "awaiting-review"].includes(freshData.status)) {
                 setIsPolling(false);
              }
            } catch (err) {
              console.error("Failed to refetch after connect:", err);
            }
          });

          socket.on('logAdded', (log: LogEntry) => {
            setLogs((prev) => {
              // Prevent duplicates if API returned it while connecting
              if (prev.find(l => l.id === log.id)) return prev;
              return [...prev, log];
            });
          });

          socket.on('taskUpdated', (updatedTask: TaskData) => {
            setTask(updatedTask);
            if (updatedTask.status === "completed" || updatedTask.status === "failed" || updatedTask.status === "cancelled" || updatedTask.status === "awaiting-review") {
               setIsPolling(false);
            }
          });
        }
      } catch (err) {
        console.error("Failed to fetch task:", err);
      }
    };

    fetchTaskAndConnect();

    return () => {
      if (socket) {
        socket.emit('leaveTask', effectiveTaskId);
        socket.disconnect();
      }
    };
  }, [effectiveTaskId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length]);

  const handleClearLogs = async () => {
    const confirmed = confirm("Are you sure you want to clear all logs for this task?");
    if (!confirmed) return;

    try {
      await api.delete(`/tasks/${effectiveTaskId}/logs`);
      setLogs([]);
    } catch (err) {
      console.error("Failed to clear logs:", err);
      toast.error("Failed to clear logs");
    }
  };

  const handleApprovePlan = async () => {
    try {
      await api.post(`/tasks/${effectiveTaskId}/approve-plan`);
      setTask(prev => prev ? { ...prev, status: 'in-progress' } : prev);
      setActiveTab("logs");
    } catch (err) {
      toast.error("Failed to approve plan");
    }
  };

  const submitPlanFeedback = async () => {
    if (!planFeedbackText.trim()) return;
    try {
      await api.post(`/tasks/${effectiveTaskId}/feedback`, { feedback: planFeedbackText });
      setTask(prev => prev ? { ...prev, status: 'plan-rejected' } : prev);
      toast.success("Feedback sent");
      setIsProvidingFeedback(false);
      setPlanFeedbackText("");
    } catch (e) {
      toast.error("Failed to send feedback");
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case "success": return "text-accent";
      case "warning": return "text-warning";
      case "error": return "text-danger";
      case "process": return "text-brand-blue";
      default: return "text-[#D4D4D4]";
    }
  };

  const handleCancelTask = async () => {
    const confirmed = confirm("Are you sure you want to stop this task? It will terminate immediately.");
    if (!confirmed) return;

    try {
      await api.post(`/tasks/${effectiveTaskId}/cancel`);
      toast.success("Task cancelled");
    } catch (err) {
      console.error("Failed to cancel task:", err);
      toast.error("Failed to cancel task");
    }
  };

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

  const handleRefine = async () => {
    if (!refinementInstruction.trim()) return;
    setIsSubmittingRefinement(true);
    try {
      await api.post(`/tasks/${effectiveTaskId}/refine`, { 
        instruction: refinementInstruction,
        attachments: attachments,
      });
      setRefinementInstruction("");
      setAttachments([]);
      toast.success("Refinement started...");
      setTask(prev => prev ? { ...prev, status: 'in-progress' } : prev);
      setActiveTab("logs");
      setIsPolling(true);
    } catch (e) {
      toast.error("Failed to start refinement");
    } finally {
      setIsSubmittingRefinement(false);
    }
  };

  const handleCommit = async () => {
    try {
      await api.post(`/tasks/${effectiveTaskId}/commit`);
      toast.success("Pushing changes...");
      setTask(prev => prev ? { ...prev, status: 'pushing' } : prev);
      setIsPolling(true);
    } catch (e) {
      toast.error("Failed to commit");
    }
  };

  const handleDiscard = async () => {
    const confirmed = confirm("Are you sure you want to discard these changes?");
    if (!confirmed) return;
    try {
      await api.post(`/tasks/${effectiveTaskId}/discard`);
      toast.success("Changes discarded");
      setTask(prev => prev ? { ...prev, status: 'cancelled' } : prev);
    } catch (e) {
      toast.error("Failed to discard");
    }
  };

  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [targetMergeBranch, setTargetMergeBranch] = useState("main");
  const [isMerging, setIsMerging] = useState(false);

  const handleMerge = async () => {
    if (!effectiveTaskId) return;
    setIsMerging(true);
    try {
      await api.post(`/tasks/${effectiveTaskId}/merge`, { targetBranch: targetMergeBranch });
      toast.success(`Merging into ${targetMergeBranch}...`);
      setIsMergeModalOpen(false);
      // Let the polling handle the state update to in-progress for the conflict resolution / merge action
    } catch (e) {
      toast.error("Failed to initiate merge");
    } finally {
      setIsMerging(false);
    }
  };

  const getStatusLabel = () => {
    switch (task?.status) {
      case "pending": return "Queued";
      case "in-progress": return "Executing...";
      case "completed": return "Completed";
      case "failed": return "Failed";
      case "awaiting-approval": return "Awaiting Approval";
      case "awaiting-review": return "Awaiting Review";
      case "pushing": return "Pushing...";
      case "cancelled": return "Cancelled";
      default: return "Connecting...";
    }
  };

  const getStatusColor = () => {
    switch (task?.status) {
      case "completed": return "var(--color-accent)";
      case "failed": return "var(--color-danger, #FF4757)";
      case "in-progress": return "var(--color-brand-blue)";
      case "awaiting-review": return "var(--color-warning, #FEBC2E)";
      case "pushing": return "var(--color-brand-purple, #A78BFA)";
      default: return "var(--color-muted)";
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const finalPreviewUrl = task?.previewUrl || activeProject?.homepage;

  return (
    <div className="relative flex min-h-screen flex-col bg-background pb-32">
      <div className="relative z-10 px-4 pt-12 md:px-8 md:pt-16 lg:px-12 max-w-5xl mx-auto w-full h-screen flex flex-col">
        {/* Header */}
        <header className="mb-6 flex items-center gap-4 shrink-0">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface transition-transform hover:scale-105"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          
          <div className="flex-1">
            <h1 className="text-xl font-extrabold text-foreground md:text-2xl">
              Task Execution
            </h1>
            <div className="mt-1 flex items-center gap-2">
              {isPolling ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: getStatusColor() }}
                />
              ) : (
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: getStatusColor() }} />
              )}
              <span className="text-xs font-semibold" style={{ color: getStatusColor() }}>
                {getStatusLabel()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(task?.status === "pending" || task?.status === "in-progress" || task?.status === "awaiting-approval") && (
              <button
                onClick={handleCancelTask}
                disabled={!effectiveTaskId}
                className="flex h-10 px-3 items-center justify-center gap-2 rounded-xl border border-[rgba(255,71,87,0.2)] bg-[rgba(255,71,87,0.1)] transition-transform hover:scale-105 disabled:opacity-50 disabled:pointer-events-none"
              >
                <XCircle className="h-4 w-4 text-[#FF4757]" />
                <span className="text-sm font-semibold text-[#FF4757]">Stop</span>
              </button>
            )}
            
            <button
              onClick={handleClearLogs}
              disabled={!effectiveTaskId}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(255,71,87,0.2)] bg-[rgba(255,71,87,0.1)] transition-transform hover:scale-105 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Trash2 className="h-4 w-4 text-[#FF4757]" />
            </button>
          </div>
        </header>

        {/* Task Info Card */}
        {task && (
          <div className="mb-6 shrink-0 rounded-2xl border border-border bg-surface p-4">
            <div className="flex flex-col md:flex-row md:flex-wrap gap-x-8 gap-y-3">
              <div className="flex items-center gap-2.5">
                <Folder className="h-4 w-4 text-accent" />
                <span className="font-mono text-sm font-semibold text-text-dim">
                  {task.repoName || "Unknown Repo"}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <GitBranch className="h-4 w-4 text-brand-blue" />
                <span className="font-mono text-sm font-semibold text-text-dim">
                  {task.branchName || "main"}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Cpu className="h-4 w-4 text-brand-purple" />
                <span className="font-mono text-sm font-semibold text-text-dim">
                  {task.llmProvider} — {task.llmModel}
                </span>
              </div>
            </div>
            
            <div className="mt-4 border-t border-border pt-4 flex items-start gap-2.5">
              <MessageSquare className="h-4 w-4 text-muted mt-0.5 shrink-0" />
              <span className="text-sm text-muted line-clamp-2 leading-relaxed">
                {task.description}
              </span>
            </div>
          </div>
        )}

        {/* Tabs */}
        {task && (
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-px overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab("logs")}
              className={`whitespace-nowrap px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === "logs" ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"}`}
            >
              Logs
            </button>
            {(task.plan || task.status === 'awaiting-approval') && (
              <button
                onClick={() => setActiveTab("plan")}
                className={`whitespace-nowrap px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === "plan" ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"}`}
              >
                Implementation Plan
                {task.status === "awaiting-approval" && <span className="flex h-2 w-2 rounded-full bg-warning animate-pulse" />}
              </button>
            )}
            {task.diff && (
              <button
                onClick={() => setActiveTab("diff")}
                className={`whitespace-nowrap px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === "diff" ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"}`}
              >
                Code Diff
              </button>
            )}
            {task.previewUrl && (
              <button
                onClick={() => setActiveTab("preview")}
                className={`whitespace-nowrap px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === "preview" ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"}`}
              >
                Live Preview
              </button>
            )}
          </div>
        )}

        {/* Content Area */}
        {activeTab === "logs" && (
          <div className="flex-1 overflow-hidden rounded-2xl border border-border bg-[#0A0A0C] flex flex-col">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 md:p-6 font-mono text-sm flex flex-col gap-3"
          >
            {!effectiveTaskId && (
              <div className="flex h-full items-center justify-center text-muted italic">
                No active task to display.
              </div>
            )}
            {effectiveTaskId && logs.length === 0 && isPolling && (
              <div className="flex h-full items-center justify-center text-muted">
                Waiting for logs...
              </div>
            )}

            {logs.map((log) => {
              const isCommand = log.message.startsWith("> ");
              const isOutput = log.message.startsWith("Tool output:");
              const isReasoning = log.message.startsWith("AI Reasoning:");

              return (
                <div key={log.id} className="flex gap-4 items-start">
                  <span className="shrink-0 text-[#444] text-xs mt-1">
                    {formatTime(log.createdAt)}
                  </span>
                  
                  {isCommand ? (
                    <div className="flex-1 bg-[#1A1A24] border border-[#2A2A35] rounded-md px-3 py-2 mb-2 font-mono text-[13px] text-[#61AFEF] shadow-inner break-all">
                      <span className="text-[#5C6370] mr-2 font-bold">$</span>
                      {log.message.substring(2)}
                    </div>
                  ) : isOutput ? (
                    <div className="flex-1 bg-[#0D0D12] border border-[#1F1F2E] rounded-md px-3 py-2.5 mb-3 font-mono text-[13px] text-[#ABB2BF] shadow-sm overflow-x-auto whitespace-pre-wrap">
                      <div className="text-[#5C6370] text-[11px] uppercase tracking-widest mb-1.5 font-bold flex items-center gap-2">
                        <TerminalSquare className="h-3 w-3" />
                        Output
                      </div>
                      {log.message.substring(12).trim() || "Empty output"}
                    </div>
                  ) : isReasoning ? (
                    <div className="flex-1 bg-brand-purple/10 border border-brand-purple/20 rounded-md px-3 py-2.5 mb-3 font-mono text-[13px] text-[#D4D4D4] shadow-sm overflow-x-auto whitespace-pre-wrap">
                      <div className="text-brand-purple text-[11px] uppercase tracking-widest mb-1.5 font-bold flex items-center gap-2">
                        <Cpu className="h-3 w-3" />
                        AI Reasoning
                      </div>
                      <div className="text-[#ABB2BF] leading-relaxed">
                        {log.message.substring(13).trim()}
                      </div>
                    </div>
                  ) : (
                    <span className={`flex-1 break-words leading-relaxed mt-0.5 ${getLogColor(log.type)}`}>
                      {log.message}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Success Banner */}
            <AnimatePresence>
              {task?.status === "completed" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="mt-8 flex flex-col items-center rounded-[20px] border border-accent/30 bg-accent-dim p-8 text-center"
                >
                  <CheckCircle2 className="mb-4 h-16 w-16 text-accent" />
                  <h3 className="mb-2 text-2xl font-extrabold text-accent">Task successful ✅</h3>
                  <p className="mb-6 text-[15px] text-text-dim">
                    All changes have been pushed to <span className="font-bold text-accent">{task.branchName || "your branch"}</span>
                  </p>

                  {finalPreviewUrl && (
                    <button
                      onClick={() => router.push(`/preview?url=${encodeURIComponent(finalPreviewUrl)}&branch=${task.branchName || ""}`)}
                      className="mb-8 flex items-center gap-3 rounded-xl bg-accent px-6 py-3.5 transition-transform hover:scale-105 active:scale-95"
                    >
                      <Globe className="h-5 w-5 text-background" />
                      <span className="text-[15px] font-bold text-background">Open Live Preview</span>
                    </button>
                  )}

                  <div className="w-full max-w-md rounded-xl border border-border bg-background p-5 text-left">
                    <h4 className="mb-4 text-sm font-bold text-foreground">How to see your changes:</h4>
                    <ul className="flex flex-col gap-3">
                      <li className="flex items-start gap-3">
                        <GitPullRequest className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                        <span className="text-[13px] leading-relaxed text-text-dim">
                          Pull the <span className="font-mono text-accent">{task.branchName}</span> branch
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <TerminalSquare className="h-4 w-4 text-brand-blue shrink-0 mt-0.5" />
                        <span className="text-[13px] leading-relaxed text-text-dim">
                          Run <span className="font-mono text-brand-blue">npm run dev</span> locally
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Eye className="h-4 w-4 text-brand-purple shrink-0 mt-0.5" />
                        <span className="text-[13px] leading-relaxed text-text-dim">
                          Review the AI's changes and merge when ready
                        </span>
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Failure Banner */}
            <AnimatePresence>
              {task?.status === "failed" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="mt-8 flex flex-col items-center rounded-[20px] border border-[rgba(255,71,87,0.3)] bg-[rgba(255,71,87,0.08)] p-8 text-center"
                >
                  <XCircle className="mb-4 h-16 w-16 text-[#FF4757]" />
                  <h3 className="mb-2 text-2xl font-extrabold text-[#FF4757]">Task unsuccessful ❌</h3>
                  <p className="mb-6 text-[15px] text-muted">Check the logs above for error details.</p>

                  <button
                    onClick={() => router.push("/instruction")}
                    className="flex items-center gap-3 rounded-xl bg-[#FF4757] px-6 py-3.5 transition-transform hover:scale-105 active:scale-95"
                  >
                    <RefreshCw className="h-5 w-5 text-background" />
                    <span className="text-[15px] font-bold text-background">Try Again</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Terminal Footer */}
          <div className="flex shrink-0 items-center gap-3 border-t border-border bg-surface px-6 py-4">
            {isPolling ? (
              <>
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Radio className="h-4 w-4 text-accent" />
                </motion.div>
                <span className="text-xs font-mono text-muted">Watching task execution...</span>
              </>
            ) : (
              <>
                <span className="text-xs font-mono" style={{ color: getStatusColor() }}>
                  {task?.status === "completed" ? "Execution finished" : "Execution stopped"}
                </span>
              </>
            )}
          </div>
        </div>
        )}

        {activeTab === "plan" && (
          <div className="flex-1 overflow-hidden rounded-2xl border border-border bg-surface flex flex-col relative">
            <div className="flex-1 overflow-y-auto p-6 pb-24 prose prose-invert prose-sm md:prose-base max-w-none whitespace-pre-wrap leading-relaxed">
              <ReactMarkdown>{task?.plan || "Generating plan..."}</ReactMarkdown>
            </div>
            {task?.status === "awaiting-approval" && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border flex flex-col gap-3">
                {isProvidingFeedback ? (
                  <div className="flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 shadow-2xl animate-in slide-in-from-bottom-2">
                    <MessageSquare className="h-5 w-5 text-brand-blue shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      value={planFeedbackText}
                      onChange={(e) => setPlanFeedbackText(e.target.value)}
                      placeholder="Please provide instructions on how to improve the plan..."
                      className="w-full bg-transparent p-2 text-sm text-foreground outline-none placeholder:text-muted"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitPlanFeedback();
                        if (e.key === 'Escape') setIsProvidingFeedback(false);
                      }}
                    />
                    <button
                      onClick={() => setIsProvidingFeedback(false)}
                      className="shrink-0 px-3 py-1.5 text-sm font-bold text-muted transition-colors hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitPlanFeedback}
                      disabled={!planFeedbackText.trim()}
                      className="shrink-0 rounded-lg bg-brand-blue/20 px-4 py-1.5 text-sm font-bold text-brand-blue transition-colors hover:bg-brand-blue/30 disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-3 w-full">
                    <button 
                      onClick={() => setIsProvidingFeedback(true)}
                      className="px-6 py-2.5 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-surface-light transition-colors"
                    >
                      Provide Feedback
                    </button>
                    <button 
                      onClick={handleApprovePlan}
                      className="px-6 py-2.5 rounded-xl bg-accent text-sm font-bold text-background hover:scale-105 transition-transform"
                    >
                      Approve & Execute
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "diff" && (
          <div className="flex-1 overflow-hidden rounded-2xl border border-border bg-[#0A0A0C] flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 font-mono text-sm whitespace-pre-wrap custom-scrollbar">
              {task?.diff ? (
                task.diff.split('\n').map((line, i) => {
                  if (line.startsWith('+') && !line.startsWith('+++')) {
                    return <div key={i} className="text-[#28C840] bg-[#28C840]/10 px-2 -mx-2">{line}</div>;
                  }
                  if (line.startsWith('-') && !line.startsWith('---')) {
                    return <div key={i} className="text-[#FF4757] bg-[#FF4757]/10 px-2 -mx-2">{line}</div>;
                  }
                  if (line.startsWith('@@')) {
                    return <div key={i} className="text-[#FEBC2E] my-2 px-2 -mx-2">{line}</div>;
                  }
                  if (line.startsWith('diff') || line.startsWith('index') || line.startsWith('---') || line.startsWith('+++')) {
                    return <div key={i} className="text-muted font-bold px-2 -mx-2">{line}</div>;
                  }
                  return <div key={i} className="text-[#D4D4D4] px-2 -mx-2">{line}</div>;
                })
              ) : (
                <div className="text-[#D4D4D4]">No code changes detected.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "preview" && (
          <div className="flex-1 overflow-hidden rounded-2xl border border-border bg-surface flex flex-col relative">
            <iframe 
               key={`preview-${task?.status}`}
               src={task?.status === 'in-progress' && (!taskId || !task.previewUrl?.includes(taskId)) ? "" : (task?.previewUrl || "")}
               className="w-full h-full bg-white rounded-2xl" 
               title="Live Preview" 
            />
            {task?.status === 'in-progress' && !task?.diff && (
               <div className="absolute inset-0 z-10 bg-surface/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
                 <Loader2 className="h-8 w-8 animate-spin text-brand-blue mb-4" />
                 <p className="text-foreground font-medium text-lg">AI is executing the plan...</p>
                 <p className="text-sm text-muted mt-2 max-w-sm text-center">The Dev Server will boot up shortly after code modifications are finished. Live Preview will appear here once ready.</p>
               </div>
            )}
            {task?.status === 'in-progress' && task?.diff && (
               <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-background/90 backdrop-blur border border-border rounded-full text-xs font-semibold text-accent shadow-xl flex items-center gap-2">
                 <RefreshCw className="h-3 w-3 animate-spin" />
                 Preview updating live...
               </div>
            )}
          </div>
        )}

      </div>

      {/* Review & Refine Global Footer */}
      <AnimatePresence>
        {task?.status === "awaiting-review" && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl p-4 shadow-2xl"
          >
            <div className="mx-auto flex max-w-5xl flex-col gap-4">
              {/* Attachments Display */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 px-2">
                  {attachments.map((url, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
                      <img src={url} alt="upload" className="h-12 w-12 object-cover" />
                      <button 
                        onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                        className="absolute top-0.5 right-0.5 bg-black/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex w-full flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2">
                  <input
                    type="file"
                    id="refine-file-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept="image/*"
                  />
                  <label 
                    htmlFor="refine-file-upload" 
                    className="cursor-pointer flex items-center justify-center p-2 text-muted hover:text-foreground transition-colors"
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                  </label>

                  <MessageSquare className="h-5 w-5 text-brand-blue shrink-0" />
                  <input
                    type="text"
                    value={refinementInstruction}
                    onChange={(e) => setRefinementInstruction(e.target.value)}
                    placeholder="Not quite right? Ask the AI to change something..."
                    className="w-full bg-transparent p-2 text-sm text-foreground outline-none placeholder:text-muted"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRefine();
                    }}
                    disabled={isSubmittingRefinement}
                  />
                  <button
                    onClick={handleRefine}
                    disabled={!refinementInstruction.trim() || isSubmittingRefinement}
                    className="shrink-0 rounded-lg bg-brand-blue/20 px-4 py-1.5 text-sm font-bold text-brand-blue transition-colors hover:bg-brand-blue/30 disabled:opacity-50"
                  >
                    Refine
                  </button>
                </div>

                <div className="flex w-full shrink-0 items-center gap-3 md:w-auto">
                <button
                  onClick={handleDiscard}
                  className="flex-1 rounded-xl border border-border px-6 py-3 text-sm font-bold text-foreground transition-colors hover:bg-surface-light md:flex-none"
                >
                  Discard
                </button>
                {task?.isLocal ? (
                  <>
                    <button
                      onClick={() => window.location.href = `http://localhost:3001/tasks/${taskId}/download`}
                      className="flex-1 rounded-xl border border-accent/50 bg-accent/10 px-6 py-3 text-sm font-bold text-accent transition-colors hover:bg-accent/20 md:flex-none"
                    >
                      Download ZIP
                    </button>
                    <button
                      onClick={() => setIsPublishModalOpen(true)}
                      className="flex-1 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-background transition-transform hover:scale-105 md:flex-none"
                    >
                      Publish to GitHub
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCommit}
                      className="flex-1 rounded-xl border border-accent/50 bg-accent/10 px-6 py-3 text-sm font-bold text-accent transition-colors hover:bg-accent/20 md:flex-none"
                    >
                      Push to Branch
                    </button>
                    <button
                      onClick={() => setIsMergeModalOpen(true)}
                      className="flex-1 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-background transition-transform hover:scale-105 md:flex-none"
                    >
                      Merge into...
                    </button>
                  </>
                )}
              </div>
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Publish to GitHub Modal */}
      <AnimatePresence>
        {isPublishModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border p-6">
                <h3 className="text-xl font-bold text-foreground">Publish to GitHub</h3>
                <button
                  onClick={() => setIsPublishModalOpen(false)}
                  className="rounded-lg p-2 text-muted hover:bg-surface-light hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted">Repository Name</label>
                  <input
                    type="text"
                    value={publishRepoName}
                    onChange={(e) => setPublishRepoName(e.target.value)}
                    placeholder="my-awesome-project"
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground font-mono focus:border-accent outline-none"
                  />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <input 
                    type="checkbox" 
                    id="isPrivate" 
                    checked={isPublishPrivate} 
                    onChange={(e) => setIsPublishPrivate(e.target.checked)}
                    className="w-4 h-4 accent-accent"
                  />
                  <label htmlFor="isPrivate" className="text-sm font-bold text-foreground cursor-pointer">Make Repository Private</label>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-border p-6 bg-surface-light">
                <button
                  onClick={() => setIsPublishModalOpen(false)}
                  className="rounded-xl px-6 py-2.5 text-sm font-bold text-foreground hover:bg-surface"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublishToGithub}
                  disabled={!publishRepoName.trim() || isSubmittingPublish}
                  className="flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-background transition-transform hover:scale-105 disabled:opacity-50"
                >
                  {isSubmittingPublish ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitBranch className="h-4 w-4" />}
                  Publish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMergeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border p-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <GitPullRequest className="h-5 w-5 text-accent" />
                  Merge Task
                </h3>
                <button
                  onClick={() => setIsMergeModalOpen(false)}
                  className="rounded-lg p-1 text-muted hover:bg-surface hover:text-foreground"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 flex items-start gap-3">
                  <div className="flex flex-col text-sm text-warning/90">
                    <span className="font-bold text-warning mb-1">Before you merge...</span>
                    <span>You are about to merge these code changes into <strong className="font-mono">{targetMergeBranch}</strong>. Have you thoroughly reviewed the Live Preview? This action will apply these changes directly to your selected branch and push them to GitHub.</span>
                    <span className="mt-2 text-xs opacity-80">Note: If there are merge conflicts, PocketDev AI will automatically attempt to resolve them for you.</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">Target Branch to Merge Into</label>
                  <div className="relative flex items-center gap-3 rounded-xl border border-border bg-surface px-4 h-12">
                    <GitBranch className="h-4 w-4 text-accent" />
                    <input
                      type="text"
                      value={targetMergeBranch}
                      onChange={(e) => setTargetMergeBranch(e.target.value)}
                      placeholder="e.g. main, master, staging"
                      className="w-full bg-transparent text-sm font-medium text-foreground outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border bg-surface p-4">
                <button
                  onClick={() => setIsMergeModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-bold text-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMerge}
                  disabled={isMerging || !targetMergeBranch}
                  className="rounded-xl bg-accent px-6 py-2 text-sm font-bold text-background transition-transform hover:scale-105 disabled:opacity-50 flex items-center gap-2"
                >
                  {isMerging ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                  Confirm Merge
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function LogsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">Loading logs...</div>}>
      <LogsContent />
    </Suspense>
  );
}
