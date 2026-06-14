"use client";

import { createContext, useCallback, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { getUserId, clearAuthData, saveSelectedProject, getSelectedProject } from "@/lib/storage";

export type Project = {
  id: string;
  name: string;
  owner: string;
  description: string;
  language: string;
  stars: number;
  isPrivate: boolean;
  lastActive: string;
  branches: string[];
  activeBranch: string;
  status: "active" | "idle" | "building";
  repoUrl: string;
  defaultBranch?: string;
  homepage?: string;
};

type ProjectContextType = {
  projects: Project[];
  activeProject: Project | null;
  isLoading: boolean;
  setActiveProject: (project: Project) => void;
  setActiveBranch: (branch: string) => void;
  setProjectBranches: (projectId: string, branches: string[]) => void;
  addProject: (project: Project) => void;
  setProjects: (projects: Project[]) => void;
  refreshProjects: (page?: number, perPage?: number) => Promise<Project[]>;
  refreshBranches: (owner: string, repo: string, projectId: string) => Promise<string[]>;
};

const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  activeProject: null,
  isLoading: false,
  setActiveProject: () => {},
  setActiveBranch: () => {},
  setProjectBranches: () => {},
  addProject: () => {},
  setProjects: () => {},
  refreshProjects: async () => [],
  refreshBranches: async () => [],
});

export const useProject = () => useContext(ProjectContext);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjectsState] = useState<Project[]>([]);
  const [activeProject, setActiveProjectState] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load active project from storage on mount
    const stored = getSelectedProject();
    if (stored && stored.project) {
      setActiveProjectState(stored.project);
    }
  }, []);

  const setActiveProject = (project: Project) => {
    setActiveProjectState(project);
    try {
      saveSelectedProject(project.id, project);
    } catch (err) {
      console.error("Failed to save project:", err);
    }
  };

  const setActiveBranch = (branch: string) => {
    if (!activeProject) return;
    const branches = activeProject.branches || [];
    const newBranches = branches.includes(branch) ? branches : [...branches, branch];
    
    const updated = { ...activeProject, activeBranch: branch, branches: newBranches };
    setActiveProjectState(updated);
    try {
      saveSelectedProject(updated.id, updated);
    } catch (err) {
      console.error("Failed to save branch update:", err);
    }
    setProjectsState((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const setProjectBranches = (projectId: string, branches: string[]) => {
    setProjectsState((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          // Ensure active branch is not lost due to API caching delay
          const safeBranches = branches.includes(p.activeBranch) 
            ? branches 
            : [...branches, p.activeBranch];

          const updated = { ...p, branches: safeBranches };
          
          setActiveProjectState((prevActive) => {
            if (prevActive?.id === projectId) {
              return updated;
            }
            return prevActive;
          });

          return updated;
        }
        return p;
      })
    );
  };

  const addProject = (project: Project) => {
    setProjectsState((prev) => [project, ...prev]);
    setActiveProjectState(project);
  };

  const refreshProjects = useCallback(async (page: number = 1, perPage: number = 20) => {
    const userId = getUserId();
    if (!userId) return [];

    setIsLoading(true);
    try {
      const response = await api.get(`/github/repos/${userId}?page=${page}&perPage=${perPage}`);
      const data = response.data;

      if (Array.isArray(data)) {
        const mappedProjects: Project[] = data.map((repo: any) => ({
          id: String(repo.id),
          name: repo.name,
          owner: repo.owner || "unknown",
          description: repo.description || `Repository: ${repo.name}`,
          language: repo.lang,
          stars: repo.stars,
          isPrivate: repo.private,
          lastActive: "Connected",
          branches: repo.defaultBranch ? [repo.defaultBranch] : ["main"],
          activeBranch: repo.defaultBranch || "main",
          status: "idle",
          repoUrl: repo.repoUrl || `https://github.com/${repo.owner}/${repo.name}`,
          defaultBranch: repo.defaultBranch,
          homepage: repo.homepage || undefined,
        }));

        if (page === 1) {
          setProjectsState(mappedProjects);
        } else {
          setProjectsState((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newOnes = mappedProjects.filter((p) => !existingIds.has(p.id));
            return [...prev, ...newOnes];
          });
        }
        return mappedProjects;
      }
      return [];
    } catch (error: any) {
      console.error("Error refreshing projects:", error);
      if (error.response?.status === 401) {
        clearAuthData();
        router.replace("/");
      }
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const refreshBranches = useCallback(async (owner: string, repo: string, projectId: string) => {
    const userId = getUserId();
    if (!userId) return [];

    try {
      const response = await api.get(`/github/repos/${userId}/${owner}/${repo}/branches`);
      const branches = response.data;
      
      if (Array.isArray(branches)) {
        setProjectBranches(projectId, branches);
        return branches;
      }
      return [];
    } catch (error: any) {
      console.error("Error refreshing branches:", error);
      if (error.response?.status === 401) {
        clearAuthData();
        router.replace("/");
      }
      return [];
    }
  }, [router]);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        isLoading,
        setActiveProject,
        setActiveBranch,
        setProjectBranches,
        addProject,
        setProjects: setProjectsState,
        refreshProjects,
        refreshBranches,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}
