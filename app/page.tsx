"use client";

import { motion } from "framer-motion";
import { Terminal, Check, Code2, Sparkles, ArrowRight, Zap, Globe, Cpu, Smartphone } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function EntryScreen() {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((prev) => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Decorative top blurred light */}
      <div className="pointer-events-none absolute -left-20 -top-40 h-80 w-[150%] rounded-[300px] bg-accent opacity-[0.03] blur-3xl md:-left-40 md:w-[120%]" />

      {/* Grid Pattern (Subtle) */}
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0F0F14_1px,transparent_1px),linear-gradient(to_bottom,#0F0F14_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
        className="relative z-10 flex flex-1 flex-col justify-center px-8 md:mx-auto md:w-full md:max-w-2xl lg:max-w-4xl lg:px-12"
      >
        <div className="mb-8 flex flex-col items-start md:mb-12">
          <motion.div
            animate={{ scale: pulse ? 1.05 : 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-[20px] border border-accent/20 bg-accent-dim md:h-20 md:w-20"
          >
            <Terminal className="h-8 w-8 text-accent md:h-10 md:w-10" />
          </motion.div>
          <h1 className="text-[52px] font-light leading-[60px] tracking-tight text-white md:text-[72px] md:leading-[80px]">
            pocket<span className="font-bold text-accent">dev</span>
          </h1>
        </div>

        <div className="mb-10 flex md:mb-12">
          <div className="flex items-center rounded-full border border-border bg-surface-light px-4 py-2">
            <div className="mr-3 flex gap-1.5">
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                className="h-1.5 w-1.5 rounded-full bg-accent"
              />
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                className="h-1.5 w-1.5 rounded-full bg-accent"
              />
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                className="h-1.5 w-1.5 rounded-full bg-accent"
              />
            </div>
            <span className="text-sm font-medium text-text-dim">
              AI agent ready
            </span>
          </div>
        </div>

        <p className="mb-12 text-[22px] font-normal leading-8 tracking-tight text-muted md:text-[28px] md:leading-10">
          Edit code. Push to GitHub.
          <br />
          Ship from your phone.
        </p>

        <div className="flex flex-col gap-4 md:flex-row md:gap-8">
          {["Write Code", "Ask AI", "Run anywhere"].map((feat, i) => (
            <div key={i} className="flex items-center gap-3.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent">
                <Check className="h-4 w-4 text-background stroke-[3]" />
              </div>
              <span className="text-base font-medium text-text-dim md:text-lg">
                {feat}
              </span>
            </div>
          ))}
        </div>
      </motion.main>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="relative z-10 px-6 pb-10 md:mx-auto md:w-full md:max-w-2xl lg:max-w-4xl lg:px-12"
      >
        <Link
          href="/onboarding"
          className="group flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-accent text-lg font-bold tracking-wide text-background shadow-[0_6px_16px_rgba(0,255,133,0.35)] transition-all hover:scale-[0.98] hover:opacity-90 active:scale-95 md:h-20 md:text-xl md:w-fit md:px-12 md:mx-auto"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="h-5 w-5">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>
          <span>Continue with Github</span>
          <ArrowRight className="h-5 w-5 text-background transition-transform group-hover:translate-x-1" />
        </Link>

        <div className="mt-4 text-center">
          <p className="text-xs tracking-wide text-muted md:text-sm">
            Powered by GPT-4 • Docker • GitHub
          </p>
        </div>
      </motion.footer>
    </div>
  );
}
