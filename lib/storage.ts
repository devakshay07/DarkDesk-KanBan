import type { Workspace } from "../types/kanban";
import { initialWorkspace } from "./seed";

const key = "darkdesk-workspace-v1";

export const clearWorkspaceCache = () => {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore storage errors in privacy modes
  }
};

export const loadWorkspace = (): Workspace => {
  try {
    const value = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    return value ? (JSON.parse(value) as Workspace) : initialWorkspace;
  } catch {
    return initialWorkspace;
  }
};

export const saveWorkspace = (workspace: Workspace) => {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(workspace));
    }
  } catch {
    // Ignore storage errors
  }
};
