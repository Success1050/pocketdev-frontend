"use client";

import { motion } from "framer-motion";
import { 
  ChevronLeft, ChevronRight, RotateCw, Lock, 
  Smartphone, Tablet, Monitor, ExternalLink,
  GitBranch, Terminal, QrCode, Eye, Info
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, Suspense } from "react";
import { useProject } from "@/context/ProjectContext";

const DEVICE_PRESETS = [
  { label: "Mobile", icon: Smartphone, width: 390, height: 844 },
  { label: "Tablet", icon: Tablet, width: 768, height: 1024 },
  { label: "Desktop", icon: Monitor, width: "100%", height: "100%" },
];

function PreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlParam = searchParams?.get("url");
  const branchParam = searchParams?.get("branch");
  const projectType = searchParams?.get("projectType");
  
  const { activeProject } = useProject();

  const [selectedDevice, setSelectedDevice] = useState(2); // Default to Desktop
  const [isLoading, setIsLoading] = useState(true);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const currentUrl = urlParam || activeProject?.homepage || "";
  const isMobileApp = projectType === "mobile" || projectType === "flutter" || activeProject?.language === "React Native" || activeProject?.language === "Dart";
  const hasWebUrl = !!currentUrl && !isMobileApp;
  
  const device = DEVICE_PRESETS[selectedDevice];

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      // Hack to reload iframe
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden relative">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4 md:px-6 relative z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-background border border-border hover:bg-surface-light transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
          
          <div className="hidden md:flex h-8 items-center gap-2 rounded-lg border border-border bg-background px-3 min-w-[200px] max-w-md">
            <Lock className="h-3 w-3 text-accent" />
            <span className="text-xs font-mono text-muted truncate">
              {currentUrl || "Live Preview"}
            </span>
          </div>
        </div>

        {hasWebUrl && (
          <div className="flex items-center gap-1 md:gap-2">
            <div className="flex items-center rounded-lg border border-border bg-background p-1 mr-4">
              {DEVICE_PRESETS.map((d, i) => (
                <button
                  key={d.label}
                  onClick={() => setSelectedDevice(i)}
                  className={`flex h-7 w-10 md:w-14 items-center justify-center rounded-md transition-colors ${
                    selectedDevice === i ? "bg-surface-light text-accent" : "text-muted hover:text-foreground"
                  }`}
                  title={d.label}
                >
                  <d.icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            <button onClick={handleRefresh} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-light transition-colors">
              <RotateCw className="h-4 w-4 text-foreground" />
            </button>
            <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-light transition-colors">
              <ExternalLink className="h-4 w-4 text-foreground" />
            </a>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden bg-[#0A0A0C] flex items-center justify-center relative pb-20 md:pb-0 p-4 md:p-8">
        {hasWebUrl ? (
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`relative overflow-hidden bg-white shadow-2xl border border-border transition-all duration-300 ${
              device.label === "Desktop" ? "rounded-xl w-full h-full" : "rounded-[2rem] mx-auto shadow-accent/10"
            }`}
            style={
              device.label !== "Desktop" 
                ? { width: device.width, height: device.height, maxHeight: '100%', maxWidth: '100%' }
                : {}
            }
          >
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm gap-4">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <RotateCw className="h-8 w-8 text-accent" />
                </motion.div>
                <span className="text-sm font-semibold text-foreground">Loading preview...</span>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={currentUrl}
              onLoad={() => setIsLoading(false)}
              className="w-full h-full border-none bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </motion.div>
        ) : (
          <div className="w-full max-w-2xl bg-surface border border-border p-8 rounded-[24px]">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="h-20 w-20 bg-accent-dim border border-accent/30 rounded-2xl flex items-center justify-center mb-6">
                <Smartphone className="h-10 w-10 text-accent" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {projectType === "flutter" || activeProject?.language === "Dart" ? "Flutter App" : "React Native App"}
              </h2>
              <p className="text-muted text-sm max-w-md">
                Mobile apps cannot be previewed directly in a web browser. Follow the steps below to see your live changes locally.
              </p>
            </div>

            {(branchParam || activeProject?.activeBranch) && (
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center gap-2 bg-accent-dim border border-accent/30 px-4 py-2 rounded-full">
                  <GitBranch className="h-4 w-4 text-accent" />
                  <span className="text-sm font-mono font-bold text-accent">
                    {branchParam || activeProject?.activeBranch}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {[
                { icon: GitBranch, color: "var(--color-accent)", title: "Pull the branch", desc: `git pull origin ${branchParam || activeProject?.activeBranch || 'ai-branch'}` },
                { icon: Terminal, color: "var(--color-brand-blue)", title: "Start the dev server", desc: projectType === "flutter" || activeProject?.language === "Dart" ? "flutter run" : "npx expo start" },
                { icon: QrCode, color: "var(--color-brand-purple)", title: "Open in Simulator", desc: "Scan the QR code or press 'i' for iOS, 'a' for Android" },
                { icon: Eye, color: "var(--color-warning, #FFBD2E)", title: "Review & merge", desc: "Check the AI changes, then merge into main when ready" },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-4 bg-background border border-border p-4 rounded-xl">
                  <div className="h-10 w-10 rounded-lg border flex flex-shrink-0 items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${step.color} 10%, transparent)`, borderColor: `color-mix(in srgb, ${step.color} 30%, transparent)` }}>
                    <step.icon className="h-5 w-5" style={{ color: step.color }} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-foreground">{step.title}</h4>
                    <p className="text-xs text-muted font-mono mt-1">{step.desc}</p>
                  </div>
                  <div className="h-6 w-6 rounded-full bg-surface-light border border-border flex items-center justify-center">
                    <span className="text-[10px] font-black text-muted">{i + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">Loading preview...</div>}>
      <PreviewContent />
    </Suspense>
  );
}
