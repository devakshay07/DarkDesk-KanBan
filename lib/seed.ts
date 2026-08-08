import type { Workspace } from "../types/kanban";

const today = new Date().toISOString().slice(0, 10);
export const initialWorkspace: Workspace = {
  activeBoardId: "11111111-1111-4111-8111-111111111111",
  labels: [
    { id: "design", name: "Design", color: "#8b5cf6" }, { id: "work", name: "Work", color: "#38bdf8" },
    { id: "health", name: "Health", color: "#34d399" }, { id: "idea", name: "Idea", color: "#fb7185" },
  ],
  boards: [{ id: "11111111-1111-4111-8111-111111111111", title: "Personal HQ", emoji: "✦", columns: [
    { id: "22222222-2222-4222-8222-222222222222", title: "Inbox", color: "#94a3b8", tasks: [
      { id: "33333333-3333-4333-8333-333333333331", title: "Sketch the new dashboard flow", description: "Map the first-run experience and the weekly overview.", priority: "high", labels: ["design"], dueDate: today, completed: false, createdAt: today },
      { id: "33333333-3333-4333-8333-333333333332", title: "Reply to project notes", description: "Share an update and clarify the remaining decisions.", priority: "medium", labels: ["work"], completed: false, createdAt: today },
    ] },
    { id: "22222222-2222-4222-8222-333333333333", title: "In Progress", color: "#fbbf24", tasks: [
      { id: "33333333-3333-4333-8333-333333333333", title: "Morning strength session", description: "30 minutes. Keep it simple and consistent.", priority: "medium", labels: ["health"], dueDate: today, completed: false, createdAt: today },
      { id: "33333333-3333-4333-8333-333333333334", title: "Write product launch outline", description: "A concise narrative for the launch page.", priority: "high", labels: ["work", "idea"], completed: false, createdAt: today },
    ] },
    { id: "22222222-2222-4222-8222-444444444444", title: "Review", color: "#c084fc", tasks: [
      { id: "33333333-3333-4333-8333-333333333335", title: "Organize inspiration library", description: "Archive the references worth revisiting.", priority: "low", labels: ["design"], completed: false, createdAt: today },
    ] },
    { id: "22222222-2222-4222-8222-555555555555", title: "Done", color: "#34d399", tasks: [
      { id: "33333333-3333-4333-8333-333333333336", title: "Plan this week", description: "Choose the few things that matter.", priority: "low", labels: ["work"], completed: true, createdAt: today },
    ] },
  ] }]
};
