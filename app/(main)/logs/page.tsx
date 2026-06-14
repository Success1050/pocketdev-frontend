"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, Trash2, Folder, GitBranch, Cpu, MessageSquare, 
  CheckCircle2, XCircle, Globe, GitPullRequest, TerminalSquare, Eye,
  RefreshCw, Radio
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";
import { useProject } from "@/context/ProjectContext";
import api from "@/lib/axios";
import ReactMarkdown from 'react-markdown';

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

  useEffect(() => {
    if (task?.status === "awaiting-approval") setActiveTab("plan");
  }, [task?.status]);

  useEffect(() => {
    if (!effectiveTaskId) return;

    let interval: NodeJS.Timeout;

    const fetchTask = async () => {
      try {
        const res = await api.get(`/tasks/${effectiveTaskId}`);
        const data: TaskData = res.data;
        setTask(data);
        setLogs(data.taskLogs || []);

        if (data.status === "completed" || data.status === "failed") {
          setIsPolling(false);
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Failed to fetch task:", err);
      }
    };

    fetchTask();
    interval = setInterval(fetchTask, 2000);

    return () => clearInterval(interval);
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
      alert("Failed to clear logs");
    }
  };

  const handleApprovePlan = async () => {
    try {
      await api.post(`/tasks/${effectiveTaskId}/approve-plan`);
      setActiveTab("logs");
    } catch (err) {
      alert("Failed to approve plan");
    }
  };

  const handleRejectPlan = async () => {
    const feedback = prompt("Please provide instructions on how to improve the plan:");
    if (!feedback) return;
    try {
      await api.post(`/tasks/${effectiveTaskId}/feedback`, { feedback });
      setActiveTab("logs");
    } catch (err) {
      alert("Failed to send feedback");
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

  const getStatusLabel = () => {
    switch (task?.status) {
      case "pending": return "Queued";
      case "in-progress": return "Executing...";
      case "completed": return "Completed";
      case "failed": return "Failed";
      default: return "Connecting...";
    }
  };

  const getStatusColor = () => {
    switch (task?.status) {
      case "completed": return "var(--color-accent)";
      case "failed": return "var(--color-danger, #FF4757)";
      case "in-progress": return "var(--color-brand-blue)";
      default: return "var(--color-muted)";
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const finalPreviewUrl = activeProject?.homepage || task?.previewUrl;

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

          <button
            onClick={handleClearLogs}
            disabled={!effectiveTaskId}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(255,71,87,0.2)] bg-[rgba(255,71,87,0.1)] transition-transform hover:scale-105 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Trash2 className="h-4 w-4 text-[#FF4757]" />
          </button>
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

            {logs.map((log) => (
              <div key={log.id} className="flex gap-4 items-start">
                <span className="shrink-0 text-[#444] text-xs mt-0.5">
                  {formatTime(log.createdAt)}
                </span>
                <span className={`flex-1 break-words leading-relaxed ${getLogColor(log.type)}`}>
                  {log.message}
                </span>
              </div>
            ))}

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
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border flex items-center justify-end gap-3">
                <button 
                  onClick={handleRejectPlan}
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
               src={task?.previewUrl || ""} 
               className="w-full h-full bg-white rounded-2xl" 
               title="Live Preview" 
            />
            {task?.status !== 'completed' && task?.status !== 'failed' && (
               <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-background/90 backdrop-blur border border-border rounded-full text-xs font-semibold text-accent shadow-xl flex items-center gap-2">
                 <RefreshCw className="h-3 w-3 animate-spin" />
                 Preview updating live...
               </div>
            )}
          </div>
        )}

      </div>
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
