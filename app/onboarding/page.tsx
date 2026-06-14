"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Slide {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  tag: string;
  accent: string;
  lines: string[];
}

const SLIDES: Slide[] = [
  {
    id: "1",
    icon: "🤖",
    title: "Your AI\nCoding Agent",
    subtitle:
      "Describe what you want. The AI reads your codebase, plans the changes, and executes — no laptop needed.",
    tag: "AGENT",
    accent: "var(--color-accent)",
    lines: [
      '> "Add Supabase auth to my app"',
      "✓ Reading 24 files...",
      "✓ Planning 6 changes...",
      "✓ Writing code...",
    ],
  },
  {
    id: "2",
    icon: "🐳",
    title: "Isolated Docker\nWorkspaces",
    subtitle:
      "Every task runs in its own sandboxed container. Your project stays safe. Mistakes stay contained.",
    tag: "SANDBOX",
    accent: "var(--color-brand-blue)",
    lines: [
      "$ docker run --rm pocketdev/env",
      "$ git clone your-repo",
      "$ npm install",
      "$ npm run build ✓",
    ],
  },
  {
    id: "3",
    icon: "⚡",
    title: "Push & Preview\nInstantly",
    subtitle:
      "Changes get committed to a new branch, pushed to GitHub, and deployed to a live preview URL automatically.",
    tag: "DEPLOY",
    accent: "var(--color-brand-orange)",
    lines: [
      "Branch: ai/add-auth-feature",
      "Commits: 3 files changed",
      "Vercel: Deploying...",
      "🌐 preview.vercel.app/xyz ✓",
    ],
  },
  {
    id: "4",
    icon: "📲",
    title: "Full Control\nFrom Your Browser",
    subtitle:
      "Review diffs, stream live logs, approve changes, and open previews — all without touching a local terminal.",
    tag: "WEB",
    accent: "var(--color-brand-purple)",
    lines: [
      "✅ Task completed",
      "📄 5 files changed",
      "🌐 Preview ready",
      "📦 Build: success",
    ],
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      router.push("/auth/github");
    }
  };

  const isLast = currentIndex === SLIDES.length - 1;
  const currentSlide = SLIDES[currentIndex];
  const currentAccent = currentSlide.accent;

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground overflow-hidden">
      {/* Top Bar */}
      <div className="flex justify-end px-8 pt-12 md:px-16 lg:px-24">
        <Link
          href="/auth/signup"
          className="px-4 py-2 text-sm tracking-wide text-muted hover:text-white transition-colors"
        >
          Skip
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col px-8 pt-6 md:px-16 lg:px-24 md:flex-row md:items-center md:gap-16 lg:gap-24">
        {/* Text and Info Side */}
        <div className="flex-1 max-w-md w-full mb-8 md:mb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-start"
            >
              <div
                className="mb-6 flex items-center gap-2 rounded-full border px-3 py-1.5"
                style={{
                  borderColor: `color-mix(in srgb, ${currentSlide.accent} 25%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${currentSlide.accent} 10%, transparent)`,
                }}
              >
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: currentSlide.accent }}
                />
                <span
                  className="text-[11px] font-bold tracking-widest"
                  style={{ color: currentSlide.accent }}
                >
                  {currentSlide.tag}
                </span>
              </div>

              <div className="mb-5 text-5xl">{currentSlide.icon}</div>

              <h2 className="mb-4 whitespace-pre-line text-4xl font-extrabold leading-[44px] tracking-tight text-[#F0F0F0] md:text-5xl md:leading-[52px]">
                {currentSlide.title}
              </h2>

              <p className="text-[15px] leading-6 tracking-wide text-muted md:text-lg md:leading-8">
                {currentSlide.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Terminal Card Side */}
        <div className="flex-1 w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="flex w-full flex-col gap-2 rounded-2xl border bg-surface p-5 shadow-xl md:p-6"
              style={{
                borderColor: `color-mix(in srgb, ${currentSlide.accent} 20%, transparent)`,
              }}
            >
              <div className="mb-3 flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
                <span className="ml-1.5 text-[11px] tracking-widest text-muted">
                  pocketdev terminal
                </span>
              </div>

              <div className="flex flex-col gap-1 font-mono text-[13px] leading-5 tracking-wide md:text-sm md:leading-6">
                {currentSlide.lines.map((line, i) => {
                  let color = "var(--color-muted)";
                  if (line.includes("✓") || line.startsWith("✓")) {
                    color = "var(--color-accent)";
                  } else if (line.startsWith("$")) {
                    color = currentSlide.accent;
                  } else if (
                    line.startsWith("🌐") ||
                    line.startsWith("✅") ||
                    line.startsWith("📄") ||
                    line.startsWith("📦")
                  ) {
                    color = "#F0F0F0";
                  }

                  return (
                    <div key={i} style={{ color }}>
                      {line}
                    </div>
                  );
                })}
                <BlinkingCursor accent={currentSlide.accent} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col gap-5 px-8 pb-12 md:flex-row md:items-center md:justify-between md:px-16 lg:px-24 md:pb-16">
        <div className="flex items-center justify-between md:gap-8">
          <div className="flex items-center gap-1.5">
            {SLIDES.map((_, i) => {
              const isActive = i === currentIndex;
              return (
                <div
                  key={i}
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: isActive ? 32 : 20,
                    backgroundColor: isActive
                      ? currentAccent
                      : "var(--color-border)",
                  }}
                />
              );
            })}
          </div>
          <span className="font-mono text-xs tracking-widest text-muted md:hidden">
            {String(currentIndex + 1).padStart(2, "0")} /{" "}
            {String(SLIDES.length).padStart(2, "0")}
          </span>
        </div>

        <button
          onClick={goNext}
          className="flex items-center justify-center gap-2.5 rounded-2xl py-4 px-7 font-bold tracking-wide text-black transition-all hover:scale-[0.98] hover:opacity-90 active:scale-95 md:py-4 md:px-8"
          style={{ backgroundColor: currentAccent }}
        >
          <span className="text-base md:text-lg">
            {isLast ? "Connect GitHub" : "Next"}
          </span>
          {isLast ? (
            <ArrowRight className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
}

function BlinkingCursor({ accent }: { accent: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible((v) => !v);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="mt-1 h-3.5 w-2 rounded-sm transition-opacity"
      style={{
        backgroundColor: accent,
        opacity: visible ? 1 : 0,
      }}
    />
  );
}
