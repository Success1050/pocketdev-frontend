"use client";

import { ProjectProvider } from "@/context/ProjectContext";
import { NotificationProvider } from "@/context/NotificationContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <ProjectProvider>
        {children}
      </ProjectProvider>
    </NotificationProvider>
  );
}
