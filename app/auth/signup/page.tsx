"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Mail, ShieldCheck, Zap, Lock, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/lib/axios";

type AuthMode = "choose" | "email";
type EmailStep = "input" | "loading" | "done";

export default function SignupScreen() {
  const [authMode, setAuthMode] = useState<AuthMode>("choose");
  const [emailStep, setEmailStep] = useState<EmailStep>("input");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleDone, setGoogleDone] = useState(false);
  
  const router = useRouter();

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    setTimeout(() => {
      setGoogleLoading(false);
      setGoogleDone(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    }, 2000);
  };

  const handleEmailSignup = async () => {
    if (!email || !password || !name) return;
    setEmailStep("loading");
    
    try {
      // Setup mock API call or real one depending on backend implementation
      // await api.post('/auth/signup', { name, email, password });
      setTimeout(() => {
        setEmailStep("done");
        setTimeout(() => router.push("/dashboard"), 1500);
      }, 1800);
    } catch (error) {
      console.error(error);
      setEmailStep("input");
    }
  };

  const isEmailValid = email.includes("@") && email.includes(".");
  const canSubmit = name.length > 1 && isEmailValid && password.length >= 6;

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground overflow-hidden">
      {/* Decorative Grid */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0F0F14_1px,transparent_1px),linear-gradient(to_bottom,#0F0F14_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Decorative Glow */}
      <div className="pointer-events-none absolute -left-20 -top-40 h-80 w-[150%] rounded-[300px] bg-accent opacity-[0.05] blur-3xl md:-left-40 md:w-[120%]" />

      <main className="relative z-10 flex flex-1 flex-col px-8 pt-16 pb-12 md:mx-auto md:w-full md:max-w-md lg:pt-24">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <button
            onClick={() => (authMode === "email" ? setAuthMode("choose") : router.back())}
            className="mb-8 flex items-center gap-3 text-sm font-semibold hover:opacity-80 transition-opacity"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface">
              <ChevronLeft className="h-5 w-5" />
            </div>
            {authMode === "email" ? "Other options" : "Back"}
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="mb-5 flex items-center gap-1.5 self-start rounded-full border border-[rgba(0,255,133,0.2)] bg-accent-dim px-3 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[10px] font-black tracking-[1.5px] text-accent">
              STEP 3 OF 3
            </span>
          </div>
          <h1 className="mb-4 whitespace-pre-line text-5xl font-extrabold leading-[52px] tracking-tight">
            {authMode === "email" ? "Create\nAccount" : "Almost\nThere"}
          </h1>
          <p className="text-base font-normal leading-6 text-muted">
            {authMode === "email"
              ? "Enter your details to set up your PocketDev account."
              : "Create your account to start shipping from your browser."}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {authMode === "choose" && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-5"
            >
              {!googleDone ? (
                <>
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-accent shadow-[0_4px_12px_rgba(0,255,133,0.3)] transition-all hover:scale-[0.98] hover:opacity-90 active:scale-95 disabled:pointer-events-none disabled:opacity-80"
                  >
                    {googleLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      >
                        <div className="h-6 w-6 rounded-full border-2 border-background border-t-transparent" />
                      </motion.div>
                    ) : (
                      <>
                        <svg className="h-5 w-5 text-background" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="text-lg font-bold text-background">
                          Continue with Google
                        </span>
                      </>
                    )}
                  </button>

                  <div className="my-2 flex items-center gap-4">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-bold tracking-widest text-muted">OR</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <button
                    onClick={() => setAuthMode("email")}
                    className="flex h-16 items-center justify-center gap-3 rounded-2xl border border-border bg-surface transition-colors hover:bg-surface-light"
                  >
                    <Mail className="h-5 w-5 text-text-dim" />
                    <span className="text-base font-semibold text-text-dim">
                      Continue with Email
                    </span>
                  </button>

                  <div className="mt-2 flex justify-center gap-3">
                    {[
                      { icon: ShieldCheck, text: "Secure" },
                      { icon: Zap, text: "30s setup" },
                      { icon: Lock, text: "Private" },
                    ].map((t, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2"
                      >
                        <t.icon className="h-3 w-3 text-accent" />
                        <span className="text-xs font-medium text-muted">
                          {t.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="mt-3 text-center text-[13px] leading-5 text-muted">
                    By continuing you agree to our{" "}
                    <Link href="#" className="font-bold text-accent hover:underline">
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link href="#" className="font-bold text-accent hover:underline">
                      Privacy Policy
                    </Link>
                  </p>
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="flex flex-row items-center gap-5 rounded-2xl border border-accent bg-surface p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
                    <Check className="h-6 w-6 text-background" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-extrabold">Signed in!</span>
                    <span className="text-sm text-muted">Redirecting to dashboard...</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {authMode === "email" && (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-6"
            >
              {emailStep !== "done" ? (
                <>
                  <div className="flex flex-col gap-2.5">
                    <label className="text-xs font-extrabold tracking-[1.5px] text-muted">
                      FULL NAME
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Linus Torvalds"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-16 w-full rounded-2xl border border-border bg-surface px-5 text-base text-foreground outline-none transition-colors focus:border-accent focus:bg-surface-light placeholder:text-muted"
                    />
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <label className="text-xs font-extrabold tracking-[1.5px] text-muted">
                      EMAIL ADDRESS
                    </label>
                    <input
                      type="email"
                      placeholder="hello@world.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-16 w-full rounded-2xl border border-border bg-surface px-5 text-base text-foreground outline-none transition-colors focus:border-accent focus:bg-surface-light placeholder:text-muted"
                    />
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <label className="text-xs font-extrabold tracking-[1.5px] text-muted">
                      PASSWORD
                    </label>
                    <input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-16 w-full rounded-2xl border border-border bg-surface px-5 text-base text-foreground outline-none transition-colors focus:border-accent focus:bg-surface-light placeholder:text-muted"
                    />
                  </div>

                  <button
                    onClick={handleEmailSignup}
                    disabled={!canSubmit || emailStep === "loading"}
                    className="mt-3 flex h-16 items-center justify-center gap-3 rounded-2xl bg-accent transition-all hover:scale-[0.98] hover:opacity-90 active:scale-95 disabled:pointer-events-none disabled:bg-surface disabled:border disabled:border-border"
                  >
                    {emailStep === "loading" ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      >
                        <div className="h-6 w-6 rounded-full border-2 border-background border-t-transparent" />
                      </motion.div>
                    ) : (
                      <>
                        <span
                          className={`text-lg font-bold ${
                            canSubmit ? "text-background" : "text-muted"
                          }`}
                        >
                          Create Account
                        </span>
                        <ArrowRight
                          className={`h-5 w-5 ${
                            canSubmit ? "text-background" : "text-muted"
                          }`}
                        />
                      </>
                    )}
                  </button>
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="flex flex-col items-center py-12"
                >
                  <div className="mb-6 flex h-[100px] w-[100px] items-center justify-center rounded-[30px] bg-accent">
                    <Check className="h-10 w-10 text-background" />
                  </div>
                  <h2 className="mb-2 text-[32px] font-extrabold text-foreground">
                    You're in!
                  </h2>
                  <p className="text-center text-lg text-muted">
                    Welcome to PocketDev, {name.split(" ")[0]}.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
