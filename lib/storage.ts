import type { Workspace } from "../types/kanban";
import { initialWorkspace } from "./seed";
const key = "darkdesk-workspace-v1";
export const loadWorkspace = (): Workspace => { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as Workspace : initialWorkspace; } catch { return initialWorkspace; } };
export const saveWorkspace = (workspace: Workspace) => localStorage.setItem(key, JSON.stringify(workspace));
