import type { Workspace } from "../types/kanban";

const today = new Date().toISOString().slice(0, 10);
export const initialWorkspace: Workspace = {
  activeBoardId: "personal",
  labels: [
    { id: "design", name: "Design", color: "#8b5cf6" }, { id: "work", name: "Work", color: "#38bdf8" },
    { id: "health", name: "Health", color: "#34d399" }, { id: "idea", name: "Idea", color: "#fb7185" },
  ],
  boards: [{ id: "personal", title: "Personal HQ", emoji: "✦", columns: [
    { id: "inbox", title: "Inbox", color: "#94a3b8", tasks: [
      { id: "t1", title: "Sketch the new dashboard flow", description: "Map the first-run experience and the weekly overview.", priority: "high", labels: ["design"], dueDate: today, completed: false, createdAt: today },
      { id: "t2", title: "Reply to project notes", description: "Share an update and clarify the remaining decisions.", priority: "medium", labels: ["work"], completed: false, createdAt: today },
    ] },
    { id: "progress", title: "In Progress", color: "#fbbf24", tasks: [
      { id: "t3", title: "Morning strength session", description: "30 minutes. Keep it simple and consistent.", priority: "medium", labels: ["health"], dueDate: today, completed: false, createdAt: today },
      { id: "t4", title: "Write product launch outline", description: "A concise narrative for the launch page.", priority: "high", labels: ["work", "idea"], completed: false, createdAt: today },
    ] },
    { id: "review", title: "Review", color: "#c084fc", tasks: [
      { id: "t5", title: "Organize inspiration library", description: "Archive the references worth revisiting.", priority: "low", labels: ["design"], completed: false, createdAt: today },
    ] },
    { id: "done", title: "Done", color: "#34d399", tasks: [
      { id: "t6", title: "Plan this week", description: "Choose the few things that matter.", priority: "low", labels: ["work"], completed: true, createdAt: today },
    ] },
  ] }]
};
