"use client";

import { LayoutGrid, Folder, Play, Terminal, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserId, clearAuthData } from "@/lib/storage";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { name: "Home", href: "/dashboard", icon: LayoutGrid },
  { name: "Projects", href: "/projects", icon: Folder },
  { name: "Preview", href: "/preview", icon: Play },
  { name: "Logs", href: "/logs", icon: Terminal },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const userId = getUserId();
    if (!userId) {
      clearAuthData();
      router.replace("/");
    }
  }, [router]);

  if (!isMounted) return null;

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-surface md:flex">
        <div className="flex h-20 items-center px-8">
          <h2 className="text-2xl font-light tracking-tight text-white">
            pocket<span className="font-bold text-accent">dev</span>
          </h2>
        </div>
        <nav className="flex flex-1 flex-col gap-2 px-4 py-8">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-colors ${
                  isActive
                    ? "bg-accent-dim text-accent"
                    : "text-muted hover:bg-surface-light hover:text-white"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-accent" : "text-muted"}`} />
                <span className="font-semibold">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0 relative">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[80px] items-center justify-around border-t border-border bg-surface/90 pb-safe pt-2 backdrop-blur-lg md:hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1.5 px-3 py-1"
            >
              <item.icon
                className={`h-6 w-6 transition-colors ${
                  isActive ? "text-accent" : "text-muted"
                }`}
              />
              <span
                className={`text-[11px] font-bold transition-colors ${
                  isActive ? "text-accent" : "text-muted"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
