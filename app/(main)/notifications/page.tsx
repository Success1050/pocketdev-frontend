"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, XCircle, AlertTriangle, Info, 
  Trash2, CheckCheck, ChevronRight, BellOff, ArrowLeft, Loader2, Code2, AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useNotifications } from "@/context/NotificationContext";

const NOTIF_ICONS: Record<string, { icon: any; color: string; bg: string }> = {
  success: { icon: CheckCircle2, color: "var(--color-accent)", bg: "color-mix(in srgb, var(--color-accent) 15%, transparent)" },
  error: { icon: XCircle, color: "#FF4B4B", bg: "color-mix(in srgb, #FF4B4B 15%, transparent)" },
  warning: { icon: AlertTriangle, color: "#FF9F0A", bg: "color-mix(in srgb, #FF9F0A 15%, transparent)" },
  info: { icon: Info, color: "var(--color-brand-blue)", bg: "color-mix(in srgb, var(--color-brand-blue) 15%, transparent)" },
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 172800) return "yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshNotifications();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notif: any) => {
    if (!notif.read) {
      await markAsRead(notif.id);
    }
    if (notif.taskId) {
      router.push(`/logs?taskId=${notif.taskId}`);
    }
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to delete all notifications?")) {
      // onDeleteAll();
    }
  };

  const unreadNotifs = notifications.filter((n) => !n.read);
  const readNotifs = notifications.filter((n) => n.read);

  const renderNotification = (notif: any) => {
    const iconConfig = NOTIF_ICONS[notif.type] || NOTIF_ICONS.info;
    const Icon = iconConfig.icon;

    return (
      <motion.button
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        key={notif.id}
        onClick={() => handleNotificationPress(notif)}
        className={`group relative flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all hover:border-border/80 ${
          !notif.read ? "border-accent/20 bg-surface-light" : "border-border bg-surface"
        } ${notif.type === "success" ? "hover:border-accent/40" : ""} ${
          notif.type === "error" ? "hover:border-[#FF4B4B]/40" : ""
        }`}
      >
        {/* Status Indicator Bar */}
        <div 
          className="absolute bottom-0 left-0 top-0 w-1 rounded-l-2xl"
          style={{ backgroundColor: iconConfig.color }}
        />

        {/* Unread Dot */}
        {!notif.read && (
          <div className="absolute left-3 top-5 h-1.5 w-1.5 rounded-full bg-accent" />
        )}

        {/* Icon */}
        <div 
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
          style={{ backgroundColor: iconConfig.bg }}
        >
          <Icon className="h-5 w-5" style={{ color: iconConfig.color }} />
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col">
          <div className="mb-1 flex items-start justify-between gap-4">
            <h4 
              className={`text-[15px] line-clamp-1 ${!notif.read ? "font-bold text-foreground" : "font-semibold text-text-dim"} ${
                notif.type === "success" ? "text-accent" : ""
              } ${notif.type === "error" ? "text-[#FF4B4B]" : ""}`}
            >
              {notif.title}
            </h4>
            <span className="shrink-0 text-xs font-medium text-muted">
              {formatTime(notif.createdAt)}
            </span>
          </div>
          
          <p className="mb-2 line-clamp-2 text-[13px] leading-relaxed text-muted">
            {notif.body}
          </p>

          {notif.taskId && (
            <div 
              className="inline-flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors"
              style={{ backgroundColor: notif.type === "error" ? "color-mix(in srgb, #FF4B4B 10%, transparent)" : "color-mix(in srgb, var(--color-accent) 10%, transparent)" }}
            >
              {notif.type === "error" ? (
                <AlertCircle className="h-3.5 w-3.5 text-[#FF4B4B]" />
              ) : (
                <Code2 className="h-3.5 w-3.5 text-accent" />
              )}
              <span className={`text-[11px] font-bold tracking-wide ${notif.type === "error" ? "text-[#FF4B4B]" : "text-accent"}`}>
                {notif.type === "error" ? "VIEW ERROR LOGS" : "VIEW TASK DETAILS"}
              </span>
            </div>
          )}
        </div>

        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-1" />
      </motion.button>
    );
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background pb-32 overflow-hidden">
      {/* Decorative Glow */}
      <div className="pointer-events-none absolute -left-20 -top-40 h-[400px] w-[400px] rounded-full bg-accent opacity-[0.04] blur-[100px]" />

      <div className="relative z-10 px-6 pt-12 md:px-12 md:pt-16 lg:px-16 max-w-4xl mx-auto w-full">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-2xl border border-border bg-surface transition-transform hover:scale-105"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <div className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-accent px-2">
                  <span className="text-xs font-black text-background">{unreadCount}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-2xl border border-border bg-surface transition-colors hover:bg-surface-light"
            >
              <Loader2 className={`h-5 w-5 text-muted ${refreshing ? "animate-spin text-accent" : ""}`} />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-2xl border border-accent/20 bg-accent-dim transition-transform hover:scale-105"
                title="Mark all as read"
              >
                <CheckCheck className="h-5 w-5 text-accent" />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-2xl border border-[rgba(255,71,87,0.2)] bg-[rgba(255,71,87,0.1)] transition-transform hover:scale-105"
                title="Clear all"
              >
                <Trash2 className="h-5 w-5 text-[#FF4B4B]" />
              </button>
            )}
          </div>
        </motion.header>

        {/* Content */}
        <div className="flex flex-col">
          {isLoading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="mb-4 h-8 w-8 animate-spin text-accent" />
              <p className="text-[15px] text-muted">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-border bg-surface">
                <BellOff className="h-10 w-10 text-muted" />
              </div>
              <h3 className="mb-2 text-xl font-extrabold text-foreground">All Caught Up!</h3>
              <p className="max-w-xs text-[15px] leading-relaxed text-muted">
                You'll be notified here when your background tasks complete or need attention.
              </p>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-8">
              {unreadNotifs.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-accent" />
                      <h3 className="text-base font-bold text-foreground">New</h3>
                    </div>
                    <span className="text-sm font-semibold text-muted">{unreadNotifs.length}</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <AnimatePresence initial={false}>
                      {unreadNotifs.map(renderNotification)}
                    </AnimatePresence>
                  </div>
                </section>
              )}

              {readNotifs.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-bold text-muted">Earlier</h3>
                    <span className="text-sm font-semibold text-muted">{readNotifs.length}</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <AnimatePresence initial={false}>
                      {readNotifs.map(renderNotification)}
                    </AnimatePresence>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
