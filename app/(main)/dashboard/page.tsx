"use client";

import { motion } from "framer-motion";
import {
  Bell, ChevronDown, Folder, PlusCircle, Rocket,
  GitCompare, TerminalSquare, LogOut, CheckCircle2,
  XCircle, FileText, GitBranch
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useProject } from "@/context/ProjectContext";
import { useNotifications } from "@/context/NotificationContext";
import { clearAuthData, getAuthToken, getUserId } from "@/lib/storage";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return date.toLocaleDateString();
};

export default function DashboardScreen() {
  const router = useRouter();
  const { activeProject } = useProject();
  const { unreadCount, refreshNotifications } = useNotifications();

  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [latestTask, setLatestTask] = useState<any>(null);
  const [userName, setUserName] = useState("Developer");

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload?.username) {
          setUserName(payload.username);
        }
      } catch (e) {
        // Ignore decode error
      }
    }
  }, []);

  const fetchTasks = async () => {
    try {
      const tasksRes = await api.get("/tasks");
      setRecentTasks(tasksRes.data.slice(0, 4));

      const latestRes = await api.get("/tasks/latest");
      setLatestTask(latestRes.data);
    } catch (error) {
      console.error("Error fetching tasks", error);
    }
  };

  const handleGitSync = async (actionType: "push" | "pull") => {
    if (!activeProject) {
      toast.error("No Project Selected");
      return;
    }

    const confirmAction = confirm(`Are you sure you want to ${actionType} for ${activeProject.name}?`);
    if (!confirmAction) return;

    try {
      const response = await api.post("/github/sync", {
        action: actionType,
        owner: activeProject.owner || "unknown",
        repo: activeProject.name,
      });

      if (response.status === 200 || response.status === 201) {
        toast.success(`Successfully initiated git ${actionType} for ${activeProject.name}`);
      } else {
        toast.error("Action failed on the server");
      }
    } catch (e) {
      console.error(e);
      toast.error("Could not reach the backend server");
    }
  };

  const handleLogout = async () => {
    const userId = getUserId();
    if (userId) {
      try {
        await api.post("/auth/logout", { userId });
      } catch (e) {
        console.error("Backend logout failed", e);
      }
    }
    clearAuthData();
    router.replace("/");
  };

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingDelay = (latestTask?.status === "in-progress" || latestTask?.status === "pending") ? 2000 : 10000;

  useEffect(() => {
    fetchTasks();
    refreshNotifications();

    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    pollingIntervalRef.current = setInterval(() => {
      fetchTasks();
      refreshNotifications();
    }, pollingDelay);

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [refreshNotifications, pollingDelay]);

  const QUICK_ACTIONS = [
    { label: "New Task", icon: PlusCircle, color: "var(--color-accent)", action: () => router.push("/instruction") },
    { label: "Deploy", icon: Rocket, color: "var(--color-brand-blue)", action: () => router.push("/preview") },
    {
      label: "Git Sync", icon: GitCompare, color: "var(--color-brand-purple)", action: () => {
        const action = prompt(`Git Sync for ${activeProject?.name || 'Project'}:\nType 'pull' or 'push'`);
        if (action === 'pull' || action === 'push') {
          handleGitSync(action);
        }
      }
    },
    { label: "Terminal", icon: TerminalSquare, color: "var(--color-foreground)", action: () => router.push("/logs") },
    { label: "Logout", icon: LogOut, color: "#FF4B4B", action: handleLogout },
  ];

  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-x-hidden pb-32">
      {/* Background Decor */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0F0F14_1px,transparent_1px),linear-gradient(to_bottom,#0F0F14_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>
      <div className="pointer-events-none absolute -right-40 -top-40 h-[400px] w-[400px] rounded-full bg-accent opacity-[0.05] blur-[100px]" />

      <div className="relative z-10 px-6 pt-12 md:px-12 md:pt-16 lg:px-16 max-w-6xl mx-auto w-full">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex items-center justify-between"
        >
          <div>
            <p className="mb-1 text-sm font-medium text-muted">Hello, {userName}</p>
            <Link href="/projects" className="flex items-center gap-2 hover:opacity-80">
              <Folder className="h-5 w-5 text-accent" />
              <h1 className="text-2xl font-bold text-foreground">
                {activeProject?.name ?? "Select Project"}
              </h1>
              <ChevronDown className="h-4 w-4 text-muted" />
            </Link>
          </div>

          <Link
            href="/notifications"
            className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface transition-colors hover:bg-surface-light"
          >
            <Bell className="h-6 w-6 text-foreground" />
            {unreadCount > 0 && (
              <div className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-surface bg-accent px-1.5">
                <span className="text-[10px] font-black text-background">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              </div>
            )}
          </Link>
        </motion.header>

        {/* AI Agent Status Hero */}
        {latestTask && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12 overflow-hidden rounded-[24px] border border-border bg-surface/40 backdrop-blur-md"
          >
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div className="flex-1">
                  <div
                    className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                    style={{
                      backgroundColor: latestTask.status === "completed"
                        ? "color-mix(in srgb, var(--color-accent) 20%, transparent)"
                        : latestTask.status === "failed"
                          ? "rgba(255, 75, 75, 0.2)"
                          : latestTask.status === "cancelled"
                            ? "rgba(136, 136, 136, 0.2)"
                            : "color-mix(in srgb, var(--color-accent) 15%, transparent)"
                    }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: latestTask.status === "completed" ? "var(--color-accent)"
                          : latestTask.status === "failed" ? "#FF4B4B"
                            : latestTask.status === "cancelled" ? "#888888"
                              : "var(--color-brand-blue)"
                      }}
                    />
                    <span
                      className="text-[10px] font-black tracking-widest"
                      style={{
                        color: latestTask.status === "completed" ? "var(--color-accent)"
                          : latestTask.status === "failed" ? "#FF4B4B"
                            : latestTask.status === "cancelled" ? "#888888"
                              : "var(--color-brand-blue)"
                      }}
                    >
                      {latestTask.status === "completed" ? "TASK SUCCESSFUL"
                        : latestTask.status === "failed" ? "TASK UNSUCCESSFUL"
                          : latestTask.status === "cancelled" ? "TASK CANCELLED"
                            : "AI AGENT ACTIVE"}
                    </span>
                  </div>

                  <h2 className="mb-2 text-2xl font-extrabold text-foreground line-clamp-1">
                    {latestTask.description}
                  </h2>
                  <p className="text-base text-muted line-clamp-1">
                    {latestTask.taskLogs && latestTask.taskLogs.length > 0
                      ? latestTask.taskLogs[latestTask.taskLogs.length - 1].message
                      : "Initializing..."}
                  </p>
                </div>

                <div className="hidden md:flex h-20 w-20 items-center justify-center rounded-[24px] border border-border bg-background shadow-lg">
                  <TerminalSquare className="h-10 w-10 text-accent" />
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-background">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: latestTask.status === "completed" ? "100%" : `${Math.min((latestTask.taskLogs?.length || 0) * 10, 95)}%`
                }}
                className="h-full bg-accent"
              />
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="mb-4 flex items-end justify-between">
          <h3 className="text-xl font-bold text-foreground">Quick Actions</h3>
        </div>
        <div className="mb-12 grid grid-cols-5 gap-3 md:gap-6">
          {QUICK_ACTIONS.map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="group flex flex-col items-center gap-3"
            >
              <div
                className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-[20px] border transition-transform group-hover:scale-105 group-active:scale-95"
                style={{
                  backgroundColor: `color-mix(in srgb, ${item.color} 10%, transparent)`,
                  borderColor: `color-mix(in srgb, ${item.color} 25%, transparent)`,
                }}
              >
                <item.icon className="h-6 w-6 md:h-7 md:w-7" style={{ color: item.color }} />
              </div>
              <span className="text-[11px] md:text-xs font-semibold text-text-dim text-center">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Recent Tasks */}
        <div className="mb-4 flex items-end justify-between">
          <h3 className="text-xl font-bold text-foreground">Recent Tasks</h3>
          <button className="text-sm font-semibold text-accent hover:underline">
            See all
          </button>
        </div>

        <div className="flex flex-col gap-3 md:gap-4">
          {recentTasks.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface py-12 text-center text-muted">
              No recent tasks found
            </div>
          ) : (
            recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-4 rounded-[20px] border border-border bg-surface p-5 transition-colors hover:border-accent/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-1 items-center gap-3">
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: task.status === 'completed' ? 'var(--color-accent)' : 'var(--color-brand-blue)' }}
                    />
                    <h4 className="text-base font-semibold text-foreground line-clamp-1">
                      {task.description}
                    </h4>
                  </div>
                  <span className="text-xs text-muted shrink-0 ml-4">
                    {formatTime(task.createdAt)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-5">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted" />
                    <span className="text-xs text-muted">{task.repoName || "unknown-repo"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-muted" />
                    <span className="text-xs text-muted">{task.branchName || "main"}</span>
                  </div>

                  {(task.status === "in-progress" || task.status === "pending") && (
                    <div className="ml-auto rounded-md bg-[rgba(66,133,244,0.15)] px-2.5 py-1">
                      <span className="text-[10px] font-black tracking-wider text-brand-blue">
                        ENGINE RUNNING
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Floating CTA */}
      <Link
        href="/instruction"
        className="fixed bottom-28 md:bottom-10 right-6 md:right-10 z-50 flex h-[64px] items-center justify-center gap-3 overflow-hidden rounded-[32px] bg-accent px-6 shadow-[0_10px_20px_rgba(0,255,133,0.3)] transition-transform hover:scale-105 active:scale-95"
      >
        <TerminalSquare className="h-6 w-6 text-background" />
        <span className="text-lg font-extrabold text-background">
          New Instruction
        </span>
      </Link>
    </div>
  );
}
